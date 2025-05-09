import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ChevronRight, Clock, FileText, Lightbulb, BookOpen, User, School } from "lucide-react"
import { Testimonials } from "@/components/home/testimonials"
import { Features } from "@/components/home/features"
import { FAQ } from "@/components/home/faq"
import { StatsSection } from "@/components/home/stats-section"
import { HeroIllustration } from "@/components/home/hero-illustration"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-[#006400]/95 text-white backdrop-blur supports-[backdrop-filter]:bg-[#006400]/80">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-[#006400] font-bold">NAPPS</span>
            </div>
            <h1 className="text-xl font-bold text-white">Nasarawa</h1>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Testimonials
            </Link>
            <Link
              href="#faq"
              className="text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-[#006400]">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-white text-[#006400] hover:bg-white/90">Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-[#006400]/10 to-white w-full">
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <Badge className="inline-flex mb-2 bg-[#006400] text-white" variant="outline">
                  Registration Open for 2025 Unified Exams
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter text-[#006400] sm:text-4xl md:text-5xl lg:text-6xl/none">
                  NAPPS Nasarawa State Unified Exams 2025
                </h1>
                <p className="max-w-[600px] text-gray-600 md:text-xl">
                  Register your students for the upcoming NAPPS Nasarawa State Unified Examinations. Join schools across the state in this comprehensive assessment.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-[#006400] hover:bg-[#008000] w-full sm:w-auto">
                      Start Registration
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/status">
                    <Button variant="outline" size="lg" className="text-[#006400] border-[#006400] hover:bg-[#006400]/10 w-full sm:w-auto">
                      Check Status
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="inline-block h-8 w-8 rounded-full bg-gray-200 ring-2 ring-background" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Join <span className="font-medium">200+</span> schools already registered
                  </p>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-[500px] animate-float relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#006400] mx-auto flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-[#006400]">Unified Exams 2025</h3>
                      <p className="text-gray-600">Excellence through Assessment</p>
                    </div>
                  </div>
                  <HeroIllustration />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <StatsSection />

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-[#f8f9fa] w-full">
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-[#006400] text-white px-3 py-1 text-sm">How It Works</div>
              <h2 className="text-3xl font-bold tracking-tighter text-[#006400] sm:text-4xl md:text-5xl">
                Simple Exam Registration Process
              </h2>
              <p className="max-w-[700px] text-gray-600 md:text-xl">
                Complete your school's exam registration in a few simple steps and prepare your students for the NAPPS Unified Exams
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 lg:gap-16">
              {[
                {
                  icon: School,
                  title: "Register Your School",
                  description: "Complete the online registration form with your school and student details",
                },
                {
                  icon: Clock,
                  title: "Make Payment",
                  description: "Pay the registration fee securely through our payment gateway",
                },
                {
                  icon: CheckCircle,
                  title: "Get Confirmation",
                  description: "Receive your registration confirmation and exam schedule",
                },
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#006400]/10">
                    <item.icon className="h-8 w-8 text-[#006400]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#006400]">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <Features />

        {/* Testimonials */}
        <Testimonials />

        {/* FAQ Section */}
        <FAQ />

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-[#006400] text-white w-full">
          <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Prepare Your Students for Excellence
                </h2>
                <p className="text-white/80 md:text-xl">
                  Join schools across Nasarawa State in the comprehensive NAPPS Unified Examinations 2025.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Link href="/register">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white text-[#006400] hover:bg-white/90">
                      Register Now
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/status">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto border-white text-white hover:bg-white/10"
                    >
                      Check Status
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="grid grid-cols-2 gap-4 w-full max-w-[500px]">
                  {[
                    { icon: BookOpen, label: "Standardized Testing" },
                    { icon: User, label: "Student Excellence" },
                    { icon: School, label: "School Recognition" },
                    { icon: CheckCircle, label: "Quality Assessment" }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                    >
                      <item.icon className="h-10 w-10 text-white mb-2" />
                      <span className="text-sm text-center text-white/90">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-[#006400] text-white w-full">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 mx-auto py-12">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <span className="text-[#006400] font-bold">NAPPS</span>
                </div>
                <h3 className="text-xl font-bold text-white">Nasarawa</h3>
              </div>
              <p className="text-sm text-white/80">
                National Association of Proprietors of Private Schools, Nasarawa State Chapter - Unified Examinations 2025.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/register" className="text-white/80 hover:text-white transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-white/80 hover:text-white transition-colors">
                    Check Status
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-white/80 hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="#faq" className="text-white/80 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/80 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Stay Updated</h4>
              <p className="text-sm text-white/80">Subscribe to our newsletter for updates</p>
              <form className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex h-9 w-full rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-white placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button type="submit" size="sm" className="bg-white text-[#006400] hover:bg-white/90">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
          <div className="mt-8 border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-white/70">
              &copy; {new Date().getFullYear()} NAPPS Nasarawa State Unified Exams. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-white/70 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-twitter"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="#" className="text-white/70 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-facebook"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link href="#" className="text-white/70 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-instagram"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
