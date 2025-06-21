'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Eye, FileText } from 'lucide-react'

export default function TestResultSlipPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleViewSlip = () => {
    // Open the sample result slip in a new tab
    window.open('/api/test/result-slip', '_blank')
  }

  const handleDownloadSlip = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/test/result-slip')
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sample-result-slip.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading result slip:', error)
      alert('Failed to download result slip')
    } finally {
      setIsGenerating(false)
    }
  }

  // Sample data for preview
  const sampleStudent = {
    registrationNumber: 'SPRS-2024-001-NAS-001',
    name: 'AMINA FATIMA MUHAMMAD',
    class: 'JSS 3',
    center: 'GOVERNMENT SECONDARY SCHOOL LAFIA',
    school: 'BRIGHT STARS INTERNATIONAL SCHOOL'
  }

  const sampleSubjects = [
    { name: 'Mathematics', score: 85 },
    { name: 'English Language', score: 78 },
    { name: 'Basic Science', score: 92 },
    { name: 'Social Studies', score: 88 },
    { name: 'Civic Education', score: 76 },
    { name: 'Christian Religious Studies', score: 81 },
    { name: 'Computer Studies', score: 89 },
    { name: 'French Language', score: 73 }
  ]

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Result Slip</h1>
        <p className="text-gray-600">
          This page allows you to preview and test the NAPPS result slip format with sample data.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Result Slip Actions
            </CardTitle>
            <CardDescription>
              View or download a sample result slip with mock student data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleViewSlip}
              className="w-full"
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Sample Result Slip
            </Button>
            
            <Button 
              onClick={handleDownloadSlip}
              className="w-full"
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Sample PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* Sample Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Student Data</CardTitle>
            <CardDescription>
              This is the mock data used in the sample result slip
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Registration Number</p>
                <p className="font-mono text-sm">{sampleStudent.registrationNumber}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Student Name</p>
                <p className="font-semibold">{sampleStudent.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Class</p>
                <p>{sampleStudent.class}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Center Position</p>
                <p className="font-semibold text-green-600">3rd</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Total Score</p>
                <p className="font-bold text-lg">662/800 (82.75%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Preview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sample Subjects & Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {sampleSubjects.map((subject, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-yellow-50'
                  }`}
                >
                  <p className="font-medium text-sm">{subject.name}</p>
                  <p className="text-lg font-bold text-green-600">{subject.score}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "View Sample Result Slip" to see the result slip in a new browser tab</li>
          <li>• Click "Download Sample PDF" to download the result slip as a PDF file</li>
          <li>• The sample uses mock data that matches the NAPPS result slip format</li>
          <li>• This is useful for testing the layout and print formatting</li>
        </ul>
      </div>
    </div>
  )
}
