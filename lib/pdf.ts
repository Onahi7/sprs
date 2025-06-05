import jsPDF from 'jspdf';
import { formatDate } from "@/lib/utils";

interface RegistrationData {
  id: number;
  registrationNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  chapterId: number | null;
  schoolId: number | null;
  schoolName?: string | null;
  centerId: number | null;
  parentFirstName: string;
  parentLastName: string;
  parentPhone: string;
  parentEmail: string;
  parentConsent: boolean | null;
  passportUrl: string;
  paymentStatus: "pending" | "completed";
  paymentReference?: string | null;
  createdAt: Date | null;
  chapter?: {
    id: number;
    name: string;
    splitCode?: string | null;
    amount?: string | null;
    createdAt: Date | null;
  } | null;
  school?: {
    id: number;
    chapterId: number | null;
    name: string;
    createdAt: Date | null;
  } | null;
  center?: {
    id: number;
    chapterId: number | null;
    name: string;
    createdAt: Date | null;
  } | null;
}

// Helper function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Determine the MIME type from the URL or response headers
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

export async function generateRegistrationSlipPDF(registration: RegistrationData): Promise<Buffer> {
  try {
    // Create a new jsPDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Modern color scheme - Nigerian green and professional colors
    const nappsGreen = [0, 128, 55] as const; // Nigerian green
    const nappsGold = [255, 193, 7] as const; // Professional gold
    const primaryText = [33, 37, 41] as const; // Dark text
    const secondaryText = [108, 117, 125] as const; // Gray text
    const successGreen = [40, 167, 69] as const; // Success green
    const dangerRed = [220, 53, 69] as const; // Danger red
    const lightBg = [248, 249, 250] as const; // Light background
    const white = [255, 255, 255] as const;
    const borderColor = [222, 226, 230] as const;    // Set clean white background
    doc.setFillColor(...white);
    doc.rect(0, 0, 210, 297, 'F');    // Enhanced NAPPS2025 Watermark - behind all content
    doc.setTextColor(245, 245, 245); // Very light gray instead of transparency
    doc.setFontSize(70);
    doc.setFont('helvetica', 'bold');
    const centerX = 105;
    const centerY = 148;
    doc.text('NAPPS2025', centerX, centerY, { 
      angle: -45, 
      align: 'center',
    });// Header section with professional design and logo
    let yPos = 15; // More compact start
    
    // Top border accent
    doc.setFillColor(...nappsGreen);
    doc.rect(0, 0, 210, 3, 'F');
      // Enhanced NAPPS Logo - using actual logo image
    const logoX = 15;
    const logoY = 15;
    const logoSize = 25;
    
    try {
      // Load the actual NAPPS logo from Cloudinary
      const logoUrl = 'https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png';
      const logoBase64 = await imageUrlToBase64(logoUrl);
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.warn('Could not load logo, using fallback:', error);
      // Fallback logo design
      doc.setFillColor(34, 139, 34); // Forest green
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, 10, 'F');
      
      // Inner gold circle
      doc.setFillColor(255, 215, 0); // Gold
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, 7, 'F');
      
      // Logo text "N"
      doc.setTextColor(34, 139, 34);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('N', logoX + logoSize/2, logoY + logoSize/2, { align: 'center' });
      
      // Banner below logo
      doc.setFillColor(255, 215, 0);
      doc.roundedRect(logoX + logoSize/2 - 8, logoY + logoSize/2 + 8, 16, 5, 2, 2, 'F');
      doc.setTextColor(34, 139, 34);
      doc.setFontSize(6);
      doc.text('NAPPS', logoX + logoSize/2, logoY + logoSize/2 + 11, { align: 'center' });    }
    
    // Organization header - positioned to work with logo
    doc.setTextColor(...nappsGreen);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('NAPPS NASARAWA', 105, 20, { align: 'center' });
    
    yPos = 27;
    doc.setTextColor(...secondaryText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('National Association of Proprietors of Private Schools', 105, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFillColor(...nappsGold);
    doc.roundedRect(50, yPos - 3, 110, 6, 2, 2, 'F');
    doc.setTextColor(...primaryText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('UNIFIED EXAMINATION REGISTRATION SLIP', 105, yPos, { align: 'center' });
    
    yPos += 7;
    doc.setTextColor(...secondaryText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Academic Session: 2024/2025', 105, yPos, { align: 'center' });

    // Main content container - more compact
    yPos += 15; // Reduced from 20
    const containerY = yPos;
    const containerHeight = 120; // Reduced from 140
    
    // Background container
    doc.setFillColor(...lightBg);
    doc.roundedRect(15, containerY, 180, containerHeight, 3, 3, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, containerY, 180, containerHeight, 3, 3, 'S');    // Photo section - right side, more compact
    const photoX = 150;
    const photoY = containerY + 10; // Reduced from 15
    const photoWidth = 30; // Reduced from 35
    const photoHeight = 40; // Reduced from 45
    
    if (registration.passportUrl) {
      try {
        const base64Image = await imageUrlToBase64(registration.passportUrl);
        doc.addImage(base64Image, 'JPEG', photoX, photoY, photoWidth, photoHeight);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.8);
        doc.rect(photoX, photoY, photoWidth, photoHeight);
      } catch (error) {
        console.warn('Could not load passport image, using placeholder:', error);
        // Professional placeholder
        doc.setFillColor(...white);
        doc.rect(photoX, photoY, photoWidth, photoHeight, 'F');
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.8);
        doc.rect(photoX, photoY, photoWidth, photoHeight);
        doc.setTextColor(...secondaryText);
        doc.setFontSize(8);
        doc.text('STUDENT', photoX + photoWidth/2, photoY + photoHeight/2 - 2, { align: 'center' });
        doc.text('PHOTO', photoX + photoWidth/2, photoY + photoHeight/2 + 3, { align: 'center' });
      }
    } else {
      // Professional placeholder
      doc.setFillColor(...white);
      doc.rect(photoX, photoY, photoWidth, photoHeight, 'F');
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.8);
      doc.rect(photoX, photoY, photoWidth, photoHeight);
      doc.setTextColor(...secondaryText);
      doc.setFontSize(8);
      doc.text('STUDENT', photoX + photoWidth/2, photoY + photoHeight/2 - 2, { align: 'center' });
      doc.text('PHOTO', photoX + photoWidth/2, photoY + photoHeight/2 + 3, { align: 'center' });
    }    // Student information section - left side, more compact
    const infoX = 25;
    let infoY = containerY + 15; // Reduced from 20
    
    // Helper function for information rows - more compact
    const addInfoRow = (label: string, value: string, y: number, highlight = false) => {
      doc.setTextColor(...secondaryText);
      doc.setFontSize(8); // Reduced from 9
      doc.setFont('helvetica', 'normal');
      doc.text(label, infoX, y);
      
      if (highlight) {
        doc.setTextColor(...nappsGreen);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(...primaryText);
        doc.setFont('helvetica', 'normal');
      }
      doc.setFontSize(9); // Reduced from 10
      doc.text(value, infoX, y + 3.5); // Reduced spacing from 4
      
      // Add subtle separator line
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.2);
      doc.line(infoX, y + 6, 140, y + 6); // Reduced from y + 7
    };    // Registration details - more compact spacing
    const fullName = `${registration.firstName} ${registration.middleName || ''} ${registration.lastName}`.trim();
    const schoolName = registration.schoolName || registration.school?.name || 'N/A';
    
    addInfoRow('Registration Number', registration.registrationNumber, infoY, true);
    infoY += 12; // Reduced from 15
    
    addInfoRow('Student Name', fullName.toUpperCase(), infoY);
    infoY += 12; // Reduced from 15
    
    addInfoRow('Chapter', registration.chapter?.name || 'N/A', infoY);
    infoY += 12; // Reduced from 15
    
    addInfoRow('School Name', schoolName.toUpperCase(), infoY);
    infoY += 12; // Reduced from 15
    
    addInfoRow('Examination Center', registration.center?.name || 'N/A', infoY);
    infoY += 12; // Reduced from 15
    
    addInfoRow('Registration Date', registration.createdAt ? formatDate(registration.createdAt) : 'N/A', infoY);    // Payment section - very compact
    yPos = containerY + containerHeight + 10;
    
    // Payment status badge
    const paymentStatus = registration.paymentStatus === "completed" ? "PAID" : "PENDING";
    const badgeColor = registration.paymentStatus === "completed" ? successGreen : dangerRed;
    
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(15, yPos, 35, 10, 3, 3, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(paymentStatus, 32.5, yPos + 6, { align: 'center' });
    
    // Payment details
    doc.setTextColor(...primaryText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Examination Fee: ₦3,000.00', 60, yPos + 6);
    
    if (registration.paymentReference && registration.paymentStatus === "completed") {
      yPos += 5;
      doc.setTextColor(...secondaryText);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Transaction ID: ${registration.paymentReference}`, 15, yPos + 5);
    }    // Instructions section - very compact
    yPos += 15;
    doc.setFillColor(255, 248, 225); // Light yellow background
    doc.roundedRect(15, yPos, 180, 22, 3, 3, 'F');
    doc.setDrawColor(255, 193, 7); // Gold border
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPos, 180, 22, 3, 3, 'S');
    
    doc.setTextColor(...primaryText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT INSTRUCTIONS:', 25, yPos + 6);
    
    doc.setTextColor(...secondaryText);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('• Present this slip on examination day for verification', 25, yPos + 11);
    doc.text('• Arrive at the examination center 30 minutes before the scheduled time', 25, yPos + 14);
    doc.text('• Bring valid identification and writing materials', 25, yPos + 17);// Authentication barcode section
    yPos += 35;
    
    // Generate a simple barcode using registration number
    const barcodeData = `NAPPS${registration.registrationNumber}${new Date().getFullYear()}`;
    const barcodeX = 15;
    const barcodeY = yPos;
    const barcodeWidth = 60;
    const barcodeHeight = 10;
    
    // Simple barcode representation using lines
    doc.setFillColor(...primaryText);
    let barX = barcodeX;
    for (let i = 0; i < barcodeData.length; i++) {
      const charCode = barcodeData.charCodeAt(i);
      const barWidth = (charCode % 3) + 1; // Variable width based on character
      if (i % 2 === 0) {
        doc.rect(barX, barcodeY, barWidth, barcodeHeight, 'F');
      }
      barX += barWidth + 0.5;
      if (barX > barcodeX + barcodeWidth) break;
    }
    
    // Barcode label
    doc.setTextColor(...secondaryText);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Verification Code:', barcodeX, barcodeY + barcodeHeight + 4);
    doc.text(barcodeData.substring(0, 20), barcodeX, barcodeY + barcodeHeight + 8);
    
    // Authentication stamp area
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(140, barcodeY - 2, 50, 18, 2, 2, 'S');
    doc.setTextColor(...nappsGreen);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('AUTHENTIC', 165, barcodeY + 3, { align: 'center' });
    doc.setTextColor(...secondaryText);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('NAPPS VERIFIED', 165, barcodeY + 8, { align: 'center' });
    doc.text(new Date().toLocaleDateString(), 165, barcodeY + 12, { align: 'center' });

    // Footer - more compact
    yPos += 25;
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);
    
    yPos += 6;
    doc.setTextColor(...secondaryText);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('For inquiries and verification, visit: www.portal.nappsnasarawa.com', 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.setTextColor(...nappsGreen);
    doc.setFont('helvetica', 'normal');
    doc.text('NAPPS Nasarawa - Committed to Educational Excellence', 105, yPos, { align: 'center' });

    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Create a simple fallback PDF
    const fallbackDoc = new jsPDF();
    fallbackDoc.setFontSize(16);
    fallbackDoc.text('NAPPS Registration Slip', 20, 20);
    fallbackDoc.setFontSize(12);
    fallbackDoc.text(`Registration Number: ${registration.registrationNumber}`, 20, 40);
    
    const fullName = `${registration.firstName} ${registration.middleName || ''} ${registration.lastName}`.trim();
    fallbackDoc.text(`Student Name: ${fullName}`, 20, 50);
    
    const schoolName = registration.schoolName || registration.school?.name || 'N/A';
    fallbackDoc.text(`School: ${schoolName}`, 20, 60);
    
    fallbackDoc.text(`Payment Status: ${registration.paymentStatus}`, 20, 70);
    fallbackDoc.text('Error occurred while generating detailed slip.', 20, 90);
    fallbackDoc.text('Please contact support for assistance.', 20, 100);
    
    const fallbackOutput = fallbackDoc.output('arraybuffer');
    return Buffer.from(fallbackOutput);
  }
}

// Export default for compatibility
export default generateRegistrationSlipPDF;
