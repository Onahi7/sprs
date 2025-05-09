"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  parentFirstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  parentLastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  parentPhone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  parentEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  parentConsent: z.boolean().refine((val) => val === true, {
    message: "You must consent to the terms and conditions.",
  }),
})

type ParentInfoStepProps = {
  data: any
  onNext: (data: z.infer<typeof formSchema>) => void
  onPrevious: () => void
}

export function ParentInfoStep({ data, onNext, onPrevious }: ParentInfoStepProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      parentFirstName: data?.parentFirstName || "",
      parentLastName: data?.parentLastName || "",
      parentPhone: data?.parentPhone || "",
      parentEmail: data?.parentEmail || "",
      parentConsent: data?.parentConsent || false,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    onNext(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="parentFirstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent/Guardian First Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter parent's first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentLastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent/Guardian Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter parent's last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent/Guardian Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter parent's phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent/Guardian Email</FormLabel>
              <FormControl>
                <Input placeholder="Enter parent's email address" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentConsent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I consent to my child's participation in this project and the processing of their personal data.
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button type="submit">Next</Button>
        </div>
      </form>
    </Form>
  )
}
