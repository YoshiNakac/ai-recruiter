import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

export async function uploadAudio(audioBlob: Blob, jobPostingId: string, questionId: number): Promise<string> {
  const fileName = `${jobPostingId}/${questionId}_${uuidv4()}.webm`;
  
  const { error } = await supabase.storage
    .from('audio_recordings')
    .upload(fileName, audioBlob, {
      contentType: 'audio/webm',
    });

  if (error) {
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('audio_recordings')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}


export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}


export async function uploadPDF(pdfFile: File): Promise<{ url: string; text: string }> {
  const fileName = `${uuidv4()}.pdf`;
  
  const { error } = await supabase.storage
    .from('job_pdfs')
    .upload(fileName, pdfFile, {
      contentType: 'application/pdf',
    });

  if (error) {
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from('job_pdfs')
    .getPublicUrl(fileName);

  // Extract text from PDF
  const pdfText = await extractTextFromPDF(pdfFile);
  
  return {
    url: urlData.publicUrl,
    text: pdfText
  };
}

import { pdfjsLib } from './pdf-helper';

export async function extractTextFromPDF(pdfFile: File): Promise<string> {
  try {
    // Convert file to ArrayBuffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Create a document loading task
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableFontFace: true,  // This can help with compatibility
      useSystemFonts: false   // This can help with compatibility
    });
    
    // Load the PDF document
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    // Iterate through each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        // Get the page
        const page = await pdf.getPage(i);
        // Extract text content
        const textContent = await page.getTextContent();
        
        // Process the text items
        let pageText = '';
        for (const item of textContent.items) {
          // Check if the item has a string property
          if ('str' in item) {
            pageText += item.str + ' ';
          }
        }
            
        fullText += pageText + '\n';
      } catch (pageError) {
        console.error(`Error on page ${i}:`, pageError);
      }
    }
    
    return fullText || 'No text could be extracted from the PDF. Please enter text manually.';
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. Please enter text manually.');
  }
}