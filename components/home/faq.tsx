import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FAQ() {
  const faqs = [
    {
      question: "Who can register for the student project?",
      answer:
        "Any student currently enrolled in a recognized educational institution can register for the project. You will need to provide your school details during registration.",
    },
    {
      question: "What is the registration fee?",
      answer:
        "The standard registration fee is ₦3,000. However, fees may vary by chapter. The exact amount will be displayed during the registration process.",
    },
    {
      question: "How do I make payment?",
      answer:
        "We support multiple payment methods including debit cards, bank transfers, and USSD. All payments are processed securely through our payment gateway.",
    },
    {
      question: "Can I update my information after registration?",
      answer:
        "Yes, you can update certain information by logging into your account. However, some critical information like your name and registration number cannot be changed after submission.",
    },
    {
      question: "How do I get my registration slip?",
      answer:
        "After completing your registration and payment, you can download and print your registration slip from the status page. You can access this page anytime using your registration number.",
    },
    {
      question: "What if I lose my registration number?",
      answer:
        "If you lose your registration number, you can recover it by providing the email address used during registration. A recovery link will be sent to your email.",
    },
    {
      question: "Is there a deadline for registration?",
      answer:
        "Yes, registrations typically close two weeks before the project date. The exact deadline will be announced on our website and through email notifications.",
    },
    {
      question: "Who do I contact if I have issues with registration?",
      answer:
        "You can contact your chapter coordinator for assistance. Their contact information is available on the contact page. Alternatively, you can use the help center for common issues.",
    },
  ]

  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">FAQ</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Frequently Asked Questions</h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Find answers to common questions about the registration process
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
