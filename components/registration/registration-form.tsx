"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CandidateInfoStep } from "./candidate-info-step"
import { SchoolDetailsStep } from "./school-details-step"
import { ParentInfoStep } from "./parent-info-step"
import { PassportUploadStep } from "./passport-upload-step"
import { PaymentSummaryStep } from "./payment-summary-step"
import { InstructionsStep } from "./instructions-step"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle } from "lucide-react"

type RegistrationData = {
  firstName: string
  middleName?: string
  lastName: string
  chapterId: number
  schoolId: number
  schoolName?: string
  centerId: number
  parentFirstName: string
  parentLastName: string
  parentPhone: string
  parentEmail: string
  parentConsent: boolean
  passportUrl: string
}

const TOTAL_STEPS = 6

export function RegistrationForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<RegistrationData>>({})

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    window.scrollTo(0, 0)
  }

  const handlePrevious = () => {
    setStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo(0, 0)
  }
  
  // Combined function that updates form data and advances to the next step
  const updateFormDataAndContinue = (data: Partial<RegistrationData>) => {
    updateFormData(data)
    handleNext()
  }

  const handleSubmit = async () => {
    try {
      toast({
        title: "Processing registration...",
        description: "Please wait while we submit your registration.",
      })

      // Submit registration data to API
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit registration")
      }

      const data = await response.json()

      toast({
        title: "Registration successful!",
        description: "Your registration has been submitted successfully.",
        variant: "success",
      })

      // Redirect to payment page with registration ID
      router.push(`/payment/initialize?registrationId=${data.id}`)
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: "There was an error submitting your registration. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <InstructionsStep onNext={handleNext} />
      case 2:
        return <CandidateInfoStep data={formData} onNext={updateFormDataAndContinue} onPrevious={handlePrevious} />
      case 3:
        return <SchoolDetailsStep data={formData} onNext={updateFormDataAndContinue} onPrevious={handlePrevious} />
      case 4:
        return <PassportUploadStep data={formData} onNext={updateFormDataAndContinue} onPrevious={handlePrevious} />
      case 5:
        return <ParentInfoStep data={formData} onNext={updateFormDataAndContinue} onPrevious={handlePrevious} />
      case 6:
        return <PaymentSummaryStep data={formData} onSubmit={handleSubmit} onPrevious={handlePrevious} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="w-full shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl">Student Registration</CardTitle>
          <CardDescription>
            Step {step} of {TOTAL_STEPS}
          </CardDescription>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-2 mt-2" />

          <div className="flex justify-between mt-6 px-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <div key={index} className="step-item flex flex-col items-center">
                <div className={`step ${step > index + 1 ? "complete" : ""} ${step === index + 1 ? "active" : ""}`}>
                  {step > index + 1 ? <CheckCircle className="h-5 w-5" /> : <span>{index + 1}</span>}
                </div>
                <p className="step-text mt-2 text-center hidden md:block">
                  {index === 0 && "Instructions"}
                  {index === 1 && "Personal Info"}
                  {index === 2 && "School Details"}
                  {index === 3 && "Passport"}
                  {index === 4 && "Parent Info"}
                  {index === 5 && "Payment"}
                </p>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-6">{renderStep()}</CardContent>
      </Card>
    </div>
  )
}
