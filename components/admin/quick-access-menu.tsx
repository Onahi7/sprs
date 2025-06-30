"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCog, Plus, X, Star, Zap, Settings, Upload, Eye } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function QuickAccessMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  
  // Don't show on the registration management page itself
  if (pathname.includes("/admin/registrations/management")) {
    return null
  }

  const quickLinks = [
    {
      title: "Registration Management",
      description: "Advanced registration tools",
      href: "/admin/registrations/management",
      icon: UserCog,
      featured: true
    },
    {
      title: "Bulk Operations",
      description: "Mass changes & updates",
      href: "/admin/registrations/management?tab=bulk",
      icon: Settings
    },
    {
      title: "Import/Export",
      description: "Data management tools",
      href: "/admin/registrations/management?tab=import-export",
      icon: Upload
    },
    {
      title: "Advanced Filters",
      description: "Detailed search & view",
      href: "/admin/registrations/management?tab=list",
      icon: Eye
    }
  ]

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50">
        {/* Quick Access Links */}
        {isOpen && (
          <div className="mb-4 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
            {quickLinks.map((link, index) => (
              <Card 
                key={index} 
                className="w-64 shadow-lg border-2 hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-3">
                  <Link 
                    href={link.href}
                    className="flex items-center gap-3 group"
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon className={`h-5 w-5 ${link.featured ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{link.title}</p>
                        {link.featured && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Main Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              className={`h-14 w-14 rounded-full shadow-lg transition-all duration-200 ${
                isOpen 
                  ? 'bg-red-600 hover:bg-red-700 rotate-45' 
                  : 'bg-primary hover:bg-primary/90 hover:scale-110'
              }`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <div className="relative">
                  <UserCog className="h-6 w-6" />
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-amber-500 text-white border-0"
                  >
                    <Star className="h-2 w-2" />
                  </Badge>
                </div>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="mb-2">
            {isOpen ? "Close menu" : "Quick Access - Registration Management"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
