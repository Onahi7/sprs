"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BarChart3, Home, School, Settings, Users, CreditCard, UserPlus, X, Trophy } from "lucide-react"
import { LogoutButton } from "@/components/auth/logout-button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useEffect } from "react"

const navItems = [
	{
		title: "Dashboard",
		href: "/coordinator",
		icon: Home,
	},
	{
		title: "Register Student",
		href: "/coordinator/register",
		icon: UserPlus,
		featured: true, // Mark as featured for special styling
	},  {
    title: "Supervisors",
    href: "/coordinator/supervisors",
    icon: Users,
  },
	{
		title: "Slots",
		href: "/coordinator/slots",
		icon: CreditCard,
	},
	{
		title: "Registrations",
		href: "/coordinator/registrations",
		icon: Users,
	},
	{
		title: "Results",
		href: "/coordinator/results",
		icon: Trophy,
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

interface CoordinatorSidebarProps {
	isOpen?: boolean
	onClose?: () => void
}

export function CoordinatorSidebar({ isOpen = false, onClose }: CoordinatorSidebarProps) {
	const pathname = usePathname()
	const isMobile = useIsMobile()

	// Close sidebar when clicking on a link on mobile
	const handleLinkClick = () => {
		if (isMobile && onClose) {
			onClose()
		}
	}

	// Handle escape key to close sidebar
	useEffect(() => {
		if (!isMobile) return

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen && onClose) {
				onClose()
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [isOpen, onClose, isMobile])

	// Prevent body scroll when mobile sidebar is open
	useEffect(() => {
		if (!isMobile) return

		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}

		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen, isMobile])

	if (isMobile) {
		return (
			<>
				{/* Mobile Overlay */}
				{isOpen && (
					<div 
						className="fixed inset-0 z-40 bg-black/50 md:hidden"
						onClick={onClose}
					/>
				)}
				
				{/* Mobile Sidebar */}
				<div className={`fixed top-0 left-0 z-50 h-full w-80 max-w-[80vw] bg-white dark:bg-gray-950 border-r transform transition-transform duration-300 ease-in-out md:hidden ${
					isOpen ? 'translate-x-0' : '-translate-x-full'
				}`}>
					<SidebarContent 
						pathname={pathname} 
						onLinkClick={handleLinkClick}
						showCloseButton
						onClose={onClose}
					/>
				</div>
			</>
		)
	}

	// Desktop Sidebar
	return (
		<div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-950 border-r fixed left-0 top-0 h-full z-30">
			<SidebarContent pathname={pathname} onLinkClick={handleLinkClick} />
		</div>
	)
}

interface SidebarContentProps {
	pathname: string
	onLinkClick: () => void
	showCloseButton?: boolean
	onClose?: () => void
}

function SidebarContent({ pathname, onLinkClick, showCloseButton, onClose }: SidebarContentProps) {
	return (
		<>
			<div className="p-6 flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">SPRS</h2>
					<p className="text-sm text-muted-foreground">Coordinator Portal</p>
				</div>
				{showCloseButton && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="p-2"
					>
						<X className="h-5 w-5" />
						<span className="sr-only">Close menu</span>
					</Button>
				)}
			</div>

			{/* Quick Register Button */}
			<div className="px-4 mb-4">
				<Link href="/coordinator/register" onClick={onLinkClick}>
					<Button 
						className="w-full bg-blue-600 hover:bg-blue-700 text-white"
						size="sm"
					>
						<UserPlus className="h-4 w-4 mr-2" />
						Register Student
					</Button>
				</Link>
			</div>

			<div className="flex-1 px-4 space-y-1 overflow-y-auto">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						onClick={onLinkClick}
						className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
							pathname === item.href
								? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
								: item.featured
								? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20 font-medium"
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
		</>
	)
}
