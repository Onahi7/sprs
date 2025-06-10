"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, User, School, Users, Phone, Mail, AlertCircle, CheckCircle, Camera, X, RefreshCw } from "lucide-react"

interface Chapter {
  id: number
  name: string
  code: string
}

interface School {
  id: number
  name: string
  chapterId: number
}

interface Center {
  id: number
  name: string
  chapterId: number
}

interface RegistrationData {
  firstName: string
  middleName?: string
  lastName: string
  chapterId: number
  schoolId?: number
  schoolName?: string
  centerId: number
  parentFirstName: string
  parentLastName: string
  parentPhone: string
  parentEmail: string
  parentConsent: boolean
  passportUrl: string
}

export function CoordinatorStudentRegistrationForm() {
  const router = useRouter()
  const { toast } = useToast()

  // Form data state
  const [formData, setFormData] = useState<Partial<RegistrationData>>({
    parentConsent: false
  })

  // UI states
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Camera-related state for passport upload
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraAvailable, setIsCameraAvailable] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Data states
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [coordinatorChapter, setCoordinatorChapter] = useState<number | null>(null)
    // Slot validation states
  const [slotValidation, setSlotValidation] = useState<{
    canRegister: boolean
    message: string
    availableSlots?: number
    balance?: {
      availableSlots: number
      usedSlots: number
      totalPurchasedSlots: number
    }
  } | null>(null)
  const [validatingSlots, setValidatingSlots] = useState(false)

  const totalSteps = 4

  // Fetch coordinator's chapter and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/coordinator/chapter-info')
        
        if (response.ok) {
          const data = await response.json()
          setCoordinatorChapter(data.chapter.id)
          setFormData(prev => ({ ...prev, chapterId: data.chapter.id }))
          setChapters([data.chapter])
          setSchools(data.schools || [])
          setCenters(data.centers || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error",
          description: "Failed to load chapter information",
          variant: "destructive"
        })      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Validate slots before submission
  const validateSlots = async () => {
    try {
      setValidatingSlots(true)
      const response = await fetch('/api/coordinator/register/validate?slots=1')
      
      if (response.ok) {
        const data = await response.json()
        setSlotValidation(data)
        return data.canRegister
      } else {
        setSlotValidation({
          canRegister: false,
          message: "Failed to validate slot balance",
          availableSlots: 0
        })
        return false
      }
    } catch (error) {
      console.error('Error validating slots:', error)
      setSlotValidation({
        canRegister: false,
        message: "Unable to validate slot balance",
        availableSlots: 0
      })
      return false
    } finally {
      setValidatingSlots(false)
    }
  }

  // Validate on component mount and before final step
  useEffect(() => {
    if (currentStep === 4) {
      validateSlots()
    }
  }, [currentStep])

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePassportUpload = async (file: File) => {
    try {
      setUploading(true)
      
      // Validate file before upload
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload JPEG or PNG images only.')
      }
      
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        throw new Error('File too large. Please select an image smaller than 2MB.')
      }
      
      // Try direct Cloudinary upload first
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      
      let uploadUrl = null
      
      if (cloudName && uploadPreset) {
        try {
          // Attempt direct Cloudinary upload
          const formData = new FormData()
          formData.append('file', file)
          formData.append('upload_preset', uploadPreset)
          formData.append('folder', 'napps/passports')
          
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            if (data.secure_url) {
              uploadUrl = data.secure_url
            }
          }
        } catch (directUploadError) {
          console.log('Direct upload failed, trying API endpoint...', directUploadError)
        }
      }
      
      // Fallback to API endpoint if direct upload failed
      if (!uploadUrl) {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await fetch('/api/upload/passport', {
          method: 'POST',
          body: formData,
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Upload failed via API')
        }
        
        uploadUrl = data.url
      }
      
      if (!uploadUrl) {
        throw new Error('Upload failed - no URL returned from either method')
      }
      
      updateFormData({ passportUrl: uploadUrl })
      
      toast({
        title: "Success",
        description: "Passport uploaded successfully",
      })
    } catch (error) {
      console.error('Upload error:', error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown upload error occurred'
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Student info
        return !!(formData.firstName && formData.lastName)
      case 2: // School info
        return !!(formData.chapterId && formData.centerId && (formData.schoolId || formData.schoolName))
      case 3: // Parent info
        return !!(formData.parentFirstName && formData.parentLastName && 
                 formData.parentPhone && formData.parentEmail && formData.parentConsent)
      case 4: // Passport
        return !!formData.passportUrl
      default:
        return false
    }
  }
  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast({
        title: "Incomplete Form",
        description: "Please complete all required fields",
        variant: "destructive"
      })
      return
    }

    // Validate slots before submission
    const hasValidSlots = await validateSlots()
    if (!hasValidSlots) {
      toast({
        title: "Insufficient Slots",
        description: slotValidation?.message || "You don't have enough slots for this registration",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/coordinator/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === "INSUFFICIENT_SLOTS") {
          toast({
            title: "Insufficient Slots",
            description: `You need to purchase more slots. Available: ${data.availableSlots || 0}`,
            variant: "destructive"
          })
          return
        }
        throw new Error(data.error || 'Registration failed')
      }      toast({
        title: "Registration Successful!",
        description: `Student registered successfully. Registration number: ${data.registrationNumber}. Remaining slots: ${data.slotInfo?.remainingSlots || 0}`,
      })

      // Automatically download registration slip
      await downloadRegistrationSlip(data.registrationNumber)

      // Redirect to success page
      router.push(`/coordinator/register/success?registration=${data.registrationNumber}`)
      
      
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Function to download registration slip
  const downloadRegistrationSlip = async (registrationNumber: string) => {
    try {
      const response = await fetch(`/api/registrations/${registrationNumber}/slip`)
      
      if (!response.ok) {
        throw new Error('Failed to generate registration slip')
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registration-slip-${registrationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Registration Slip Downloaded",
        description: `Registration slip for ${registrationNumber} has been downloaded successfully.`,
      })
    } catch (error) {
      console.error('Error downloading registration slip:', error)
      toast({
        title: "Download Error",
        description: "Failed to download registration slip. You can download it later from your registrations list.",
        variant: "destructive"
      })
    }
  }

  // Camera functionality for passport upload
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsCameraAvailable(false)
          setCameraError("Camera API not supported by this browser")
          return
        }

        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          setIsCameraAvailable(false)
          setCameraError("Camera access requires HTTPS connection")
          return
        }

        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasCamera = devices.some(device => device.kind === 'videoinput')
        
        if (!hasCamera) {
          setIsCameraAvailable(false)
          setCameraError("No camera devices found")
          return
        }

        setIsCameraAvailable(true)
        setCameraError(null)
      } catch (error) {
        setIsCameraAvailable(false)
        setCameraError(`Camera check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    checkCameraAvailability()
    
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setCameraError(null)
      
      let stream: MediaStream
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        })
      } catch (idealError) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      
      setCameraStream(stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      let errorMessage = "Could not access camera. "
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera permissions and try again."
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera device found."
        } else if (error.name === 'NotReadableError') {
          errorMessage += "Camera is already in use by another application."
        } else {
          errorMessage += error.message
        }
      }
      
      setCameraError(errorMessage)
      setActiveTab("upload")
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setCameraError("Camera capture failed: Missing video or canvas element")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setCameraError("Please wait for camera to fully load before capturing")
      return
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera feed not properly loaded")
      return
    }

    setIsCapturing(true)
    
    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error("Could not get canvas context")
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(async (blob) => {
        try {
          if (!blob) {
            throw new Error("Failed to create blob from canvas")
          }

          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })
          
          // Upload the captured photo
          await handlePassportUpload(file)
          
          // Stop camera after capture
          stopCamera()
          setActiveTab("upload")
          setCameraError(null)
        } catch (error) {
          setCameraError(`Failed to process captured photo: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
          setIsCapturing(false)
        }
      }, "image/jpeg", 0.9)
    } catch (error) {
      setCameraError(`Photo capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsCapturing(false)
    }
  }

  // Handle tab change for camera
  useEffect(() => {
    if (activeTab === "camera") {
      startCamera()
    } else {
      stopCamera()
    }
  }, [activeTab])

  const renderStudentInfoStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Student Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            placeholder="Enter first name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            placeholder="Enter last name"
            required
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="middleName">Middle Name (Optional)</Label>
          <Input
            id="middleName"
            value={formData.middleName || ''}
            onChange={(e) => updateFormData({ middleName: e.target.value })}
            placeholder="Enter middle name"
          />
        </div>
      </div>
    </div>
  )

  const renderSchoolInfoStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <School className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">School & Center Information</h3>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Chapter</Label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">
              {chapters.find(c => c.id === coordinatorChapter)?.name || 'Loading...'}
            </span>
            <Badge variant="secondary" className="ml-2">Your Chapter</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="center">Examination Center *</Label>
          <Select
            value={formData.centerId?.toString() || ''}
            onValueChange={(value) => updateFormData({ centerId: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select examination center" />
            </SelectTrigger>
            <SelectContent>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id.toString()}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="school">School</Label>
          <Select
            value={formData.schoolId?.toString() || ''}
            onValueChange={(value) => {
              if (value === 'custom') {
                updateFormData({ schoolId: undefined, schoolName: '' })
              } else {
                const schoolId = parseInt(value)
                const school = schools.find(s => s.id === schoolId)
                updateFormData({ schoolId, schoolName: school?.name })
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select school or choose 'Other'" />
            </SelectTrigger>
            <SelectContent>
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id.toString()}>
                  {school.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">Other (Enter manually)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(!formData.schoolId || formData.schoolId === 0) && (
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name *</Label>
            <Input
              id="schoolName"
              value={formData.schoolName || ''}
              onChange={(e) => updateFormData({ schoolName: e.target.value })}
              placeholder="Enter school name"
              required
            />
          </div>
        )}
      </div>
    </div>
  )

  const renderParentInfoStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentFirstName">Parent First Name *</Label>
          <Input
            id="parentFirstName"
            value={formData.parentFirstName || ''}
            onChange={(e) => updateFormData({ parentFirstName: e.target.value })}
            placeholder="Enter parent's first name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parentLastName">Parent Last Name *</Label>
          <Input
            id="parentLastName"
            value={formData.parentLastName || ''}
            onChange={(e) => updateFormData({ parentLastName: e.target.value })}
            placeholder="Enter parent's last name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parentPhone">Phone Number *</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="parentPhone"
              value={formData.parentPhone || ''}
              onChange={(e) => updateFormData({ parentPhone: e.target.value })}
              placeholder="e.g., +234-XXX-XXX-XXXX"
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parentEmail">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="parentEmail"
              type="email"
              value={formData.parentEmail || ''}
              onChange={(e) => updateFormData({ parentEmail: e.target.value })}
              placeholder="parent@example.com"
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <Separator />
        <div className="flex items-start space-x-3">
          <Checkbox
            id="parentConsent"
            checked={formData.parentConsent || false}
            onCheckedChange={(checked) => updateFormData({ parentConsent: Boolean(checked) })}
          />
          <div className="space-y-1">
            <Label htmlFor="parentConsent" className="text-sm font-medium leading-5">
              Parent/Guardian Consent *
            </Label>
            <p className="text-sm text-muted-foreground">
              I confirm that I am the parent/guardian of the student and I consent to this registration.
              I understand that this registration is binding and fees are non-refundable.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
  const renderPassportStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Passport Photograph</h3>
      </div>
      
      {/* Slot Validation Status */}
      {validatingSlots ? (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            Validating slot balance...
          </AlertDescription>
        </Alert>
      ) : slotValidation ? (
        <Alert className={slotValidation.canRegister ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {slotValidation.canRegister ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={slotValidation.canRegister ? "text-green-800" : "text-red-800"}>
            <strong>Slot Status:</strong> {slotValidation.message}
            {slotValidation.balance && (
              <div className="mt-1 text-sm">
                Available Slots: {slotValidation.balance.availableSlots} | 
                Used: {slotValidation.balance.usedSlots} | 
                Total: {slotValidation.balance.totalPurchasedSlots}
              </div>
            )}
          </AlertDescription>
        </Alert>      ) : null}
      
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please upload a clear passport photograph. Accepted formats: JPEG, PNG (Max size: 2MB)
          </AlertDescription>
        </Alert>

        {formData.passportUrl ? (
          /* Show uploaded image with option to change */
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <img
                src={formData.passportUrl}
                alt="Passport"
                className="mx-auto h-40 w-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => updateFormData({ passportUrl: '' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Passport uploaded successfully</span>
            </div>
            <Button
              variant="outline"
              onClick={() => updateFormData({ passportUrl: '' })}
              disabled={uploading}
            >
              Change Photo
            </Button>
          </div>
        ) : (
          /* Upload interface with camera option */
          <Tabs 
            defaultValue="upload" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </TabsTrigger>
              <TabsTrigger value="camera" disabled={!isCameraAvailable}>
                <Camera className="mr-2 h-4 w-4" />
                {isCameraAvailable ? "Use Camera" : "Camera Unavailable"}
              </TabsTrigger>
            </TabsList>
            
            {/* Show camera status message when not available */}
            {!isCameraAvailable && cameraError && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  <strong>Camera not available:</strong> {cameraError}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  You can still upload a photo using the "Upload Photo" tab.
                </p>
              </div>
            )}
            
            <TabsContent value="upload">
              <Card className="border-dashed border-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">JPG, JPEG or PNG (max. 2MB)</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    id="passport-upload-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast({
                            title: "File too large",
                            description: "Please select an image smaller than 2MB",
                            variant: "destructive"
                          })
                          return
                        }
                        handlePassportUpload(file)
                      }
                    }}
                    disabled={uploading}
                  />
                  <label htmlFor="passport-upload-input" className="w-full h-full absolute inset-0 cursor-pointer">
                    <span className="sr-only">Upload passport photo</span>
                  </label>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="camera">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  {cameraError ? (
                    <div className="text-center space-y-4">
                      <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                        {cameraError}
                      </div>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCameraError(null)
                          startCamera()
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Camera Access
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative w-full max-w-[320px] bg-black rounded-md overflow-hidden">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {!cameraStream && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <div className="text-white text-sm">Loading camera...</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-center mt-4 space-x-2">
                        <Button 
                          type="button" 
                          onClick={capturePhoto}
                          disabled={!cameraStream || isCapturing || uploading}
                          className="flex items-center"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          {isCapturing ? "Capturing..." : uploading ? "Uploading..." : "Capture Photo"}
                        </Button>
                        
                        {cameraStream && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              stopCamera()
                              setActiveTab("upload")
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading form...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && renderStudentInfoStep()}
        {currentStep === 2 && renderSchoolInfoStep()}
        {currentStep === 3 && renderParentInfoStep()}
        {currentStep === 4 && renderPassportStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={nextStep}
            disabled={!validateStep(currentStep)}
          >
            Next Step
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!validateStep(currentStep) || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              'Complete Registration'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
