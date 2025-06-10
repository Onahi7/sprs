"use client"

import type React from "react"

// Fallback FileList type for non-browser environments
interface FileList {
  readonly length: number;
  item(index: number): File | null;
  [index: number]: File;
}

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, Camera, Image as ImageIcon, RefreshCw, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"]

const formSchema = z.object({
  passportPhoto: z.custom<FileList>((val) => {
    // Custom validation that works in both client and server environments
    if (typeof window === 'undefined') {
      return true // Skip validation during SSR
    }
    return val instanceof FileList
  }, "Must be a valid file input")
    .refine((files) => files.length > 0, "Passport photo is required.")
    .refine((files) => files[0]?.size <= MAX_FILE_SIZE, "File size must be less than 5MB.")
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      "Only .jpg, .jpeg, and .png formats are supported.",
    ),
})

type PassportUploadStepProps = {
  data: any
  onNext: (data: { passportUrl: string }) => void
  onPrevious: () => void
}

export function PassportUploadStep({ data, onNext, onPrevious }: PassportUploadStepProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(data?.passportUrl || null)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraAvailable, setIsCameraAvailable] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  // Check if camera is available on component mount
  useEffect(() => {
    const checkCameraAvailability = async () => {
      try {
        // First check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.log("Camera API not supported");
          setIsCameraAvailable(false);
          setCameraError("Camera API not supported by this browser");
          return;
        }

        // Check for HTTPS requirement
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          console.log("Camera requires HTTPS");
          setIsCameraAvailable(false);
          setCameraError("Camera access requires HTTPS connection");
          return;
        }

        // Check available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        if (!hasCamera) {
          console.log("No camera devices found");
          setIsCameraAvailable(false);
          setCameraError("No camera devices found");
          return;
        }

        console.log("Camera available, found devices:", devices.filter(d => d.kind === 'videoinput').length);
        setIsCameraAvailable(true);
        setCameraError(null);
      } catch (error) {
        console.error("Error checking camera availability:", error);
        setIsCameraAvailable(false);
        setCameraError(`Camera check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    checkCameraAvailability();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      console.log("Attempting to start camera...");
      setCameraError(null);
      
      // Request camera permissions with fallback constraints
      let stream: MediaStream;
      
      try {
        // Try with ideal constraints first
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
      } catch (idealError) {
        console.warn("Ideal constraints failed, trying basic constraints:", idealError);
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }
      
      console.log("Camera stream obtained successfully");
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to load and play
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded, dimensions:", 
            videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        };
        
        videoRef.current.oncanplay = () => {
          console.log("Video can play");
        };
        
        videoRef.current.onerror = (error) => {
          console.error("Video element error:", error);
          setCameraError("Failed to display camera feed");
        };
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      
      let errorMessage = "Could not access camera. ";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += "Please allow camera permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage += "No camera device found.";
        } else if (error.name === 'NotReadableError') {
          errorMessage += "Camera is already in use by another application.";
        } else if (error.name === 'OverconstrainedError') {
          errorMessage += "Camera doesn't support the requested settings.";
        } else {
          errorMessage += error.message;
        }
      }
      
      setCameraError(errorMessage);
      setActiveTab("upload"); // Switch back to upload tab on error
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      console.log("Stopping camera stream");
      cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind, track.label);
      });
      setCameraStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Handle tab change
  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
  }, [activeTab]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref not available");
      setCameraError("Camera capture failed: Missing video or canvas element");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.error("Video not ready for capture");
      setCameraError("Please wait for camera to fully load before capturing");
      return;
    }

    console.log("Capturing photo, video dimensions:", video.videoWidth, 'x', video.videoHeight);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Invalid video dimensions");
      setCameraError("Camera feed not properly loaded");
      return;
    }

    setIsCapturing(true);
    
    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      console.log("Photo captured, converting to blob...");
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        try {
          if (!blob) {
            throw new Error("Failed to create blob from canvas");
          }

          console.log("Blob created, size:", blob.size, "bytes");
          
          // Create a File object from the blob
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          
          // Create a FileList-like object
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          const fileList = dataTransfer.files;
          
          // Update form and preview
          form.setValue("passportPhoto", fileList);
          const previewURL = URL.createObjectURL(blob);
          setPreviewUrl(previewURL);
          
          console.log("Photo captured successfully");
          
          // Stop camera after capture
          stopCamera();
          setActiveTab("upload");
          setCameraError(null);
        } catch (error) {
          console.error("Error processing captured photo:", error);
          setCameraError(`Failed to process captured photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setIsCapturing(false);
        }
      }, "image/jpeg", 0.9);
    } catch (error) {
      console.error("Error during photo capture:", error);
      setCameraError(`Photo capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCapturing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
    }
  }

  const clearPreview = () => {
    setPreviewUrl(null)
    form.reset()
  }

  // Debug component for development
  const DebugInfo = () => {
    if (process.env.NODE_ENV === 'production') return null;
    
    return (
      <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs font-mono">
        <strong>Debug Info:</strong><br/>
        Camera Available: {isCameraAvailable ? 'Yes' : 'No'}<br/>
        Camera Stream: {cameraStream ? 'Active' : 'Inactive'}<br/>
        Active Tab: {activeTab}<br/>
        Camera Error: {cameraError || 'None'}<br/>
        Browser: {navigator.userAgent}<br/>
        HTTPS: {location.protocol === 'https:' ? 'Yes' : 'No'}<br/>
        Video Element Ready: {videoRef.current ? 'Yes' : 'No'}<br/>
        {videoRef.current && (
          <>
            Video Width: {videoRef.current.videoWidth || 'Unknown'}<br/>
            Video Height: {videoRef.current.videoHeight || 'Unknown'}<br/>
            Video ReadyState: {videoRef.current.readyState}<br/>
          </>
        )}
      </div>
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setUploading(true)

      // Create form data for file upload
      const formData = new FormData()
      formData.append("file", values.passportPhoto[0])

      // Upload file to storage service
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload passport photo")
      }

      const { url } = await response.json()

      // Pass the uploaded file URL to the next step
      onNext({ passportUrl: url })
    } catch (error) {
      console.error("Upload error:", error)
      form.setError("passportPhoto", {
        type: "manual",
        message: "Failed to upload passport photo. Please try again.",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="passportPhoto"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Passport Photograph</FormLabel>
              <FormControl>
                <div className="grid gap-4">
                  {!previewUrl ? (
                    <Tabs 
                      defaultValue="upload" 
                      value={activeTab} 
                      onValueChange={setActiveTab}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">
                          <ImageIcon className="mr-2 h-4 w-4" />
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
                          {process.env.NODE_ENV === 'development' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                navigator.mediaDevices.getUserMedia({ video: true })
                                  .then(() => {
                                    console.log("Permission granted manually");
                                    window.location.reload();
                                  })
                                  .catch(err => console.error("Manual permission failed:", err));
                              }}
                            >
                              Test Camera Permission
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <TabsContent value="upload">
                        <Card className="border-dashed border-2 cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground">JPG, JPEG or PNG (max. 5MB)</p>
                            <Input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              className="hidden"
                              id="passport-upload"
                              onChange={(e) => {
                                onChange(e.target.files)
                                handleFileChange(e)
                              }}
                              {...rest}
                            />
                            <label htmlFor="passport-upload" className="w-full h-full absolute inset-0 cursor-pointer">
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
                                    setCameraError(null);
                                    startCamera();
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
                                  
                                  {/* Loading overlay */}
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
                                    disabled={!cameraStream || isCapturing}
                                    className="flex items-center"
                                  >
                                    <Camera className="mr-2 h-4 w-4" />
                                    {isCapturing ? "Capturing..." : "Capture Photo"}
                                  </Button>
                                  
                                  {cameraStream && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => {
                                        stopCamera();
                                        setActiveTab("upload");
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
                    <div className="relative">
                      <img
                        src={previewUrl || "/placeholder.svg"}
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
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Debug Info Component */}
        <DebugInfo />

        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Next"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
