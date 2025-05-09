"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  chapterId: z.coerce.number().min(1, "Please select a chapter"),
  schoolId: z.coerce.number().optional(),
  schoolName: z.string().optional(),
  centerId: z.coerce.number().min(1, "Please select an exam center"),
  otherSchool: z.boolean().default(false),
})

type Chapter = {
  id: number
  name: string
}

type School = {
  id: number
  name: string
}

type Center = {
  id: number
  name: string
}

type SchoolDetailsStepProps = {
  data: any
  onNext: (data: any) => void
  onPrevious: () => void
}

export function SchoolDetailsStep({ data, onNext, onPrevious }: SchoolDetailsStepProps) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chapterId: data?.chapterId || 0,
      schoolId: data?.schoolId || 0,
      schoolName: data?.schoolName || "",
      centerId: data?.centerId || 0,
      otherSchool: data?.schoolId ? false : !!data?.schoolName,
    },
  })

  const otherSchool = form.watch("otherSchool")
  const selectedChapterId = form.watch("chapterId")

  // Fetch chapters on component mount
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch("/api/chapters")
        if (!response.ok) throw new Error("Failed to fetch chapters")
        const data = await response.json()
        setChapters(data)
      } catch (error) {
        console.error("Error fetching chapters:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChapters()
  }, [])

  // Fetch schools and centers when chapter changes
  useEffect(() => {
    if (!selectedChapterId) return

    const fetchSchoolsAndCenters = async () => {
      setLoading(true)
      try {
        // Fetch schools for selected chapter
        const schoolsResponse = await fetch(`/api/schools?chapterId=${selectedChapterId}`)
        if (!schoolsResponse.ok) throw new Error("Failed to fetch schools")
        const schoolsData = await schoolsResponse.json()
        setSchools(schoolsData)

        // Fetch centers for selected chapter
        const centersResponse = await fetch(`/api/centers?chapterId=${selectedChapterId}`)
        if (!centersResponse.ok) throw new Error("Failed to fetch centers")
        const centersData = await centersResponse.json()
        setCenters(centersData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSchoolsAndCenters()
  }, [selectedChapterId])

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Prepare data for next step
    const formData = {
      chapterId: values.chapterId,
      centerId: values.centerId,
    }

    if (values.otherSchool) {
      formData.schoolName = values.schoolName
    } else {
      formData.schoolId = values.schoolId
    }

    onNext(formData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="chapterId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chapter</FormLabel>
              <Select
                disabled={loading}
                onValueChange={(value) => field.onChange(Number.parseInt(value))}
                value={field.value ? field.value.toString() : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chapter" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id.toString()}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="otherSchool"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>My school is not listed</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {!otherSchool ? (
          <FormField
            control={form.control}
            name="schoolId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School</FormLabel>
                <Select
                  disabled={loading || !selectedChapterId}
                  onValueChange={(value) => field.onChange(Number.parseInt(value))}
                  value={field.value ? field.value.toString() : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a school" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="schoolName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your school name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="centerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Center</FormLabel>
              <Select
                disabled={loading || !selectedChapterId}
                onValueChange={(value) => field.onChange(Number.parseInt(value))}
                value={field.value ? field.value.toString() : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an exam center" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {centers.map((center) => (
                    <SelectItem key={center.id} value={center.id.toString()}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
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
