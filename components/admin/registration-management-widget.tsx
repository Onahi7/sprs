"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  UserCog, Star, ArrowRight, Users, Settings, 
  Upload, Download, Edit, Eye, Zap 
} from "lucide-react"
import Link from "next/link"

export function RegistrationManagementWidget() {
  const quickActions = [
    {
      title: "Bulk Operations",
      description: "Change centers, update payments, transfer chapters",
      icon: Settings,
      href: "/admin/registrations/management?tab=bulk"
    },
    {
      title: "Import/Export",
      description: "CSV import, advanced exports, templates",
      icon: Upload,
      href: "/admin/registrations/management?tab=import-export"
    },
    {
      title: "Advanced Filters",
      description: "Search, filter, and manage registrations",
      icon: Eye,
      href: "/admin/registrations/management?tab=list"
    }
  ]

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Registration Management
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </CardTitle>
              <CardDescription>
                Advanced tools for comprehensive registration oversight
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            Enhanced
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
            >
              <action.icon className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
        
        <div className="pt-3 border-t">
          <Button asChild className="w-full">
            <Link href="/admin/registrations/management">
              <Zap className="mr-2 h-4 w-4" />
              Open Registration Management
            </Link>
          </Button>
        </div>
        
        <div className="text-xs text-center text-muted-foreground">
          💡 <strong>New features:</strong> Bulk operations, advanced filtering, and data import/export
        </div>
      </CardContent>
    </Card>
  )
}
