import { createRoot } from 'react-dom/client';
import React from 'react';
import { PurchaseOrderA4Preview } from '../components/PurchaseOrderA4Preview';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface PoPdfGeneratorProps {
  po: any;
  inventory: any[];
  formatNum: (val: number) => string;
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  profile?: any;
}

export async function generatePO_PDF({ po, inventory, formatNum, showToast, profile }: PoPdfGeneratorProps) {
  let container: HTMLDivElement | null = null;
  let root: any = null;
  try {
    container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '210mm'; 
    document.body.appendChild(container);

    root = createRoot(container);
    
    // We render the preview exactly as it is, enforcing A4 width
    // Using 0mm padding so the component takes up the whole space, but we'll add 2mm margin in jsPDF
    root.render(
      React.createElement(
        'div',
        { className: "bg-white", style: { width: '210mm', minHeight: '297mm', padding: '0mm' } },
        React.createElement(PurchaseOrderA4Preview, { po, inventory, profile, formatNum, isPdf: true })
      )
    );

    // Wait for render and images to load
    await new Promise(resolve => setTimeout(resolve, 1500));

    const poNum = po.id || "PO-DRAFT";
    const cleanSupplier = (po.supplier || 'Supplier').trim().replace(/[^a-zA-Z0-9]/g, '_');
    const formattedDate = new Date(po.date || Date.now()).toISOString().split('T')[0];
    const pdfFilename = `VyaparMitra_PurchaseOrder_${poNum}_${cleanSupplier}_${formattedDate}.pdf`;

    const imgData = await toJpeg(container.firstElementChild as HTMLElement, {
      quality: 1,
      pixelRatio: 4,
      skipFonts: true
    });

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    // 2mm margin
    const margin = 2;
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const usableWidth = pdfWidth - (margin * 2);
    const usableHeight = pdfHeight - (margin * 2);

    // We can assume the image maintains the A4 aspect ratio 210/297 because we forced width to 210mm
    // But we'll just scale it to fit usable space
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = Math.min(usableWidth / imgProps.width, usableHeight / imgProps.height);
    
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;

    pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
    pdf.save(pdfFilename);

    showToast(`Purchase Order downloaded successfully!`, "success");

  } catch (e: any) {
    console.error("PDF generation error:", e);
    showToast(`Error exporting PDF: ${e.message}`, "error");
  } finally {
    if (root) {
      root.unmount();
    }
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
