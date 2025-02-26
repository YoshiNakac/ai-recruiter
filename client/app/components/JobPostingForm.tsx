'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { generateQuestions } from '../lib/ai';
import { extractTextFromPDF } from '../lib/pdf-simple';

const JobPostingForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(true);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPdfFile(file);
      setError('');
      
      try {
        setIsLoading(true);
        const text = await extractTextFromPDF(file);
        
        if (text.includes("temporarily disabled") || text.includes("No text could be extracted") || text.trim() === '') {
          setError('Could not extract text from PDF. Please enter text manually.');
          setShowManualInput(true);
          setExtractedText('');
        } else {
          setExtractedText(text);
          setShowManualInput(false);
        }
      } catch (err) {
        console.error('Error extracting text:', err);
        setError('Unable to parse PDF. Please enter the job description manually.');
        setShowManualInput(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the job description from either source
    const jobDescription = showManualInput ? manualInput : extractedText;
    
    // Validate required fields
    if (!title) {
      setError('Job title is required');
      return;
    }
    
    if (!jobDescription || jobDescription.trim() === '') {
      setError('Job description is required. Please either upload a PDF or enter the description manually.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Generate questions using AI
      const questions = await generateQuestions(jobDescription);

      // Save to Supabase including PDF URL if available
      let pdfUrl = null;
      if (pdfFile) {
        try {
          const fileName = `${Date.now()}_${pdfFile.name}`;
          const { data, error: uploadError } = await supabase.storage
            .from('job_pdfs')
            .upload(fileName, pdfFile);
            
          if (uploadError) throw uploadError;
          
          const { data: urlData } = supabase.storage
            .from('job_pdfs')
            .getPublicUrl(fileName);
            
          pdfUrl = urlData.publicUrl;
        } catch (uploadErr) {
          console.error('Error uploading PDF:', uploadErr);
          // Continue even if PDF upload fails
        }
      }
      
      const { data, error } = await supabase
        .from('job_postings')
        .insert([
          { 
            title, 
            description: jobDescription, 
            pdf_url: pdfUrl, 
            questions 
          },
        ])
        .select();

      if (error) throw error;

      // Redirect to survey
      router.push(`/survey/${data[0].id}`);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to process job posting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-2 text-indigo-600">Processing...</p>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-4">Enter Job Posting Details</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="pdfUpload" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Job Description PDF (optional)
          </label>
          <input
            type="file"
            id="pdfUpload"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {pdfFile && (
            <div className="mt-3 text-sm text-gray-500">
              Selected file: {pdfFile.name}
            </div>
          )}
          {!pdfFile && !manualInput && (
            <div className="mt-2 text-sm text-gray-500">
              You can either upload a PDF or manually enter the job description below.
            </div>
          )}
        </div>
        
        {/* Always show manual input if no extracted text or if showManualInput is true */}
        {(showManualInput || !extractedText) && (
          <div className="mb-6">
            <label htmlFor="manualInput" className="block text-sm font-medium text-gray-700 mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="manualInput"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Paste the job description here..."
              required={!extractedText}
            />
          </div>
        )}
        
        {/* Show extracted text if available */}
        {extractedText && !showManualInput && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extracted Text
            </label>
            <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {extractedText.length > 500 
                  ? extractedText.substring(0, 500) + '...' 
                  : extractedText}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm focus:outline-none"
            >
              Enter job description manually instead
            </button>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || (!extractedText && !manualInput) || !title}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            (isLoading || (!extractedText && !manualInput) || !title) ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Generating Questions...' : 'Generate Survey Questions'}
        </button>
      </form>
    </div>
  );
};

export default JobPostingForm;