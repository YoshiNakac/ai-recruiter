'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import SurveyQuestion from '../../components/SurveyQuestion';
import { JobPosting } from '../../lib/types';

export default function SurveyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  useEffect(() => {
    const fetchJobPosting = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('job_postings')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        setJobPosting(data);
      } catch (err) {
        console.error('Error fetching job posting:', err);
        setError('Failed to load survey questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobPosting();
  }, [id]);
  
  const handleNext = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
  };
  
  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
  };
  
  const handleComplete = () => {
    router.push('/thank-you');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (error || !jobPosting) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h2 className="text-lg font-medium text-red-800">Error</h2>
        <p className="text-red-700">{error || 'Failed to load survey'}</p>
      </div>
    );
  }
  
  const questions = jobPosting.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  
  // Use key prop to force re-render of SurveyQuestion component when question changes
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {jobPosting.title}
        </h1>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-2" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {currentQuestion && (
        <SurveyQuestion
          key={`question-${currentQuestionIndex}`} // Add key to force re-render
          question={currentQuestion}
          jobPostingId={jobPosting.id}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}