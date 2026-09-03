import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Setup local or fast unpkg worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function extractTextFromPDF(
  file: File, 
  onProgress?: (msg: string) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`Reading page ${i} of ${pdf.numPages}...`);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => (item as any).str);
    const pageText = strings.join(' ').trim();
    
    // If the PDF has digital selectable text
    if (pageText.length > 40) {
      fullText += pageText + '\n';
    } else {
      // Scanned Document Image inside PDF -> Render high-res canvas and OCR
      onProgress?.(`Running OCR on scanned page ${i}...`);
      try {
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const ocrResult = await performOCR(canvas, onProgress);
          fullText += ocrResult + '\n';
        }
      } catch (e) {
        console.warn('Canvas render/OCR error on page', i, e);
      }
    }
  }

  return fullText.trim();
}

export async function extractTextFromImage(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  return performOCR(file, onProgress);
}

async function performOCR(
  imageSource: HTMLCanvasElement | File,
  onProgress?: (msg: string) => void
): Promise<string> {
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        const pct = Math.round((m.progress || 0) * 100);
        onProgress?.(`Recognizing text: ${pct}%`);
      }
    }
  });
  
  const ret = await worker.recognize(imageSource);
  await worker.terminate();
  return ret.data.text.trim();
}
