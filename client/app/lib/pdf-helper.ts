import * as pdfjsLib from 'pdfjs-dist';

// The worker must be loaded this way for Next.js
if (typeof window !== 'undefined' && 'Worker' in window) {
  // For browser environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export { pdfjsLib };