'use client';

import React, { useState } from 'react';
import { SurveyQuestion as SurveyQuestionType } from '../lib/types';
import AudioRecorder from './AudioRecorder';
import { uploadAudio } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SurveyQuestionProps {
  question: SurveyQuestionType;
  jobPostingId: string;
  currentIndex: number;
  totalQuestions: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

const SurveyQuestion: React.FC<SurveyQuestionProps> = ({
  question,
  jobPostingId,
  currentIndex,
  totalQuestions,
  onNext,
  onPrevious,
  onComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
  };

  const handleNext = async () => {
    if (!audioBlob) {
      setError('Please record an answer before continuing');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      // Upload audio to Supabase storage
      const audioUrl = await uploadAudio(audioBlob, jobPostingId, question.id);

      // Store response in database
      const { error } = await supabase
        .from('survey_responses')
        .insert([
          {
            job_posting_id: jobPostingId,
            question_id: question.id,
            audio_url: audioUrl,
          },
        ]);

      if (error) throw error;

      // Reset audio state before moving to next question
      setAudioBlob(null);
      
      // Go to next question or complete survey
      if (isLastQuestion) {
        onComplete();
      } else {
        onNext();
      }
    } catch (err) {
      console.error('Error saving response:', err);
      setError('Failed to save your response. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-500">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-medium text-gray-800">{question.question}</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-8">
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          isRecording={isRecording}
          setIsRecording={setIsRecording}
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0 || isRecording || isUploading}
          className={`py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            (currentIndex === 0 || isRecording || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={isRecording || isUploading || !audioBlob}
          className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            (isRecording || isUploading || !audioBlob) ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? 'Saving...' : isLastQuestion ? 'Complete Survey' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default SurveyQuestion;