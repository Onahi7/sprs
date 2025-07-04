import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
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
// Global image cache for performance optimization
const globalImageCache = new Map<string, string>()

async function imageUrlToBase64(url: string): Promise<string> {
  // Check cache first
  if (globalImageCache.has(url)) {
    return globalImageCache.get(url)!
  }

  try {
    const response = await fetch(url, {
      // Add timeout and optimize headers
      signal: AbortSignal.timeout(10000), // 10 second timeout
      headers: {
        'User-Agent': 'NAPPS-SPRS/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    // Determine the MIME type from the URL or response headers
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    // Cache the result (limit cache size to prevent memory issues)
    if (globalImageCache.size < 500) { // Max 500 cached images
      globalImageCache.set(url, dataUrl)
    }
    
    return dataUrl;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    
    // Return a lightweight placeholder instead of throwing
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNSAyMEMxNy4yMDkxIDIwIDE5IDIxLjc5MDkgMTkgMjRDMTkgMjYuMjA5MSAxNy4yMDkxIDI4IDE1IDI4QzEyLjc5MDkgMjggMTEgMjYuMjA5MSAxMSAyNEMxMSAyMS43OTA5IDEyLjc5MDkgMjAgMTUgMjBaIiBmaWxsPSIjQ0NDIi8+Cjwvc3ZnPgo='
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
      // Load the actual NAPPS logo from Cloudinary with timeout
      const logoUrl = 'https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png';
      const logoBase64 = await imageUrlToBase64(logoUrl);
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.warn('Could not load logo, using fallback:', error);
      // Lightweight SVG fallback logo
      const fallbackLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCAyNSAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjEyLjUiIGZpbGw9IiMyMjhCMjIiLz4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjgiIGZpbGw9IiNGRkQ3MDAiLz4KPHR4dCB4PSIxMi41IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzIyOEIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TjwvdGV4dD4KPC9zdmc+'
      doc.addImage(fallbackLogo, 'SVG', logoX, logoY, logoSize, logoSize);
    }
    
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
        // Use lightweight SVG placeholder instead of complex drawing
        const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1IiBzdHJva2U9IiNEREQiLz4KPHN2ZyB4PSI4IiB5PSIxMCIgd2lkdGg9IjE0IiBoZWlnaHQ9IjE0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiNBQUEiPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI0FBQSIvPgo8L3N2Zz4KPHR4dCB4PSIxNSIgeT0iMzIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2IiBmaWxsPSIjQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QSE9UTzwvdGV4dD4KPC9zdmc+'
        doc.addImage(placeholderSvg, 'SVG', photoX, photoY, photoWidth, photoHeight);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.8);
        doc.rect(photoX, photoY, photoWidth, photoHeight);
      }
    } else {
      // Use lightweight SVG placeholder
      const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1IiBzdHJva2U9IiNEREQiLz4KPHN2ZyB4PSI4IiB5PSIxMCIgd2lkdGg9IjE0IiBoZWlnaHQ9IjE0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiNBQUEiPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI0FBQSIvPgo8L3N2Zz4KPHR4dCB4PSIxNSIgeT0iMzIiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2IiBmaWxsPSIjQUFBIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QSE9UTzwvdGV4dD4KPC9zdmc+'
      doc.addImage(placeholderSvg, 'SVG', photoX, photoY, photoWidth, photoHeight);
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.8);
      doc.rect(photoX, photoY, photoWidth, photoHeight);
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

    // Professional color scheme matching the screenshot exactly
    const nappsGreen = [34, 139, 34] as const; // Forest green from screenshot
    const headerGreen = [46, 82, 51] as const; // Dark green for header
    const nappsGold = [255, 215, 0] as const; // Gold accents
    const primaryText = [0, 0, 0] as const; // Pure black text
    const secondaryText = [68, 68, 68] as const; // Dark gray
    const lightGreen = [177, 218, 177] as const; // Light green for photo placeholder
    const redText = [211, 47, 47] as const; // Red for exam date
    const white = [255, 255, 255] as const;
    const tableHeaderGreen = [60, 118, 61] as const; // Table header green
    const evenRowColor = [248, 248, 248] as const; // Light gray for even rows
    const yellowRowColor = [255, 255, 224] as const; // Light yellow for highlighted row
    const borderColor = [200, 200, 200] as const; // Subtle borders
    const shadowColor = [0, 0, 0, 0.1] as const; // Shadow effect
    const boxHeaderGray = [180, 180, 180] as const; // Box headers

    // Set clean background
    doc.setFillColor(...white);
    doc.rect(0, 0, 210, 297, 'F');

    // Professional card-style container with right margin shadow
    const cardX = 20;
    const cardY = 15;
    const cardWidth = 170;
    const cardHeight = 260;
    
    // Right margin shadow effect
    doc.setFillColor(200, 200, 200);
    doc.rect(cardX + cardWidth + 2, cardY + 2, 3, cardHeight, 'F');
    doc.setFillColor(220, 220, 220);
    doc.rect(cardX + cardWidth + 1, cardY + 1, 2, cardHeight, 'F');
    
    // Main card background
    doc.setFillColor(...white);
    doc.rect(cardX, cardY, cardWidth, cardHeight, 'F');
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(1);
    doc.rect(cardX, cardY, cardWidth, cardHeight, 'S');
      // Watermark - professional and subtle
    doc.setTextColor(240, 240, 240); // Very light gray
    doc.setFontSize(45);
    doc.setFont('helvetica', 'bold');
    const watermarkX = cardX + cardWidth/2;
    const watermarkY = cardY + cardHeight/2;
    doc.text('NAPPS Nasarawa State', watermarkX, watermarkY, { 
      angle: -45, 
      align: 'center'
    });

    // Header section with professional circular logo design
    let yPos = cardY + 10;    
    // Professional NAPPS Logo Circle (matching screenshot)
    const logoX = cardX + 15;
    const logoY = yPos;
    const logoSize = 25;
    
    try {
      // Load the actual NAPPS logo from Cloudinary
      const logoUrl = 'https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png';
      const logoBase64 = await imageUrlToBase64(logoUrl);
      
      // Create circular background for logo
      doc.setFillColor(...white);
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 2, 'F');
      doc.setDrawColor(...nappsGreen);
      doc.setLineWidth(2);
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 2, 'S');
      
      // Add the logo image
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize);
      
    } catch (error) {
      console.warn('Could not load logo, using professional fallback:', error);
      // Professional circular logo design
      doc.setFillColor(...nappsGreen);
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 'F');
      
      // Inner details
      doc.setFillColor(...nappsGold);
      doc.circle(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 - 3, 'F');
      
      // Center text
      doc.setTextColor(...nappsGreen);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('NAPPS', logoX + logoSize/2, logoY + logoSize/2 + 2, { align: 'center' });
    }

    // Header text (professional typography)
    const headerX = logoX + logoSize + 10;
    doc.setTextColor(...primaryText);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('NAPPS NASARAWA STATE CHAPTER', headerX, yPos + 8);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Besides SALAMATU Hall Lafia, Jos Road', headerX, yPos + 14);
    doc.text('Napps Nasarawa State Unified Certificate Examination', headerX, yPos + 18);
    doc.text('(NNSUCE-2024)', headerX, yPos + 22);

    yPos += 35;

    // Result Slip Header Bar
    doc.setFillColor(...tableHeaderGreen);
    doc.roundedRect(cardX + 5, yPos, cardWidth - 10, 8, 2, 2, 'F');
    doc.setTextColor(...white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESULT SLIP', cardX + cardWidth/2, yPos + 5.5, { align: 'center' });
    
    yPos += 12;

    // Exam Date (red text, right aligned)
    doc.setTextColor(...redText);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Exam Date: 06/06/24', cardX + cardWidth - 10, yPos + 5, { align: 'right' });
      // Candidate Details Section
    doc.setTextColor(...primaryText);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Candidate Details', cardX + 10, yPos);
      
    yPos += 15;

    // Student information with professional spacing
    const infoX = cardX + 10;
    
    const addInfoRow = (label: string, value: string, y: number) => {
      doc.setTextColor(...primaryText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, infoX, y);
      
      doc.setTextColor(...secondaryText);
      doc.setFont('helvetica', 'normal');
      doc.text(value, infoX + 45, y);
    };

    const fullName = `${resultData.student.firstName} ${resultData.student.middleName || ''} ${resultData.student.lastName}`.trim().toUpperCase();
    
    addInfoRow('Student Name', fullName, yPos);
    yPos += 6;
    
    addInfoRow('Registration Number', resultData.student.registrationNumber, yPos);
    yPos += 6;
    
    addInfoRow('Center Name', resultData.student.centerName, yPos);
    yPos += 6;
    
    addInfoRow('School Name', resultData.student.schoolName, yPos);

    // Student photo (professional styling matching screenshot)
    const photoX = cardX + cardWidth - 45;
    const photoY = yPos - 20;
    const photoWidth = 30;
    const photoHeight = 35;
    
    if (resultData.student.passportUrl) {
      try {
        const base64Image = await imageUrlToBase64(resultData.student.passportUrl);
        // Photo background with slight shadow
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(photoX - 1, photoY - 1, photoWidth + 2, photoHeight + 2, 2, 2, 'F');
        doc.addImage(base64Image, 'JPEG', photoX, photoY, photoWidth, photoHeight);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(1);
        doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 2, 2, 'S');
      } catch (error) {
        console.warn('Could not load passport image:', error);
        // Professional placeholder matching screenshot
        doc.setFillColor(...lightGreen);
        doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 2, 2, 'F');
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(1);
        doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 2, 2, 'S');
      }
    } else {
      // Professional placeholder matching screenshot
      doc.setFillColor(...lightGreen);
      doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 2, 2, 'F');
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(1);
      doc.roundedRect(photoX, photoY, photoWidth, photoHeight, 2, 2, 'S');
    }

    yPos += 25;

    // Professional Results Table (exactly matching screenshot)
    const tableX = cardX + 10;
    const tableWidth = cardWidth - 20;
    const subjectColWidth = tableWidth * 0.75;
    const scoreColWidth = tableWidth * 0.25;
    
    // Table header with professional styling
    doc.setFillColor(...tableHeaderGreen);
    doc.rect(tableX, yPos, tableWidth, 10, 'F');
    
    doc.setTextColor(...white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT', tableX + 8, yPos + 6.5);
    doc.text('SCORE', tableX + subjectColWidth + scoreColWidth/2, yPos + 6.5, { align: 'center' });
    
    yPos += 10;
    
    // Subject rows with professional alternating colors
    resultData.subjects.forEach((subject, index) => {
      const result = resultData.results[subject.id];
      const rowHeight = 12;
      
      // Row background colors matching screenshot
      if (index === 1) { // English row (yellow highlight)
        doc.setFillColor(...yellowRowColor);
      } else if (index % 2 === 0) {
        doc.setFillColor(...evenRowColor);
      } else {
        doc.setFillColor(...white);
      }
      doc.rect(tableX, yPos, tableWidth, rowHeight, 'F');
      
      // Row content
      doc.setTextColor(...primaryText);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(subject.name, tableX + 8, yPos + 7.5);
      
      doc.setTextColor(...primaryText);
      doc.setFont('helvetica', 'bold');
      doc.text(result.score.toString(), tableX + subjectColWidth + scoreColWidth/2, yPos + 7.5, { align: 'center' });
      
      // Subtle row separator
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(tableX, yPos + rowHeight, tableX + tableWidth, yPos + rowHeight);
      
      yPos += rowHeight;
    });

    // Table border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(1);
    doc.rect(tableX, yPos - (resultData.subjects.length * 12) - 10, tableWidth, (resultData.subjects.length * 12) + 10);

    yPos += 20;

    // Professional Summary Boxes (improved alignment)
    const boxY = yPos;
    const boxHeight = 15;
    const boxSpacing = 15; // Reduced spacing for better alignment
    
    // Calculate positions for centered layout
    const totalBoxWidth = 55;
    const positionBoxWidth = 65;
    const totalAvailableWidth = totalBoxWidth + positionBoxWidth + boxSpacing;
    const startX = tableX + (tableWidth - totalAvailableWidth) / 2; // Center the boxes
    
    // Total Box
    const totalBoxX = startX;
    
    // Box header
    doc.setFillColor(...boxHeaderGray);
    doc.rect(totalBoxX, boxY, totalBoxWidth, 6, 'F');
    doc.setTextColor(...primaryText);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', totalBoxX + totalBoxWidth/2, boxY + 4, { align: 'center' });
    
    // Box value
    doc.setFillColor(...white);
    doc.rect(totalBoxX, boxY + 6, totalBoxWidth, boxHeight - 6, 'F');
    doc.setTextColor(...primaryText);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(resultData.totalScore.toString(), totalBoxX + totalBoxWidth/2, boxY + 12, { align: 'center' });
    
    // Box border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(1);
    doc.rect(totalBoxX, boxY, totalBoxWidth, boxHeight);

    // Center Position Box (if available)
    if (resultData.centerPosition && resultData.centerPosition > 0) {
      const positionBoxX = totalBoxX + totalBoxWidth + boxSpacing;
      
      // Box header
      doc.setFillColor(...boxHeaderGray);
      doc.rect(positionBoxX, boxY, positionBoxWidth, 6, 'F');
      doc.setTextColor(...primaryText);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CENTER POSITION', positionBoxX + positionBoxWidth/2, boxY + 4, { align: 'center' });
      
      // Box value
      doc.setFillColor(...white);
      doc.rect(positionBoxX, boxY + 6, positionBoxWidth, boxHeight - 6, 'F');
      doc.setTextColor(...primaryText);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const ordinal = getOrdinalSuffix(resultData.centerPosition);
      doc.text(`${resultData.centerPosition}${ordinal}`, positionBoxX + positionBoxWidth/2, boxY + 12, { align: 'center' });
      
      // Box border
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(1);
      doc.rect(positionBoxX, boxY, positionBoxWidth, boxHeight);
    }

    yPos += 40; // Increased spacing to push signature lower

    // Signature Section (professional styling with better positioning)
    const signatureX = tableX + 15;
    
    // Signature name
    doc.setTextColor(...primaryText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Ogah Omaha Ogah', signatureX, yPos);
    
    yPos += 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('State Chairman', signatureX, yPos);
    
    // Signature line
    doc.setDrawColor(...primaryText);
    doc.setLineWidth(1);
    doc.line(signatureX, yPos + 3, signatureX + 40, yPos + 3);

    // Professional QR Code (positioned for better balance)
    const qrX = tableX + tableWidth - 35; // Right-aligned with proper margin
    const qrY = yPos - 18;
    const qrSize = 25;
    
    try {
      // Generate QR code with verification link that prepopulates registration number
      const verificationUrl = `https://exams.nappsnasarawa.com/verify/${resultData.student.registrationNumber}`;
      
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // QR code background
      doc.setFillColor(...white);
      doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'F');
      
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // QR code border
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.5);
      doc.rect(qrX, qrY, qrSize, qrSize);
      
      // Barcode-style lines below QR code (matching screenshot)
      doc.setFillColor(...primaryText);
      for (let i = 0; i < 30; i++) {
        const lineX = qrX + (i * 0.8);
        const lineWidth = 0.4;
        const lineHeight = 3;
        doc.rect(lineX, qrY + qrSize + 2, lineWidth, lineHeight, 'F');
      }
      
    } catch (error) {
      console.warn('Could not generate QR code, using professional fallback:', error);
      // Professional fallback barcode
      doc.setFillColor(...primaryText);
      for (let i = 0; i < 25; i++) {
        const barWidth = (i % 3 === 0) ? 1 : 0.5;
        const barHeight = qrSize;
        const gap = 0.3;
        doc.rect(qrX + (i * (barWidth + gap)), qrY, barWidth, barHeight, 'F');
      }
      
      doc.setDrawColor(...borderColor);
      doc.setLineWidth(0.5);
      doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2);
    }

    // Move to footer area
    yPos += 25;

    // Authentication Box at Footer
    const authBoxY = yPos;
    const authBoxHeight = 12;
    const authBoxWidth = tableWidth;
    const authBoxX = tableX;
    
    // Authentication box background
    doc.setFillColor(245, 245, 245); // Light gray background
    doc.roundedRect(authBoxX, authBoxY, authBoxWidth, authBoxHeight, 2, 2, 'F');
    
    // Authentication box border
    doc.setDrawColor(...nappsGreen);
    doc.setLineWidth(1);
    doc.roundedRect(authBoxX, authBoxY, authBoxWidth, authBoxHeight, 2, 2, 'S');
    
    // Authentication text
    doc.setTextColor(...nappsGreen);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('AUTHENTIC NAPPS NASARAWA', authBoxX + authBoxWidth/2, authBoxY + 5, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('This document is digitally verified and authenticated', authBoxX + authBoxWidth/2, authBoxY + 8.5, { align: 'center' });

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
