"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, CloudCog } from 'lucide-react';

export default function CloudinaryTest() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  async function testCloudinary() {
    try {
      setStatus('testing');
      setError(null);
      
      const response = await fetch('/api/cloudinary-test');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error');
      }
      
      setResult(data);
      setStatus('success');
    } catch (err: any) {
      console.error('Cloudinary test failed:', err);
      setError(err.message);
      setStatus('error');
    }
  }

  async function testFileUpload() {
    try {
      setStatus('testing');
      setError(null);
      
      // Create a very small test image
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = 'blue';
        ctx.font = '20px Arial';
        ctx.fillText('Test', 25, 50);
      }
      
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      if (!blob) {
        throw new Error('Failed to create test image');
      }
      
      // Create file from blob
      const file = new File([blob], 'test-image.png', { type: 'image/png' });
      
      // Create FormData and append file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send to upload endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setResult(data);
      setStatus('success');
    } catch (err: any) {
      console.error('Upload test failed:', err);
      setError(err.message);
      setStatus('error');
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Cloudinary Integration Tests</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudCog className="h-5 w-5" />
              Connection Test
            </CardTitle>
            <CardDescription>
              Test if the app can connect to Cloudinary using your API credentials
            </CardDescription>
          </CardHeader>
          <CardContent>            {status === 'success' && result && (
              <div className="space-y-4">
                <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Connection successful!</AlertTitle>
                  <AlertDescription>
                    Your Cloudinary configuration is working correctly.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Configuration:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Cloud Name:</div>
                    <div>{result.config?.cloud_name}</div>
                    <div>API Key:</div>
                    <div>{result.config?.api_key}</div>
                    <div>API Secret:</div>
                    <div>{result.config?.api_secret}</div>
                  </div>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={testCloudinary}
              disabled={status === 'testing'}
              className="w-full"
            >
              {status === 'testing' ? 'Testing...' : 'Test Cloudinary Connection'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudCog className="h-5 w-5" />
              File Upload Test
            </CardTitle>
            <CardDescription>
              Test if the app can upload a test image to Cloudinary
            </CardDescription>
          </CardHeader>
          <CardContent>            {status === 'success' && result && result.url && (
              <div className="space-y-4">
                <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Upload successful!</AlertTitle>
                  <AlertDescription>
                    Your app can upload files to Cloudinary.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Upload Result:</h4>
                  <div className="w-full aspect-square max-w-[200px] mx-auto border rounded overflow-hidden">
                    <img src={result.url} alt="Uploaded test" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-xs text-center mt-2 text-gray-500 break-all">
                    {result.url}
                  </div>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={testFileUpload}
              disabled={status === 'testing'}
              className="w-full"
            >
              {status === 'testing' ? 'Testing...' : 'Test File Upload'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
