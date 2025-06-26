"use client"

export default function SupervisorLoginTestPage() {
  console.log('Test page rendered')
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Supervisor Portal - TEST
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            NAPPS Nasarawa State Exam Attendance System
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium">Test Form</h3>
          <form className="mt-4">
            <input 
              type="tel" 
              placeholder="Phone Number" 
              className="w-full p-2 border rounded"
            />
            <button 
              type="submit" 
              className="w-full mt-4 p-2 bg-blue-500 text-white rounded"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
