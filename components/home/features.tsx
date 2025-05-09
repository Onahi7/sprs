import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CheckCircle, CreditCard, FileText, Lock, Mail, Shield, Smartphone, Users } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: FileText,
      title: "Easy Registration",
      description: "Simple and intuitive registration process with step-by-step guidance",
      badge: "Popular",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Safe and secure payment processing with multiple payment options",
    },
    {
      icon: CheckCircle,
      title: "Instant Confirmation",
      description: "Receive instant confirmation and registration slip after payment",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Register from any device with our responsive design",
    },
    {
      icon: Mail,
      title: "Email Notifications",
      description: "Get timely updates and reminders via email",
    },
    {
      icon: Shield,
      title: "Data Protection",
      description: "Your personal information is encrypted and securely stored",
      badge: "Secure",
    },
    {
      icon: Users,
      title: "Coordinator Dashboard",
      description: "Dedicated dashboard for chapter coordinators to manage registrations",
    },
    {
      icon: BookOpen,
      title: "Comprehensive Reports",
      description: "Generate detailed reports and analytics for administrators",
    },
    {
      icon: Lock,
      title: "Role-Based Access",
      description: "Different access levels for students, coordinators, and administrators",
    },
  ]

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Everything You Need</h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Our platform provides all the tools and features needed for a smooth registration experience
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  {feature.badge && <Badge variant="secondary">{feature.badge}</Badge>}
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
