"use client"

import React, { useState } from "react"

export default function SupervisorLoginPage() {
  console.log('SupervisorLoginPage component rendered')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Supervisor Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            NAPPS Nasarawa State Exam Attendance System
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium">Enter Phone Number</h3>
          <form className="mt-4">
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="08012345678" 
              className="w-full p-3 border rounded-md"
            />
            <button 
              type="submit" 
              className="w-full mt-4 p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
