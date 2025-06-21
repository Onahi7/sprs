import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
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

// Helper function to generate barcode image
function generateBarcodeBase64(data: string): string | null {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 60;
      
      JsBarcode(canvas, data, {
        format: "CODE128",
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0,
        background: "#ffffff",
        lineColor: "#000000"
      });
      
      return canvas.toDataURL('image/png');
    }
    
    // For server-side, we'll use a fallback or could implement with node-canvas
    return null;
  } catch (error) {
    console.error('Error generating barcode:', error);
    return null;
  }
}
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
      // Payment details - price removed as per requirements
    doc.setTextColor(...primaryText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Status: Confirmed', 60, yPos + 6);
    
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
    doc.text('• Arrive at the examination center 30 minutes before the scheduled time', 25, yPos + 14);    doc.text('• Bring valid identification and writing materials', 25, yPos + 17);
    
    // Authentication barcode section
    yPos += 35;
    
    // Generate professional barcode using JsBarcode
    const barcodeData = `NAPPS${registration.registrationNumber}${new Date().getFullYear()}`;
    const barcodeX = 15;
    const barcodeY = yPos;
    const barcodeWidth = 80;
    const barcodeHeight = 12;
    
    // Try to generate a professional barcode
    const barcodeImage = generateBarcodeBase64(barcodeData);
    
    if (barcodeImage) {
      // Add the generated barcode image
      doc.addImage(barcodeImage, 'PNG', barcodeX, barcodeY, barcodeWidth, barcodeHeight);
    } else {
      // Fallback to enhanced simple barcode representation
      doc.setFillColor(...primaryText);
      doc.setLineWidth(0.3);
      
      // Create a more professional-looking barcode pattern
      let barX = barcodeX;
      const pattern = barcodeData.split('').map(char => char.charCodeAt(0));
      
      for (let i = 0; i < pattern.length && barX < barcodeX + barcodeWidth; i++) {
        const value = pattern[i] % 10;
        
        // Create varying bar widths based on the character value
        for (let j = 0; j < 3; j++) {
          const barWidth = ((value + j) % 3) + 0.5;
          const shouldDraw = (value + j) % 2 === 0;
          
          if (shouldDraw) {
            doc.setFillColor(...primaryText);
            doc.rect(barX, barcodeY, barWidth, barcodeHeight, 'F');
          }
          
          barX += barWidth + 0.3;
          if (barX >= barcodeX + barcodeWidth) break;
        }
      }
      
      // Add border around barcode
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.5);
      doc.rect(barcodeX - 1, barcodeY - 1, barcodeWidth + 2, barcodeHeight + 2, 'S');
    }
    
    // Barcode label
    doc.setTextColor(...secondaryText);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Verification Code:', barcodeX, barcodeY + barcodeHeight + 4);
    doc.text(barcodeData, barcodeX, barcodeY + barcodeHeight + 8);
    
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

// New interface for result slip PDF generation
export interface ResultSlipData {
  student: {
    registrationNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    class?: string;
    centerName: string;
    chapterName: string;
    schoolName: string;
    passportUrl?: string;
  };
  subjects: Array<{
    id: number;
    name: string;
    maxScore: number;
  }>;
  results: { [subjectId: number]: { score: number; grade: string } };
  totalScore: number;
  totalMaxScore: number;
  averagePercentage: number;
  overallGrade: string;
  centerPosition?: number;
}

export async function generateResultSlipPDF(resultData: ResultSlipData): Promise<Buffer> {
  try {
    // Create a new jsPDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color scheme
    const nappsGreen = [0, 128, 55] as const;
    const primaryText = [33, 37, 41] as const;
    const secondaryText = [108, 117, 125] as const;
    const redText = [220, 53, 69] as const;
    const white = [255, 255, 255] as const;
    const lightGray = [248, 249, 250] as const;
    const borderColor = [0, 0, 0] as const;

    // Set clean white background
    doc.setFillColor(...white);
    doc.rect(0, 0, 210, 297, 'F');

    let yPos = 15;

    // Main border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(2);
    doc.rect(10, 10, 190, 270);

    // Header section with border
    doc.setLineWidth(1);
    doc.rect(15, 15, 180, 50);

    // Logo area (left side)
    const logoX = 20;
    const logoY = 20;
    const logoSize = 20;
    
    // Simplified logo placeholder
    doc.setFillColor(...nappsGreen);
    doc.circle(logoX + logoSize/2, logoY + logoSize/2, 8, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('N', logoX + logoSize/2, logoY + logoSize/2 + 2, { align: 'center' });

    // Organization header (center-left)
    yPos = 25;
    doc.setTextColor(...primaryText);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NAPPS NASARAWA STATE CHAPTER', 50, yPos);
    
    yPos += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Besides SALAMATU Hall Lafia, Jos Road', 50, yPos);
    
    yPos += 4;
    doc.text('Napps Nasarawa State Unified Certificate Examination', 50, yPos);
    
    yPos += 4;
    doc.text('(NNSUCE-2024)', 50, yPos);

    // Result Slip title and date (right side)
    doc.setTextColor(...redText);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESULT SLIP', 170, 30, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text('Exam Date: 08/06/24', 170, 40, { align: 'center' });

    // Candidate Details section
    yPos = 75;
    doc.setTextColor(...primaryText);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Candidate Details', 20, yPos);

    // Student information (left side)
    yPos += 10;
    const infoX = 20;
    
    const addInfoRow = (label: string, value: string, y: number) => {
      doc.setTextColor(...secondaryText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(label, infoX, y);
      
      doc.setTextColor(...primaryText);
      doc.setFont('helvetica', 'normal');
      doc.text(value, infoX + 45, y);
    };

    const fullName = `${resultData.student.firstName} ${resultData.student.lastName}`.toUpperCase();
    
    addInfoRow('Student Name:', fullName, yPos);
    yPos += 8;
    
    addInfoRow('Registration Number:', resultData.student.registrationNumber, yPos);
    yPos += 8;
    
    addInfoRow('Center Name:', resultData.student.centerName, yPos);
    yPos += 8;
    
    addInfoRow('School Name:', resultData.student.schoolName, yPos);

    // Student photo (right side)
    const photoX = 150;
    const photoY = 85;
    const photoWidth = 30;
    const photoHeight = 40;
    
    if (resultData.student.passportUrl) {
      try {
        const base64Image = await imageUrlToBase64(resultData.student.passportUrl);
        doc.addImage(base64Image, 'JPEG', photoX, photoY, photoWidth, photoHeight);
      } catch (error) {
        // Fallback placeholder
        doc.setFillColor(...lightGray);
        doc.rect(photoX, photoY, photoWidth, photoHeight, 'F');
      }
    } else {
      // Placeholder
      doc.setFillColor(...lightGray);
      doc.rect(photoX, photoY, photoWidth, photoHeight, 'F');
    }
    
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(1);
    doc.rect(photoX, photoY, photoWidth, photoHeight);

    // Subjects table
    yPos = 140;
    
    // Table header
    const tableX = 20;
    const subjectColWidth = 100;
    const scoreColWidth = 60;
    
    doc.setFillColor(...nappsGreen);
    doc.rect(tableX, yPos, subjectColWidth, 12, 'F');
    doc.rect(tableX + subjectColWidth, yPos, scoreColWidth, 12, 'F');
    
    doc.setTextColor(...white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT', tableX + 5, yPos + 8);
    doc.text('SCORE', tableX + subjectColWidth + 25, yPos + 8);
    
    // Table borders
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(1);
    doc.rect(tableX, yPos, subjectColWidth + scoreColWidth, 12);
    
    yPos += 12;
    
    // Subject rows
    resultData.subjects.forEach((subject, index) => {
      const result = resultData.results[subject.id];
      const isEven = index % 2 === 0;
      
      // Row background
      if (isEven) {
        doc.setFillColor(240, 240, 240);
      } else {
        doc.setFillColor(255, 255, 200); // Light yellow
      }
      doc.rect(tableX, yPos, subjectColWidth + scoreColWidth, 10, 'F');
      
      // Row text
      doc.setTextColor(...primaryText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(subject.name, tableX + 5, yPos + 7);
      
      doc.setFontSize(12);
      doc.text(result.score.toString(), tableX + subjectColWidth + 25, yPos + 7);
      
      // Row border
      doc.setDrawColor(...borderColor);
      doc.rect(tableX, yPos, subjectColWidth + scoreColWidth, 10);
      
      yPos += 10;
    });

    // Total and Position
    yPos += 15;
    
    // Total box
    doc.setFillColor(200, 200, 200);
    doc.rect(30, yPos, 40, 15, 'F');
    doc.setDrawColor(...borderColor);
    doc.rect(30, yPos, 40, 15);
    
    doc.setTextColor(...primaryText);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 35, yPos + 6);
    doc.setFontSize(14);
    doc.text(resultData.totalScore.toString(), 50, yPos + 12);

    // Position box (if available)
    if (resultData.centerPosition && resultData.centerPosition > 0) {
      doc.setFillColor(200, 200, 200);
      doc.rect(120, yPos, 50, 15, 'F');
      doc.setDrawColor(...borderColor);
      doc.rect(120, yPos, 50, 15);
      
      doc.setFontSize(11);
      doc.text('Center Position', 125, yPos + 6);
      doc.setFontSize(14);
      const ordinal = getOrdinalSuffix(resultData.centerPosition);
      doc.text(`${resultData.centerPosition}${ordinal}`, 145, yPos + 12);
    }

    // Signature section
    yPos += 40;
    
    // Signature line
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(1);
    doc.line(30, yPos, 80, yPos);
    
    yPos += 5;
    doc.setTextColor(...primaryText);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Opah Omaku Ogan', 55, yPos, { align: 'center' });
    
    yPos += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('State Chairman', 55, yPos, { align: 'center' });

    // Barcode area
    const barcodeX = 120;
    const barcodeY = yPos - 25;
    
    // Simple barcode representation
    doc.setFillColor(...primaryText);
    for (let i = 0; i < 15; i++) {
      const barWidth = Math.random() > 0.5 ? 1 : 2;
      const barHeight = 20;
      doc.rect(barcodeX + (i * 3), barcodeY, barWidth, barHeight, 'F');
    }
    
    doc.setFontSize(7);
    doc.text(resultData.student.registrationNumber, barcodeX + 22, barcodeY + 25, { align: 'center' });

    // Footer
    yPos = 260;
    doc.setTextColor(...secondaryText);
    doc.setFontSize(8);
    doc.text('This is an official document of NAPPS Nasarawa State Chapter', 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.text('For verification or inquiries, contact the examination body', 105, yPos, { align: 'center' });

    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
    
  } catch (error) {
    console.error('Error generating result slip PDF:', error);
    throw error;
  }
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

// Export default for compatibility
export default generateRegistrationSlipPDF;
