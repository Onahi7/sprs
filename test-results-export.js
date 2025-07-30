// Test script for the results export API
const testResultsExport = async () => {
  try {
    console.log('Testing Results Export API...')
    
    // Test CSV export
    const csvResponse = await fetch('http://localhost:3000/api/admin/results/export?format=csv&type=all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('CSV Export Response Status:', csvResponse.status)
    console.log('CSV Export Headers:', Object.fromEntries(csvResponse.headers.entries()))
    
    if (csvResponse.ok) {
      const csvText = await csvResponse.text()
      console.log('CSV Content Preview:', csvText.substring(0, 200) + '...')
    } else {
      const errorText = await csvResponse.text()
      console.log('CSV Export Error:', errorText)
    }
    
    // Test PDF export
    const pdfResponse = await fetch('http://localhost:3000/api/admin/results/export?format=pdf&type=best10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    console.log('PDF Export Response Status:', pdfResponse.status)
    console.log('PDF Export Headers:', Object.fromEntries(pdfResponse.headers.entries()))
    
    if (pdfResponse.ok) {
      const pdfBuffer = await pdfResponse.arrayBuffer()
      console.log('PDF Buffer Size:', pdfBuffer.byteLength, 'bytes')
    } else {
      const errorText = await pdfResponse.text()
      console.log('PDF Export Error:', errorText)
    }

  } catch (error) {
    console.error('Test Error:', error.message)
  }
}

// Run the test
testResultsExport()
