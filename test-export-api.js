// Simple API endpoint test
async function testExportAPI() {
  console.log('🧪 Testing Export API Endpoint...')
  
  try {
    // Test 1: Check if the API route exists
    console.log('\n📍 Test 1: Basic endpoint check')
    const testResponse = await fetch('/api/admin/results/export?format=csv&type=all&chapterId=1', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/csv',
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Response details:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok,
      type: testResponse.type,
      headers: Object.fromEntries(testResponse.headers.entries())
    })
    
    if (testResponse.status === 401) {
      console.log('❌ 401 Unauthorized - You need to be logged in as admin')
      console.log('💡 Solution: Login as admin first in the browser')
    } else if (testResponse.status === 404) {
      console.log('❌ 404 Not Found - API route may not exist')
      console.log('💡 Check if /api/admin/results/export/route.ts exists')
    } else if (testResponse.status === 500) {
      const errorText = await testResponse.text()
      console.log('❌ 500 Server Error:', errorText)
    } else if (testResponse.ok) {
      console.log('✅ API endpoint is working!')
      const blob = await testResponse.blob()
      console.log(`📄 Response size: ${blob.size} bytes`)
    }
    
  } catch (error) {
    console.error('❌ Network/Fetch Error:', error)
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log('💡 This could be:')
      console.log('  - Development server not running')
      console.log('  - Network connectivity issue')
      console.log('  - CORS issue')
    }
  }
}

// Run the test
testExportAPI()

// Debug info
console.log('\n🔍 Debug Information:')
console.log('Current URL:', window.location.href)
console.log('Cookies:', document.cookie)
console.log('User Agent:', navigator.userAgent)
