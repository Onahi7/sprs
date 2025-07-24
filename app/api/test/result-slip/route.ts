import { NextRequest, NextResponse } from 'next/server';
import { generateResultSlipPDF, type ResultSlipData } from '@/lib/pdf';

export async function GET(request: NextRequest) {
  try {
    // Sample result slip data for testing
    const sampleResultData: ResultSlipData = {
      student: {
        registrationNumber: 'SPRS-2024-001-NAS-001',
        firstName: 'AMINA',
        lastName: 'MUHAMMAD',
        middleName: 'FATIMA',
        class: 'JSS 3',
        centerName: 'GOVERNMENT SECONDARY SCHOOL LAFIA',
        chapterName: 'NASARAWA STATE CHAPTER',
        schoolName: 'BRIGHT STARS INTERNATIONAL SCHOOL',
        passportUrl: 'https://via.placeholder.com/150x200/cccccc/666666?text=STUDENT+PHOTO'
      },
      subjects: [
        { id: 1, name: 'Mathematics', maxScore: 100 },
        { id: 2, name: 'English Language', maxScore: 100 },
        { id: 3, name: 'Basic Science', maxScore: 100 },
        { id: 4, name: 'Social Studies', maxScore: 100 },
        { id: 5, name: 'Civic Education', maxScore: 100 },
        { id: 6, name: 'Christian Religious Studies', maxScore: 100 },
        { id: 7, name: 'Computer Studies', maxScore: 100 },
        { id: 8, name: 'French Language', maxScore: 100 }
      ],
      results: {
        1: { score: 85 },
        2: { score: 78 },
        3: { score: 92 },
        4: { score: 88 },
        5: { score: 76 },
        6: { score: 81 },
        7: { score: 89 },
        8: { score: 73 }
      },
      totalScore: 662,
      totalMaxScore: 800,
      averagePercentage: 82.75,
      centerPosition: 3
    };

    // Generate the PDF
    const pdfBuffer = await generateResultSlipPDF(sampleResultData);

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer);

    // Create response headers
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `inline; filename="sample-result-slip.pdf"`);
    headers.set("Cache-Control", "no-cache");

    return new NextResponse(uint8Array, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error generating sample result slip:', error);
    return NextResponse.json(
      { error: "Failed to generate sample result slip" },
      { status: 500 }
    );
  }
}
