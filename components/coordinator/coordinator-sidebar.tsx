"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BarChart3, Home, School, Settings, Users } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"

const navItems = [
  {
    title: "Dashboard",
    href: "/coordinator",
    icon: Home,
  },
  {
    title: "Registrations",
    href: "/coordinator/registrations",
    icon: Users,
  },
  {
    title: "Centers",
    href: "/coordinator/centers",
    icon: School,
  },
  {
    title: "Reports",
    href: "/coordinator/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/coordinator/settings",
    icon: Settings,
  },
]

export function CoordinatorSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-950 border-r">
      <div className="p-6">
        <h2 className="text-2xl font-bold">SPRS</h2>
        <p className="text-sm text-muted-foreground">Coordinator Portal</p>
      </div>

      <div className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
              pathname === item.href
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </div>

      <div className="p-4 mt-auto border-t">
        <LogoutButton />
      </div>
    </div>
  )
}
