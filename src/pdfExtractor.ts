import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    const pageText = strings.join(' ').trim();
    
    if (pageText.length > 20) {
      fullText += pageText + '\n';
    } else {
      // Scanned Image inside PDF fallback -> Render page to canvas and OCR
      try {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const ocrText = await performOCR(canvas);
          fullText += ocrText + '\n';
        }
      } catch (e) {
        console.warn('OCR on page failed:', e);
      }
    }
  }

  return fullText.trim();
}

export async function extractTextFromImage(file: File): Promise<string> {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(file);
  await worker.terminate();
  return ret.data.text.trim();
}

async function performOCR(canvas: HTMLCanvasElement): Promise<string> {
  const worker = await createWorker('eng');
  const ret = await worker.recognize(canvas);
  await worker.terminate();
  return ret.data.text.trim();
}
