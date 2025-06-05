"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Settings, 
  Send, 
  CreditCard,
  Database,
  Shield,
  Bell,
  Globe,
  Save
} from "lucide-react"

export default function AdminSettingsPage() {
  const [emailConfig, setEmailConfig] = useState<any>(null)
  const [emailTestResult, setEmailTestResult] = useState<any>(null)
  const [testEmail, setTestEmail] = useState("")
  const [loading, setLoading] = useState(false) 
  const [sendingTest, setSendingTest] = useState(false)
  const [saving, setSaving] = useState(false)
  const [systemStats, setSystemStats] = useState<any>(null)

  // Track HTTPS protocol on client only
  const [isHttps, setIsHttps] = useState<boolean | null>(null)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHttps(window.location.protocol === 'https:')
    }
  }, [])

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    host: "",
    port: "587",
    secure: "false",
    user: "",
    password: "",
    from: "",
    enabled: true
  })

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    paystackEnabled: true,
    paystackPublicKey: "",
    paystackSecretKey: "",
    testMode: true,
    webhookUrl: "",
    callbackUrl: ""
  })
  // System Settings State
  const [systemSettings, setSystemSettings] = useState({
    appName: "NAPPS Nasarawa State Unified Exams",
    appUrl: "",
    registrationEnabled: true,
    paymentEnabled: true,
    emailNotifications: true,
    maintenanceMode: false,
    maxRegistrationsPerUser: 1,
    registrationDeadline: "",
    supportEmail: "",
    supportPhone: ""
  })

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    sendRegistrationConfirmation: true,
    sendPaymentConfirmation: true,
    sendCoordinatorNotification: true,
    notifyAdminOnRegistration: true,
    notifyAdminOnPayment: true,
    dailyReportEmail: "",
    weeklyReportEmail: ""
  })
  useEffect(() => {
    loadSettings()
    loadSystemStats()
  }, [])

  const loadSystemStats = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getStats" }),
      })
      if (response.ok) {
        const data = await response.json()
        setSystemStats(data)
      }
    } catch (error) {
      console.error("Failed to load system stats:", error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        if (data.email) setEmailSettings(data.email)
        if (data.payment) setPaymentSettings(data.payment)
        if (data.system) setSystemSettings(data.system)
        if (data.notifications) setNotificationSettings(data.notifications)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const testEmailConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-email")
      const data = await response.json()
      setEmailConfig(data.config)
      setEmailTestResult(data.connection)
    } catch (error) {
      setEmailTestResult({ success: false, error: "Failed to test connection" })
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

  const saveSettings = async (section: string, settings: any) => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, settings }),
      })
      
      if (response.ok) {
        alert("Settings saved successfully!")
      } else {
        alert("Failed to save settings")
      }
    } catch (error) {
      alert("Error saving settings")
      console.error("Save settings error:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">        <div className="text-center">
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure and manage all system settings
          </p>
        </div>

        {/* System Overview */}
        {systemStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Overview
              </CardTitle>
              <CardDescription>
                Current system statistics and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{systemStats.totalRegistrations}</div>
                  <div className="text-sm text-muted-foreground">Total Registrations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{systemStats.completedPayments}</div>
                  <div className="text-sm text-muted-foreground">Completed Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{systemStats.totalCoordinators}</div>
                  <div className="text-sm text-muted-foreground">Total Coordinators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{systemStats.totalChapters}</div>
                  <div className="text-sm text-muted-foreground">Total Chapters</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Label>Uptime</Label>
                  <p className="text-muted-foreground">{Math.floor(systemStats.systemUptime / 3600)}h {Math.floor((systemStats.systemUptime % 3600) / 60)}m</p>
                </div>
                <div>
                  <Label>Node Version</Label>
                  <p className="text-muted-foreground">{systemStats.nodeVersion}</p>
                </div>
                <div>
                  <Label>Environment</Label>
                  <Badge variant={systemStats.environment === 'production' ? 'default' : 'secondary'}>
                    {systemStats.environment}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Email Settings Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for sending automated emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={emailSettings.enabled}
                    onCheckedChange={(checked) =>
                      setEmailSettings({ ...emailSettings, enabled: checked })
                    }
                  />
                  <Label>Enable Email Notifications</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailHost">SMTP Host</Label>
                    <Input
                      id="emailHost"
                      value={emailSettings.host}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, host: e.target.value })
                      }
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailPort">SMTP Port</Label>
                    <Input
                      id="emailPort"
                      value={emailSettings.port}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, port: e.target.value })
                      }
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailUser">Username</Label>
                    <Input
                      id="emailUser"
                      type="email"
                      value={emailSettings.user}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, user: e.target.value })
                      }
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailPassword">Password</Label>
                    <Input
                      id="emailPassword"
                      type="password"
                      value={emailSettings.password}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, password: e.target.value })
                      }
                      placeholder="App password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailFrom">From Address</Label>
                    <Input
                      id="emailFrom"
                      value={emailSettings.from}
                      onChange={(e) =>
                        setEmailSettings({ ...emailSettings, from: e.target.value })
                      }
                      placeholder="NAPPS SPRS <your-email@gmail.com>"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={emailSettings.secure === "true"}
                      onCheckedChange={(checked) =>
                        setEmailSettings({ ...emailSettings, secure: checked ? "true" : "false" })
                      }
                    />
                    <Label>Use SSL/TLS</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => saveSettings("email", emailSettings)} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Email Settings"}
                  </Button>
                  <Button variant="outline" onClick={testEmailConnection} disabled={loading}>
                    {loading ? "Testing..." : "Test Connection"}
                  </Button>
                </div>

                {emailTestResult && (
                  <Alert variant={emailTestResult.success ? "default" : "destructive"}>
                    <AlertDescription>
                      {emailTestResult.success ? emailTestResult.message : emailTestResult.error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Test Email Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Send Test Email</h4>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Configuration
                </CardTitle>
                <CardDescription>
                  Configure Paystack and other payment gateway settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={paymentSettings.paystackEnabled}
                    onCheckedChange={(checked) =>
                      setPaymentSettings({ ...paymentSettings, paystackEnabled: checked })
                    }
                  />
                  <Label>Enable Paystack Payments</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={paymentSettings.testMode}
                    onCheckedChange={(checked) =>
                      setPaymentSettings({ ...paymentSettings, testMode: checked })
                    }
                  />
                  <Label>Test Mode</Label>
                  <Badge variant={paymentSettings.testMode ? "secondary" : "default"}>
                    {paymentSettings.testMode ? "Test" : "Live"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="paystackPublicKey">Paystack Public Key</Label>
                    <Input
                      id="paystackPublicKey"
                      value={paymentSettings.paystackPublicKey}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, paystackPublicKey: e.target.value })
                      }
                      placeholder={paymentSettings.testMode ? "pk_test_..." : "pk_live_..."}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paystackSecretKey">Paystack Secret Key</Label>
                    <Input
                      id="paystackSecretKey"
                      type="password"
                      value={paymentSettings.paystackSecretKey}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, paystackSecretKey: e.target.value })
                      }
                      placeholder={paymentSettings.testMode ? "sk_test_..." : "sk_live_..."}
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={paymentSettings.webhookUrl}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, webhookUrl: e.target.value })
                      }
                      placeholder="https://yourapp.com/api/payment/webhook"
                    />
                  </div>
                  <div>
                    <Label htmlFor="callbackUrl">Callback URL</Label>
                    <Input
                      id="callbackUrl"
                      value={paymentSettings.callbackUrl}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, callbackUrl: e.target.value })
                      }
                      placeholder="https://yourapp.com/payment/callback"
                    />
                  </div>
                </div>

                <Button onClick={() => saveSettings("payment", paymentSettings)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Payment Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  General system settings and application configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      value={systemSettings.appName}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, appName: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="appUrl">Application URL</Label>
                    <Input
                      id="appUrl"
                      value={systemSettings.appUrl}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, appUrl: e.target.value })
                      }
                      placeholder="https://yourapp.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={systemSettings.supportEmail}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, supportEmail: e.target.value })
                      }
                      placeholder="support@yourapp.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      value={systemSettings.supportPhone}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, supportPhone: e.target.value })
                      }
                      placeholder="+234 xxx xxx xxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxRegistrations">Max Registrations Per User</Label>
                    <Input
                      id="maxRegistrations"
                      type="number"
                      value={systemSettings.maxRegistrationsPerUser}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, maxRegistrationsPerUser: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                    <Input
                      id="registrationDeadline"
                      type="datetime-local"
                      value={systemSettings.registrationDeadline}
                      onChange={(e) =>
                        setSystemSettings({ ...systemSettings, registrationDeadline: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={systemSettings.registrationEnabled}
                      onCheckedChange={(checked) =>
                        setSystemSettings({ ...systemSettings, registrationEnabled: checked })
                      }
                    />
                    <Label>Enable Registrations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={systemSettings.paymentEnabled}
                      onCheckedChange={(checked) =>
                        setSystemSettings({ ...systemSettings, paymentEnabled: checked })
                      }
                    />
                    <Label>Enable Payments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setSystemSettings({ ...systemSettings, maintenanceMode: checked })
                      }
                    />
                    <Label>Maintenance Mode</Label>
                    {systemSettings.maintenanceMode && (
                      <Badge variant="destructive">MAINTENANCE</Badge>
                    )}
                  </div>
                </div>

                <Button onClick={() => saveSettings("system", systemSettings)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save System Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure which notifications to send and when
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.sendRegistrationConfirmation}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, sendRegistrationConfirmation: checked })
                      }
                    />
                    <Label>Send Registration Confirmation Emails</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.sendPaymentConfirmation}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, sendPaymentConfirmation: checked })
                      }
                    />
                    <Label>Send Payment Confirmation Emails</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.sendCoordinatorNotification}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, sendCoordinatorNotification: checked })
                      }
                    />
                    <Label>Send Coordinator Notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.notifyAdminOnRegistration}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, notifyAdminOnRegistration: checked })
                      }
                    />
                    <Label>Notify Admin on New Registrations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={notificationSettings.notifyAdminOnPayment}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, notifyAdminOnPayment: checked })
                      }
                    />
                    <Label>Notify Admin on Payments</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dailyReport">Daily Report Email</Label>
                    <Input
                      id="dailyReport"
                      type="email"
                      value={notificationSettings.dailyReportEmail}
                      onChange={(e) =>
                        setNotificationSettings({ ...notificationSettings, dailyReportEmail: e.target.value })
                      }
                      placeholder="admin@yourapp.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weeklyReport">Weekly Report Email</Label>
                    <Input
                      id="weeklyReport"
                      type="email"
                      value={notificationSettings.weeklyReportEmail}
                      onChange={(e) =>
                        setNotificationSettings({ ...notificationSettings, weeklyReportEmail: e.target.value })
                      }
                      placeholder="reports@yourapp.com"
                    />
                  </div>
                </div>

                <Button onClick={() => saveSettings("notifications", notificationSettings)} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Notification Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Security and authentication configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Security settings are managed through environment variables and cannot be changed from this interface for security reasons.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Security Configuration</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>NextAuth Secret</Label>
                        <Badge variant="default">Configured</Badge>
                      </div>
                      <div>
                        <Label>Session Strategy</Label>
                        <Badge variant="default">JWT</Badge>
                      </div>
                      <div>
                        <Label>Password Hashing</Label>
                        <Badge variant="default">bcrypt</Badge>
                      </div>
                      <div>
                        <Label>HTTPS</Label>
                        <Badge variant={isHttps ? "default" : "secondary"}>
                          {isHttps === null ? "Detecting..." : isHttps ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Security Recommendations</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Use strong, unique passwords for all accounts</li>
                      <li>• Enable HTTPS in production</li>
                      <li>• Regularly update dependencies</li>
                      <li>• Monitor system logs for suspicious activity</li>
                      <li>• Use environment variables for sensitive data</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
