// lib/htmlToPdf.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react'; // EKSİK IMPORT EKLENDİ
import { createRoot } from 'react-dom/client'; // EKSİK IMPORT EKLENDİ
import PdfTemplate from '../components/pdf/PdfTemplate';
import { EnhancedFormData } from './enhancedFormStorage';

export async function generatePdfFromHtml(formData: EnhancedFormData): Promise<{ previewUrl: string, pdfBytes: Uint8Array }> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-300mm';
  container.style.top = '0';
  document.body.appendChild(container);

  const root = createRoot(container);
  await new Promise<void>((resolve) => {
    root.render(React.createElement(PdfTemplate, { formData }));
    setTimeout(resolve, 500);
  });

  const canvas = await html2canvas(container, {
    scale: 2, // Reduced from 3 to 2 for smaller file sizes
    useCORS: true,
    allowTaint: true,
  });
  
  root.unmount();
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const canvasAspectRatio = canvas.height / canvas.width;
  
  let finalImgWidth = pdfWidth;
  let finalImgHeight = pdfWidth * canvasAspectRatio;

  if (finalImgHeight > pdfHeight) {
      finalImgHeight = pdfHeight;
      finalImgWidth = pdfHeight / canvasAspectRatio;
  }
  
  const xOffset = (pdfWidth - finalImgWidth) / 2;
  const yOffset = (pdfHeight - finalImgHeight) / 2;
  pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);

  const pdfBytes = pdf.output('arraybuffer');
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const previewUrl = URL.createObjectURL(blob);

  return { previewUrl, pdfBytes: new Uint8Array(pdfBytes) };
}