"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Mail, Settings, Send } from "lucide-react"

export default function EmailTestPage() {
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testEmail, setTestEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-email")
      const data = await response.json()
      setEmailConfig(data.config)
      setTestResult(data.connection)
    } catch (error) {
      setTestResult({ success: false, error: "Failed to test connection" })
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) return
    
    setSendingTest(true)
    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      })
      const data = await response.json()
      alert(data.message || "Test email sent!")
    } catch (error) {
      alert("Failed to send test email")
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Email Configuration Test</h1>
          <p className="text-muted-foreground mt-2">
            Test and verify your SMTP email configuration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              SMTP Configuration
            </CardTitle>
            <CardDescription>
              Current email configuration from environment variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testConnection} disabled={loading}>
              {loading ? "Testing..." : "Test Connection"}
            </Button>

            {emailConfig && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>SMTP Host</Label>
                  <p className="text-sm text-muted-foreground">
                    {emailConfig.host || "Not configured"}
                  </p>
                </div>
                <div>
                  <Label>SMTP Port</Label>
                  <p className="text-sm text-muted-foreground">
                    {emailConfig.port || "Not configured"}
                  </p>
                </div>
                <div>
                  <Label>Username</Label>
                  <p className="text-sm text-muted-foreground">
                    {emailConfig.user || "Not configured"}
                  </p>
                </div>
                <div>
                  <Label>Password</Label>
                  <Badge variant={emailConfig.hasPassword ? "default" : "destructive"}>
                    {emailConfig.hasPassword ? "Configured" : "Not configured"}
                  </Badge>
                </div>
                <div>
                  <Label>From Address</Label>
                  <p className="text-sm text-muted-foreground">
                    {emailConfig.from || "Not configured"}
                  </p>
                </div>
                <div>
                  <Label>Secure</Label>
                  <Badge variant={emailConfig.secure === "true" ? "default" : "secondary"}>
                    {emailConfig.secure === "true" ? "TLS/SSL" : "STARTTLS"}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Connection Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant={testResult.success ? "default" : "destructive"}>
                <AlertDescription>
                  {testResult.success ? testResult.message : testResult.error}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Test Email
            </CardTitle>
            <CardDescription>
              Send a test payment confirmation email to verify the setup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={sendTestEmail} disabled={sendingTest || !testEmail}>
                <Send className="h-4 w-4 mr-2" />
                {sendingTest ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Gmail Setup:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Enable 2-factor authentication on your Gmail account</li>
                <li>Generate an App Password (not your regular password)</li>
                <li>Use smtp.gmail.com, port 587, secure: false</li>
                <li>Use your Gmail address and app password</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Environment Variables:</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_SECURE="false"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="NAPPS SPRS <your-email@gmail.com>"`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
