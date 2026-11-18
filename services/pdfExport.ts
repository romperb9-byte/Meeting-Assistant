import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ExportPdfOptions {
  element: HTMLElement;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
}

export const exportElementToPdf = async ({
  element,
  filename,
  orientation = 'portrait',
  marginMm = 10,
}: ExportPdfOptions): Promise<void> => {
  // Ensure document fonts are loaded before capturing
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(element, {
    scale: 2.5, // 2.5x scale provides crisp, high-definition text for Khmer ligatures & fonts
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    ignoreElements: (el) => {
      return (
        el.classList.contains('print:hidden') ||
        el.classList.contains('no-print') ||
        el.classList.contains('no-pdf')
      );
    },
  });

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;

  const contentWidthMm = pageWidth - marginMm * 2;
  const contentHeightMm = pageHeight - marginMm * 2;

  const mmPerPx = contentWidthMm / canvas.width;
  const totalHeightMm = canvas.height * mmPerPx;

  if (totalHeightMm <= contentHeightMm) {
    // Single page
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(
      imgData,
      'JPEG',
      marginMm,
      marginMm,
      contentWidthMm,
      totalHeightMm,
      undefined,
      'FAST'
    );
  } else {
    // Multi-page export with clean slice
    const pageCanvasHeightPx = Math.floor(contentHeightMm / mmPerPx);
    let renderedHeightPx = 0;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    const ctx = pageCanvas.getContext('2d');

    let pageNum = 0;
    while (renderedHeightPx < canvas.height) {
      if (pageNum > 0) {
        pdf.addPage();
      }

      const currentSliceHeightPx = Math.min(
        pageCanvasHeightPx,
        canvas.height - renderedHeightPx
      );
      pageCanvas.height = currentSliceHeightPx;

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, currentSliceHeightPx);
        ctx.drawImage(
          canvas,
          0,
          renderedHeightPx,
          canvas.width,
          currentSliceHeightPx,
          0,
          0,
          pageCanvas.width,
          currentSliceHeightPx
        );
      }

      const sliceData = pageCanvas.toDataURL('image/jpeg', 0.95);
      const sliceHeightMm = currentSliceHeightPx * mmPerPx;
      pdf.addImage(
        sliceData,
        'JPEG',
        marginMm,
        marginMm,
        contentWidthMm,
        sliceHeightMm,
        undefined,
        'FAST'
      );

      renderedHeightPx += currentSliceHeightPx;
      pageNum++;
    }
  }

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(cleanFilename);
};
