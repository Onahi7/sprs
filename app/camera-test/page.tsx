"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Download, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"

// Add client check
const isClient = typeof window !== 'undefined';

export default function CameraTestPage() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<any[]>([])
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    checkCameraSupport()
    enumerateDevices()
    
    return () => {
      stopStream()
    }
  }, [])

  const checkCameraSupport = () => {
    // Only run in browser
    if (!isClient) return;
    console.log("🔍 Checking camera support...");

    // Check browser support and environment
    const checks = {
      mediaDevicesSupport: !!navigator.mediaDevices,
      getUserMediaSupport: !!navigator.mediaDevices?.getUserMedia,
      httpsProtocol: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      userAgent: navigator.userAgent
    };
    
    console.log("Browser checks:", checks)
    
    if (!checks.mediaDevicesSupport || !checks.getUserMediaSupport) {
      setError("Browser doesn't support camera access");
      return;
    }
    
    if (!checks.httpsProtocol) {
      setError("Camera requires HTTPS connection (except localhost)");
      return;
    }
    
    setError(null)
  }

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setDeviceInfo(videoDevices)
      console.log("📹 Video devices found:", videoDevices)
    } catch (err) {
      console.error("Failed to enumerate devices:", err)
    }
  }

  const requestPermission = async () => {
    try {
      setError(null)
      console.log("🔐 Requesting camera permission...")
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      
      console.log("✅ Permission granted")
      setHasPermission(true)
      
      // Stop the stream immediately since we just wanted permission
      stream.getTracks().forEach(track => track.stop())
      
    } catch (err: any) {
      console.error("❌ Permission denied:", err)
      setHasPermission(false)
      
      let errorMessage = "Camera access denied. "
      if (err.name === 'NotAllowedError') {
        errorMessage += "Please allow camera access and refresh the page."
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera device found."
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Camera is already in use."
      } else {
        errorMessage += err.message
      }
      
      setError(errorMessage)
    }
  }

  const startStream = async () => {
    try {
      setError(null)
      console.log("🎥 Starting camera stream...")
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          console.log("📐 Video dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
        }
      }
      
      setIsStreaming(true)
      setHasPermission(true)
      console.log("✅ Stream started successfully")
      
    } catch (err: any) {
      console.error("❌ Failed to start stream:", err)
      setError(`Failed to start camera: ${err.message}`)
      setIsStreaming(false)
    }
  }

  const stopStream = () => {
    if (streamRef.current) {
      console.log("⏹️ Stopping camera stream...")
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsStreaming(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Video or canvas not available")
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setError("Video not ready for capture")
      return
    }

    console.log("📸 Capturing photo...")
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setError("Could not get canvas context")
      return
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const dataURL = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(dataURL)
    console.log("✅ Photo captured successfully")
  }

  const downloadImage = () => {
    if (!capturedImage) return
    
    const link = document.createElement('a')
    link.download = 'camera-test-capture.jpg'
    link.href = capturedImage
    link.click()
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Camera Test Page</h1>
        <p className="text-muted-foreground">Test camera functionality and debug issues</p>
      </div>

      {/* Browser Support Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Browser Support
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>MediaDevices API:</strong> {navigator.mediaDevices ? "✅ Supported" : "❌ Not supported"}
            </div>
            <div>
              <strong>getUserMedia:</strong> {typeof navigator.mediaDevices?.getUserMedia === 'function' ? "✅ Supported" : "❌ Not supported"}
            </div>
            <div>
              <strong>HTTPS Protocol:</strong> {location.protocol === 'https:' || location.hostname === 'localhost' ? "✅ Secure" : "❌ Requires HTTPS"}
            </div>
            <div>
              <strong>Video Devices:</strong> {deviceInfo.length} found
            </div>
          </div>
          
          {deviceInfo.length > 0 && (
            <div className="mt-4">
              <strong>Available Cameras:</strong>
              <ul className="mt-2 space-y-1">
                {deviceInfo.map((device, index) => (
                  <li key={device.deviceId} className="text-sm bg-gray-50 p-2 rounded">
                    {index + 1}. {device.label || `Camera ${index + 1}`} (ID: {device.deviceId.substring(0, 20)}...)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {hasPermission === true ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
            Camera Permission
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              Status: {
                hasPermission === null ? "Unknown" :
                hasPermission ? "✅ Granted" : "❌ Denied"
              }
            </div>
            
            <div className="flex gap-2">
              <Button onClick={requestPermission} disabled={isStreaming}>
                <Camera className="mr-2 h-4 w-4" />
                Request Permission
              </Button>
              
              <Button onClick={startStream} disabled={isStreaming || hasPermission === false}>
                Start Camera
              </Button>
              
              <Button onClick={stopStream} disabled={!isStreaming} variant="outline">
                Stop Camera
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Camera Feed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  Camera not active
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={capturePhoto} 
                disabled={!isStreaming}
                className="w-full"
              >
                <Camera className="mr-2 h-4 w-4" />
                Capture Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Captured Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-gray-500">
                  No photo captured yet
                </div>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={downloadImage} 
                disabled={!capturedImage}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Photo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify({
                hasPermission,
                isStreaming,
                error,
                deviceCount: deviceInfo.length,
                userAgent: navigator.userAgent,
                protocol: location.protocol,
                hostname: location.hostname,
                videoElement: videoRef.current ? {
                  readyState: videoRef.current.readyState,
                  videoWidth: videoRef.current.videoWidth,
                  videoHeight: videoRef.current.videoHeight,
                } : null
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
