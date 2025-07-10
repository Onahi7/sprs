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

interface Student {
  id: number
  registrationNumber: string
  firstName: string
  middleName?: string | null
  lastName: string
  schoolName?: string | null
  centerId?: number | null
  centerName?: string
}

interface Subject {
  id: number
  name: string
  code: string
}

interface Center {
  id: number
  name: string
  chapterId: number
}

interface Chapter {
  id: number
  name: string
  splitCode?: string | null
}

interface Coordinator {
  id: number
  name: string
  email: string
}

interface Supervisor {
  id: number
  name: string
  phoneNumber: string
  schoolName?: string | null
}

interface AttendanceData {
  chapter: Chapter
  center?: Center
  centers?: Center[]
  coordinator: Coordinator | null
  supervisor?: Supervisor | null
  students: Student[]
  subjects: Subject[]
  type: 'center' | 'chapter'
}

export async function generateAttendancePDF(data: AttendanceData): Promise<Buffer> {
  try {
    // Create landscape PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
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
    const pageWidth = 297 // A4 landscape width
    const pageHeight = 210 // A4 landscape height
    const margin = 15

    if (data.type === 'center') {
      // Generate single center attendance
      await generateCenterAttendance(doc, data, nappsGreen, headerGray, borderGray, white, black, pageWidth, pageHeight, margin)
    } else {
      // Generate chapter-wide attendance (multiple centers)
      await generateChapterAttendance(doc, data, nappsGreen, headerGray, borderGray, white, black, pageWidth, pageHeight, margin)
    }

    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)

  } catch (error) {
    console.error('Error generating attendance PDF:', error)
    throw error
  }
}

async function generateCenterAttendance(
  doc: jsPDF,
  data: AttendanceData,
  nappsGreen: [number, number, number],
  headerGray: [number, number, number],
  borderGray: [number, number, number],
  white: [number, number, number],
  black: [number, number, number],
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  let currentY = margin

  // Header with NAPPS logo and title
  await addHeader(doc, data.chapter, data.center!, nappsGreen, white, black, pageWidth, margin, currentY)
  currentY += 35

  // Supervisor info
  addSupervisorInfo(doc, data.supervisor || null, margin, currentY, nappsGreen)
  currentY += 20

  // Center info
  addCenterInfo(doc, data.center!, data.students.length, margin, currentY, nappsGreen)
  currentY += 20

  // Attendance table
  addAttendanceTable(doc, data.students, data.subjects, margin, currentY, pageWidth, nappsGreen, headerGray, borderGray)
}

async function generateChapterAttendance(
  doc: jsPDF,
  data: AttendanceData,
  nappsGreen: [number, number, number],
  headerGray: [number, number, number],
  borderGray: [number, number, number],
  white: [number, number, number],
  black: [number, number, number],
  pageWidth: number,
  pageHeight: number,
  margin: number
) {
  // Group students by center
  const studentsByCenter = new Map<number, Student[]>()
  
  data.students.forEach(student => {
    if (student.centerId) {
      if (!studentsByCenter.has(student.centerId)) {
        studentsByCenter.set(student.centerId, [])
      }
      studentsByCenter.get(student.centerId)!.push(student)
    }
  })

  let isFirstPage = true

  // For chapter-wide attendance, we'll handle supervisors per center
  // This would need to be modified to fetch supervisors if needed
  // For now, we'll pass null as supervisor for chapter-wide generation

  // Generate a page for each center
  for (const center of data.centers || []) {
    if (!isFirstPage) {
      doc.addPage()
    }
    isFirstPage = false

    let currentY = margin

    // Header
    await addHeader(doc, data.chapter, center, nappsGreen, white, black, pageWidth, margin, currentY)
    currentY += 35

    // Supervisor info (null for chapter-wide generation)
    addSupervisorInfo(doc, null, margin, currentY, nappsGreen)
    currentY += 20

    // Center info
    const centerStudents = studentsByCenter.get(center.id) || []
    addCenterInfo(doc, center, centerStudents.length, margin, currentY, nappsGreen)
    currentY += 20

    // Attendance table
    addAttendanceTable(doc, centerStudents, data.subjects, margin, currentY, pageWidth, nappsGreen, headerGray, borderGray)
  }
}

async function addHeader(
  doc: jsPDF,
  chapter: Chapter,
  center: Center,
  nappsGreen: [number, number, number],
  white: [number, number, number],
  black: [number, number, number],
  pageWidth: number,
  margin: number,
  yPos: number
) {
  // NAPPS Logo - using actual logo image
  const logoX = margin
  const logoY = yPos
  const logoSize = 25

  try {
    // Load the actual NAPPS logo from Cloudinary with timeout
    const logoUrl = 'https://res.cloudinary.com/dbbzy6j4s/image/upload/v1749089475/sprs_passports/sprs_passports/passport_Hji2hREF.png'
    const logoBase64 = await imageUrlToBase64(logoUrl)
    doc.addImage(logoBase64, 'PNG', logoX, logoY, logoSize, logoSize)
  } catch (error) {
    console.warn('Could not load logo, using fallback:', error)
    // Lightweight SVG fallback logo
    const fallbackLogo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIHZpZXdCb3g9IjAgMCAyNSAyNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjEyLjUiIGZpbGw9IiMyMjhCMjIiLz4KPGNpcmNsZSBjeD0iMTIuNSIgY3k9IjEyLjUiIHI9IjgiIGZpbGw9IiNGRkQ3MDAiLz4KPHR4dCB4PSIxMi41IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzIyOEIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TjwvdGV4dD4KPC9zdmc+'
    doc.addImage(fallbackLogo, 'SVG', logoX, logoY, logoSize, logoSize)
  }

  // Title section - right aligned
  const titleX = pageWidth - margin
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('NAPPS NASARAWA STATE', titleX, yPos + 5, { align: 'right' })
  
  doc.setFontSize(16)
  doc.text('UNIFIED EXAMS 2025', titleX, yPos + 12, { align: 'right' })
  
  doc.setFontSize(14)
  doc.setTextColor(...black)
  doc.text('ATTENDANCE LIST', titleX, yPos + 19, { align: 'right' })

  doc.setFontSize(10)
  doc.text(`${chapter.name} - ${center.name}`, titleX, yPos + 26, { align: 'right' })
  
  // Date
  const today = new Date().toLocaleDateString('en-GB')
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${today}`, titleX, yPos + 31, { align: 'right' })
}

function addSupervisorInfo(
  doc: jsPDF,
  supervisor: Supervisor | null,
  margin: number,
  yPos: number,
  nappsGreen: [number, number, number]
) {
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Center Supervisor:', margin, yPos)
  
  if (supervisor) {
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    doc.text(supervisor.name, margin + 35, yPos)
    
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text(`Phone: ${supervisor.phoneNumber}`, margin, yPos + 5)
    if (supervisor.schoolName) {
      doc.text(`School: ${supervisor.schoolName}`, margin, yPos + 10)
    }
  } else {
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.text('Not assigned', margin + 35, yPos)
  }
}

function addCenterInfo(
  doc: jsPDF,
  center: Center,
  studentCount: number,
  margin: number,
  yPos: number,
  nappsGreen: [number, number, number]
) {
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Examination Center:', margin, yPos)
  
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.text(center.name, margin + 40, yPos)
  
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Total Students: ${studentCount}`, margin, yPos + 5)
}

function addAttendanceTable(
  doc: jsPDF,
  students: Student[],
  subjects: Subject[],
  margin: number,
  yPos: number,
  pageWidth: number,
  nappsGreen: [number, number, number],
  headerGray: [number, number, number],
  borderGray: [number, number, number]
) {
  if (students.length === 0) {
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(12)
    doc.text('No students registered for this center', margin, yPos + 20)
    return
  }

  // Prepare table headers
  const headers = [
    'S/N',
    'Registration No.',
    'Student Name',
    'School'
  ]

  // Add subject columns (Morning & Evening for each subject)
  subjects.slice(0, 4).forEach(subject => { // Limit to 4 subjects to fit page
    headers.push(`${subject.name}\nMorning`)
    headers.push(`${subject.name}\nEvening`)
  })

  // Prepare table data
  const tableData = students.map((student, index) => {
    const fullName = `${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim().toUpperCase()
    const schoolName = student.schoolName || 'N/A'
    
    const row = [
      (index + 1).toString(),
      student.registrationNumber,
      fullName,
      schoolName
    ]

    // Add empty checkboxes for each subject (Morning & Evening)
    subjects.slice(0, 4).forEach(() => {
      row.push('☐') // Morning checkbox
      row.push('☐') // Evening checkbox
    })

    return row
  })

  // Generate table using autoTable
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
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
      0: { halign: 'center', cellWidth: 10 }, // S/N
      1: { halign: 'center', cellWidth: 25 }, // Reg No
      2: { halign: 'left', cellWidth: 45 }, // Name
      3: { halign: 'left', cellWidth: 35 }, // School
      // Subject columns will auto-fit the remaining space
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

  // Add signature section at the bottom of the last page
  const finalY = (doc as any).lastAutoTable.finalY + 20
  
  // Signature boxes
  const signatureY = finalY
  const boxWidth = 80
  const boxHeight = 30
  
  // Supervisor signature
  doc.setDrawColor(...borderGray)
  doc.setLineWidth(0.5)
  doc.rect(margin, signatureY, boxWidth, boxHeight)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Supervisor Signature:', margin + 2, signatureY - 3)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Name: ________________________', margin + 2, signatureY + 20)
  doc.text('Date: _________________________', margin + 2, signatureY + 26)

  // State Secretary signature
  const secondBoxX = margin + boxWidth + 30
  doc.rect(secondBoxX, signatureY, boxWidth, boxHeight)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('State Secretary:', secondBoxX + 2, signatureY - 3)
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Name: Prince Samiyu', secondBoxX + 2, signatureY + 20)
  doc.text('Date: _________________________', secondBoxX + 2, signatureY + 26)

  // Instructions
  const instructionY = signatureY + boxHeight + 10
  doc.setTextColor(...nappsGreen)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INSTRUCTIONS:', margin, instructionY)
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('• Mark (✓) for present students in appropriate session boxes', margin, instructionY + 5)
  doc.text('• Mark (X) for absent students', margin, instructionY + 10)
  doc.text('• Return completed form to NAPPS office after examination', margin, instructionY + 15)
}
