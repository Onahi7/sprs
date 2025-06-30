"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, Settings, Upload, Download, Edit, Eye, 
  Trash2, MapPin, Building, CreditCard, FileText,
  CheckCircle, Clock, AlertTriangle, Database
} from "lucide-react"
import Link from "next/link"

export function RegistrationManagementSummary() {
  const features = [
    {
      icon: Users,
      title: "Advanced Registration Viewing",
      description: "Comprehensive list view with detailed filtering, search, and real-time statistics",
      badge: "Enhanced"
    },
    {
      icon: Edit,
      title: "Individual Registration Management", 
      description: "Edit student details, parent information, chapter/school assignments, and payment status",
      badge: "Full Control"
    },
    {
      icon: Settings,
      title: "Bulk Operations",
      description: "Change centers, transfer chapters, update payments, and delete multiple registrations",
      badge: "Efficient"
    },
    {
      icon: Upload,
      title: "Data Import",
      description: "Bulk import registrations from CSV with error reporting and duplicate prevention",
      badge: "Scalable"
    },
    {
      icon: Download,
      title: "Advanced Export",
      description: "Export to CSV, Excel, or PDF with advanced filtering and date ranges",
      badge: "Flexible"
    },
    {
      icon: Eye,
      title: "Detailed Registration View",
      description: "Complete registration information with passport photos and document management",
      badge: "Comprehensive"
    }
  ]

  const capabilities = [
    { icon: MapPin, text: "Bulk center reassignment" },
    { icon: Building, text: "Chapter transfers with validation" },
    { icon: CreditCard, text: "Payment status management" },
    { icon: FileText, text: "Registration slip generation" },
    { icon: Database, text: "Import/Export with CSV templates" },
    { icon: Trash2, text: "Safe bulk deletion with confirmations" }
  ]

  const stats = [
    { label: "Enhanced Filtering", value: "8+ Filters", icon: CheckCircle },
    { label: "Bulk Operations", value: "6 Actions", icon: Settings },
    { label: "Export Formats", value: "3 Types", icon: Download },
    { label: "Search Fields", value: "10+ Fields", icon: Users }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Advanced Registration Management</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive tools for administrators to efficiently manage student registrations 
          with advanced filtering, bulk operations, and data import/export capabilities.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <stat.icon className="h-4 w-4 text-primary" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <Badge variant="secondary">{feature.badge}</Badge>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Key Capabilities
          </CardTitle>
          <CardDescription>
            Powerful tools designed for efficient chapter registration oversight
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((capability, index) => (
              <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                <capability.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{capability.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Common Workflows</CardTitle>
          <CardDescription>
            Typical administrative tasks made simple with the new management tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Bulk Center Assignment
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>1. Filter registrations by chapter</li>
                <li>2. Select unassigned registrations</li>
                <li>3. Choose target examination center</li>
                <li>4. Execute bulk assignment</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-600" />
                Bulk Data Import
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>1. Download CSV template</li>
                <li>2. Fill with registration data</li>
                <li>3. Select target chapter</li>
                <li>4. Upload and process file</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-orange-600" />
                Payment Status Update
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>1. Filter by pending payments</li>
                <li>2. Select verified registrations</li>
                <li>3. Bulk update to completed</li>
                <li>4. Generate registration slips</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Download className="h-4 w-4 text-purple-600" />
                Data Export & Reports
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>1. Apply date and chapter filters</li>
                <li>2. Select export format (CSV/PDF)</li>
                <li>3. Generate comprehensive report</li>
                <li>4. Download for analysis</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Features */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Safety & Security Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-orange-800 mb-2">Data Protection</h5>
              <ul className="space-y-1 text-orange-700">
                <li>• Confirmation dialogs for destructive operations</li>
                <li>• Bulk operation previews before execution</li>
                <li>• Import error reporting and validation</li>
                <li>• Automatic duplicate detection</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-orange-800 mb-2">Access Control</h5>
              <ul className="space-y-1 text-orange-700">
                <li>• Admin-only access with session validation</li>
                <li>• Audit trails for significant changes</li>
                <li>• Secure file upload and processing</li>
                <li>• Data encryption in transit and at rest</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Get Started */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-primary">Ready to Get Started?</h3>
              <p className="text-muted-foreground">
                Access the advanced registration management tools and streamline your administrative workflows
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/admin/registrations/management">
                  <Users className="mr-2 h-4 w-4" />
                  Open Registration Management
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/ADMIN_REGISTRATION_MANAGEMENT.md">
                  <FileText className="mr-2 h-4 w-4" />
                  View Documentation
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
