"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Home, Settings, Users, BookOpen, Map, Building2, FileText, Mail, Zap, AlertTriangle, UserCog, Star } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"

const navItems = [
	{
		title: "Dashboard",
		href: "/admin",
		icon: Home,
	},
	{
		title: "Registrations",
		href: "/admin/registrations",
		icon: Users,
		description: "View all registrations"
	},
	{
		title: "Registration Management",
		href: "/admin/registrations/management",
		icon: UserCog,
		description: "Advanced registration tools",
		isNew: true,
		featured: true
	},
	{
		title: "Duplicates",
		href: "/admin/duplicates",
		icon: AlertTriangle,
	},
	{
		title: "Chapters",
		href: "/admin/chapters",
		icon: Map,
	},
	{
		title: "Schools",
		href: "/admin/schools",
		icon: BookOpen,
	},
	{
		title: "Centers",
		href: "/admin/centers",
		icon: Building2,
	},
	{
		title: "Coordinators",
		href: "/admin/coordinators",
		icon: Users,
	},
	{
		title: "Slot Management",
		href: "/admin/slots",
		icon: Zap,
	},
	{
		title: "Supervisors",
		href: "/admin/supervisors",
		icon: Users,
	},
	{
		title: "Reports",
		href: "/admin/reports",
		icon: BarChart3,
	},
	{
		title: "Demo Slip",
		href: "/admin/demo-slip",
		icon: FileText,
	},
	{
		title: "Email Test",
		href: "/admin/email-test",
		icon: Mail,
	},
	{
		title: "Settings",
		href: "/admin/settings",
		icon: Settings,
	},
]

export function AdminSidebar({ duplicatesCount = 0 }: { duplicatesCount?: number }) {
	const pathname = usePathname()

	return (
		<div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-950 border-r">		<div className="p-6">
			<h2 className="text-2xl font-bold">NAPPS</h2>
			<p className="text-sm text-muted-foreground">Nasarawa Unified Exams</p>
		</div>

			<div className="flex-1 px-4 space-y-1">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all relative ${
							pathname === item.href
								? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
								: "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
						} ${item.featured ? 'border border-primary/20 bg-primary/5 hover:bg-primary/10' : ''}`}
					>
						<item.icon className={`h-4 w-4 ${item.featured ? 'text-primary' : ''}`} />
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<span className={item.featured ? 'font-medium' : ''}>{item.title}</span>
								{item.featured && (
									<Star className="h-3 w-3 text-primary fill-primary" />
								)}
								{item.isNew && (
									<Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
										New
									</Badge>
								)}
							</div>
							{item.description && (
								<p className="text-xs text-muted-foreground/70 truncate">
									{item.description}
								</p>
							)}
						</div>
						{item.href === "/admin/duplicates" && duplicatesCount > 0 && (
							<span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
								{duplicatesCount}
							</span>
						)}
					</Link>
				))}
			</div>

			<div className="p-4 mt-auto border-t">
				<LogoutButton />
			</div>
		</div>
	)
}
