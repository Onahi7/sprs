import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Global image cache to prevent redundant downloads
const globalImageCache = new Map<string, string>()

// Helper function to convert image URL to base64 (server-side compatible)
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
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    
    // Determine the MIME type from the URL or response headers
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const dataUrl = `data:${contentType};base64,${base64}`
    
    // Cache the result (limit cache size to prevent memory issues)
    if (globalImageCache.size < 500) { // Max 500 cached images
      globalImageCache.set(url, dataUrl)
    }
    
    return dataUrl
  } catch (error) {
    console.error('Error converting image to base64:', error)
    
    // Return a lightweight placeholder instead of throwing
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCAyNSAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjEyLjUiIGZpbGw9IiMyMjhCMjIiLz4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjgiIGZpbGw9IiNGRkQ3MDAiLz4KPHR4dCB4PSIxMi41IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzIyOEIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TjwvdGV4dD4KPC9zdmc+'
  }
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface Chapter {
  id: number
  name: string
  splitCode?: string | null
}

interface SlotRegistration {
  id: number
  registrationNumber: string
  firstName: string
  middleName?: string | null
  lastName: string
  schoolName?: string | null
  centerName?: string | null
  slotQuantity: number
  slotAmount: string
  slotPaymentRef?: string | null
  registrationDate: Date | null
  slotPurchaseDate: Date | null
}

interface SingularRegistration {
  id: number
  registrationNumber: string
  firstName: string
  middleName?: string | null
  lastName: string
  schoolName?: string | null
  centerName?: string | null
  registrationDate: Date | null
}

interface AuditSummary {
  totalSlotRegistrations: number
  totalSingularRegistrations: number
  totalRegistrations: number
  totalSlotsSold: number
  totalSlotRevenue: number
  generatedDate: Date
}

interface RegistrationAuditData {
  chapter: Chapter
  slotRegistrations: SlotRegistration[]
  singularRegistrations: SingularRegistration[]
  summary: AuditSummary
}

export async function generateRegistrationAuditPDF(data: RegistrationAuditData): Promise<Buffer> {
  try {
    // Create portrait PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Colors
    const nappsGreen: [number, number, number] = [0, 128, 55]
    const headerGray: [number, number, number] = [240, 240, 240]
    const borderGray: [number, number, number] = [200, 200, 200]
    const white: [number, number, number] = [255, 255, 255]
    const black: [number, number, number] = [0, 0, 0]

    // Page dimensions
    const pageWidth = 210 // A4 portrait width
    const pageHeight = 297 // A4 portrait height
    const margin = 15

    let currentY = margin

    // Header
    await addHeader(doc, data.chapter, nappsGreen, white, black, pageWidth, margin, currentY)
    currentY += 40

    // Summary section
    addSummarySection(doc, data.summary, margin, currentY, nappsGreen, headerGray)
    currentY += 60

    // Slot Registrations Table
    if (data.slotRegistrations.length > 0) {
      addSlotRegistrationsTable(doc, data.slotRegistrations, margin, currentY, pageWidth, nappsGreen, headerGray, borderGray)
      currentY = (doc as any).lastAutoTable.finalY + 20
    }

    // Check if we need a new page for singular registrations
    if (currentY > pageHeight - 80 && data.singularRegistrations.length > 0) {
      doc.addPage()
      currentY = margin
    }

    // Singular Registrations Table
    if (data.singularRegistrations.length > 0) {
      addSingularRegistrationsTable(doc, data.singularRegistrations, margin, currentY, pageWidth, nappsGreen, headerGray, borderGray)
    }

    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)

  } catch (error) {
    console.error('Error generating registration audit PDF:', error)
    throw error
  }
}

async function addHeader(
  doc: jsPDF,
  chapter: Chapter,
  nappsGreen: [number, number, number],
  white: [number, number, number],
  black: [number, number, number],
  pageWidth: number,
  margin: number,
  yPos: number
) {
  // NAPPS Logo
  const logoX = margin
  const logoY = yPos
  const logoSize = 25

  try {
    const logoUrl = 'https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png'
    const logoBase64 = await imageUrlToBase64(logoUrl)
    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize)
  } catch (error) {
    console.warn('Could not load logo, using fallback:', error)
    const fallbackLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCAyNSAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjEyLjUiIGZpbGw9IiMyMjhCMjIiLz4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjgiIGZpbGw9IiNGRkQ3MDAiLz4KPHR4dCB4PSIxMi41IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzIyOEIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TjwvdGV4dD4KPC9zdmc+'
    doc.addImage(fallbackLogo, 'SVG', logoX, logoY, logoSize, logoSize)
  }

  // Title section - centered
  const titleX = pageWidth / 2
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('NAPPS NASARAWA STATE', titleX, yPos + 8, { align: 'center' })
  
  doc.setFontSize(14)
  doc.text('UNIFIED EXAMS 2025', titleX, yPos + 15, { align: 'center' })
  
  doc.setFontSize(16)
  doc.setTextColor(...black)
  doc.text('REGISTRATION AUDIT REPORT', titleX, yPos + 25, { align: 'center' })

  doc.setFontSize(12)
  doc.setTextColor(...nappsGreen)
  doc.text(chapter.name, titleX, yPos + 32, { align: 'center' })
  
  // Date
  const today = new Date().toLocaleDateString('en-GB')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${today}`, pageWidth - margin, yPos + 35, { align: 'right' })
}

function addSummarySection(
  doc: jsPDF,
  summary: AuditSummary,
  margin: number,
  yPos: number,
  nappsGreen: [number, number, number],
  headerGray: [number, number, number]
) {
  // Summary box
  doc.setFillColor(...headerGray)
  doc.roundedRect(margin, yPos, 180, 45, 3, 3, 'F')
  
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('AUDIT SUMMARY', margin + 10, yPos + 10)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  // First column
  doc.text(`Total Registrations: ${summary.totalRegistrations}`, margin + 10, yPos + 20)
  doc.text(`Slot Registrations: ${summary.totalSlotRegistrations}`, margin + 10, yPos + 27)
  doc.text(`Singular Registrations: ${summary.totalSingularRegistrations}`, margin + 10, yPos + 34)
  
  // Second column
  doc.text(`Total Slots Sold: ${summary.totalSlotsSold}`, margin + 100, yPos + 20)
  doc.text(`Slot Revenue: ₦${summary.totalSlotRevenue.toLocaleString()}`, margin + 100, yPos + 27)
  doc.text(`Success Rate: ${((summary.totalRegistrations / (summary.totalRegistrations || 1)) * 100).toFixed(1)}%`, margin + 100, yPos + 34)
}

function addSlotRegistrationsTable(
  doc: jsPDF,
  slotRegistrations: SlotRegistration[],
  margin: number,
  yPos: number,
  pageWidth: number,
  nappsGreen: [number, number, number],
  headerGray: [number, number, number],
  borderGray: [number, number, number]
) {
  // Section header
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SLOT REGISTRATIONS', margin, yPos)
  yPos += 10

  const headers = [
    'S/N',
    'Reg. No.',
    'Student Name',
    'School',
    'Center',
    'Slots',
    'Amount'
  ]

  const tableData = slotRegistrations.map((reg, index) => {
    const fullName = `${reg.firstName} ${reg.middleName || ''} ${reg.lastName}`.trim()
    return [
      (index + 1).toString(),
      reg.registrationNumber,
      fullName,
      reg.schoolName || 'N/A',
      reg.centerName || 'N/A',
      reg.slotQuantity.toString(),
      `₦${parseFloat(reg.slotAmount || '0').toLocaleString()}`
    ]
  })

  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: borderGray,
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: nappsGreen,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // S/N
      1: { halign: 'center', cellWidth: 25 }, // Reg No
      2: { halign: 'left', cellWidth: 40 }, // Name
      3: { halign: 'left', cellWidth: 35 }, // School
      4: { halign: 'left', cellWidth: 30 }, // Center
      5: { halign: 'center', cellWidth: 15 }, // Slots
      6: { halign: 'right', cellWidth: 20 } // Amount
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    tableLineColor: borderGray,
    tableLineWidth: 0.5,
    showHead: 'everyPage',
    pageBreak: 'auto',
    theme: 'grid'
  })
}

function addSingularRegistrationsTable(
  doc: jsPDF,
  singularRegistrations: SingularRegistration[],
  margin: number,
  yPos: number,
  pageWidth: number,
  nappsGreen: [number, number, number],
  headerGray: [number, number, number],
  borderGray: [number, number, number]
) {
  // Section header
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SINGULAR REGISTRATIONS', margin, yPos)
  yPos += 10

  const headers = [
    'S/N',
    'Registration No.',
    'Student Name',
    'School',
    'Center',
    'Date'
  ]

  const tableData = singularRegistrations.map((reg, index) => {
    const fullName = `${reg.firstName} ${reg.middleName || ''} ${reg.lastName}`.trim()
    const regDate = reg.registrationDate ? new Date(reg.registrationDate).toLocaleDateString() : 'N/A'
    return [
      (index + 1).toString(),
      reg.registrationNumber,
      fullName,
      reg.schoolName || 'N/A',
      reg.centerName || 'N/A',
      regDate
    ]
  })

  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: borderGray,
      lineWidth: 0.5
    },
    headStyles: {
      fillColor: nappsGreen,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // S/N
      1: { halign: 'center', cellWidth: 30 }, // Reg No
      2: { halign: 'left', cellWidth: 45 }, // Name
      3: { halign: 'left', cellWidth: 40 }, // School
      4: { halign: 'left', cellWidth: 35 }, // Center
      5: { halign: 'center', cellWidth: 25 } // Date
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248]
    },
    tableLineColor: borderGray,
    tableLineWidth: 0.5,
    showHead: 'everyPage',
    pageBreak: 'auto',
    theme: 'grid'
  })
}
