// ChatGPT-powered PDF text extraction
export async function extractTextFromPDF(pdfFile: File): Promise<string> {
  try {
    // Create FormData for the API call
    const formData = new FormData();
    formData.append('pdfFile', pdfFile);
    
    // Using the Next.js API route to process the PDF
    const response = await fetch('/api/extract-pdf-text', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to extract text from PDF');
    }
    
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error processing PDF:', error);
    return "PDF text extraction failed. Please enter job description manually.";
  }
}