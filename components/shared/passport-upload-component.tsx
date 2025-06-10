"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Camera, X, RefreshCw, AlertCircle } from "lucide-react"

interface PassportUploadComponentProps {
  currentImageUrl?: string
  onImageUpload: (file: File) => Promise<void>
  uploading?: boolean
  maxSize?: number // in bytes
  showCamera?: boolean
  className?: string
}

export function PassportUploadComponent({
  currentImageUrl,
  onImageUpload,
  uploading = false,
  maxSize = 2 * 1024 * 1024, // 2MB default
  showCamera = true,
  className
}: PassportUploadComponentProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraAvailable, setIsCameraAvailable] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check camera availability on component mount
  useEffect(() => {
    if (!showCamera) return

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
  }, [showCamera])

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
          
          // Update preview
          const previewURL = URL.createObjectURL(blob)
          setPreviewUrl(previewURL)
          
          // Upload the file
          await onImageUpload(file)
          
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      
      // Validate file size
      if (file.size > maxSize) {
        setCameraError(`File too large. Please select an image smaller than ${Math.round(maxSize / (1024 * 1024))}MB.`)
        return
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        setCameraError('Please upload JPEG or PNG images only.')
        return
      }
      
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
      
      try {
        await onImageUpload(file)
      } catch (error) {
        setCameraError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const clearPreview = () => {
    setPreviewUrl(null)
    // Reset file input
    const input = document.getElementById('passport-upload-input') as HTMLInputElement
    if (input) input.value = ''
  }

  // Handle tab change
  useEffect(() => {
    if (activeTab === "camera" && showCamera) {
      startCamera()
    } else {
      stopCamera()
    }
  }, [activeTab, showCamera])

  return (
    <div className={className}>
      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Passport preview"
            className="w-full max-w-[300px] mx-auto rounded-md"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={clearPreview}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          {showCamera && isCameraAvailable ? (
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
                  Use Camera
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <Card className="border-dashed border-2 cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">JPG, JPEG or PNG (max. {Math.round(maxSize / (1024 * 1024))}MB)</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      id="passport-upload-input"
                      onChange={handleFileChange}
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
          ) : (
            // Simple upload interface when camera is not available/enabled
            <>
              {showCamera && cameraError && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Camera not available:</strong> {cameraError}
                    <br />
                    <span className="text-sm">You can still upload a photo using the upload button below.</span>
                  </AlertDescription>
                </Alert>
              )}
              
              <Card className="border-dashed border-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">JPG, JPEG or PNG (max. {Math.round(maxSize / (1024 * 1024))}MB)</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    className="hidden"
                    id="passport-upload-input"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  <label htmlFor="passport-upload-input" className="w-full h-full absolute inset-0 cursor-pointer">
                    <span className="sr-only">Upload passport photo</span>
                  </label>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}
