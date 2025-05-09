"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

type InstructionsStepProps = {
  onNext: () => void
}

export function InstructionsStep({ onNext }: InstructionsStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Registration Instructions</h3>
        <p className="text-sm text-muted-foreground">
          Please read the following instructions carefully before proceeding
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                You will need to provide your personal information, school details, and parent/guardian information.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Prepare a recent passport photograph (JPG, JPEG, or PNG format, max 5MB) for upload.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>The registration fee is ₦3,000.00, payable via debit card, bank transfer, or USSD.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                After successful payment, you will receive a registration slip with your unique registration number.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>
                Keep your registration number safe as you will need it to check your registration status and print your
                slip.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Button onClick={onNext}>I Understand, Continue</Button>
      </div>
    </div>
  )
}
