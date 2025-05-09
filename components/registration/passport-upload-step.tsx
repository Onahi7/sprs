"use client"

import type React from "react"

// Fallback FileList type for non-browser environments
interface FileList {
  readonly length: number;
  item(index: number): File | null;
  [index: number]: File;
}

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X } from "lucide-react"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"]

const formSchema = z.object({
  passportPhoto: z.custom<FileList>((val) => {
    // Custom validation that works in both client and server environments
    if (typeof window === 'undefined') {
      return true // Skip validation during SSR
    }
    return val instanceof FileList
  }, "Must be a valid file input")
    .refine((files) => files.length > 0, "Passport photo is required.")
    .refine((files) => files[0]?.size <= MAX_FILE_SIZE, "File size must be less than 5MB.")
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      "Only .jpg, .jpeg, and .png formats are supported.",
    ),
})

type PassportUploadStepProps = {
  data: any
  onNext: (data: { passportUrl: string }) => void
  onPrevious: () => void
}

export function PassportUploadStep({ data, onNext, onPrevious }: PassportUploadStepProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(data?.passportUrl || null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const fileUrl = URL.createObjectURL(file)
      setPreviewUrl(fileUrl)
    }
  }

  const clearPreview = () => {
    setPreviewUrl(null)
    form.reset()
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setUploading(true)

      // Create form data for file upload
      const formData = new FormData()
      formData.append("file", values.passportPhoto[0])

      // Upload file to storage service
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload passport photo")
      }

      const { url } = await response.json()

      // Pass the uploaded file URL to the next step
      onNext({ passportUrl: url })
    } catch (error) {
      console.error("Upload error:", error)
      form.setError("passportPhoto", {
        type: "manual",
        message: "Failed to upload passport photo. Please try again.",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="passportPhoto"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Passport Photograph</FormLabel>
              <FormControl>
                <div className="grid gap-4">
                  {!previewUrl ? (
                    <Card className="border-dashed border-2 cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop</p>
                        <p className="text-xs text-muted-foreground">JPG, JPEG or PNG (max. 5MB)</p>
                        <Input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          className="hidden"
                          id="passport-upload"
                          onChange={(e) => {
                            onChange(e.target.files)
                            handleFileChange(e)
                          }}
                          {...rest}
                        />
                        <label htmlFor="passport-upload" className="w-full h-full absolute inset-0 cursor-pointer">
                          <span className="sr-only">Upload passport photo</span>
                        </label>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="relative">
                      <img
                        src={previewUrl || "/placeholder.svg"}
                        alt="Passport preview"
                        className="w-full max-w-[300px] mx-auto rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearPreview}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={onPrevious}>
            Previous
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Next"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
