"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileDown, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Chapter = {
  id: number
  name: string
}

type Center = {
  id: number
  name: string
  chapterId: number
}

export function DownloadRecordsCard() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>("")
  const [selectedCenter, setSelectedCenter] = useState<string>("")
  const [filteredCenters, setFilteredCenters] = useState<Center[]>([])
  const [downloading, setDownloading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchChapters()
    fetchCenters()
  }, [])

  useEffect(() => {
    if (selectedChapter) {
      const filtered = centers.filter(center => center.chapterId === parseInt(selectedChapter))
      setFilteredCenters(filtered)
      setSelectedCenter("") // Reset center selection when chapter changes
    } else {
      setFilteredCenters([])
      setSelectedCenter("")
    }
  }, [selectedChapter, centers])

  const fetchChapters = async () => {
    try {
      const response = await fetch("/api/chapters")
      if (response.ok) {
        const data = await response.json()
        setChapters(data)
      }
    } catch (error) {
      console.error("Error fetching chapters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch chapters",
        variant: "destructive"
      })
    }
  }

  const fetchCenters = async () => {
    try {
      const response = await fetch("/api/centers")
      if (response.ok) {
        const data = await response.json()
        setCenters(data)
      }
    } catch (error) {
      console.error("Error fetching centers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch centers",
        variant: "destructive"
      })
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const params = new URLSearchParams()
      if (selectedChapter) params.append("chapterId", selectedChapter)
      if (selectedCenter) params.append("centerId", selectedCenter)
      params.append("format", "csv")

      const response = await fetch(`/api/admin/records/download?${params}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `registrations_${selectedChapter ? `chapter_${selectedChapter}_` : ""}${selectedCenter ? `center_${selectedCenter}_` : ""}${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: "Success",
          description: "Records downloaded successfully"
        })
      } else {
        throw new Error("Download failed")
      }
    } catch (error) {
      console.error("Error downloading records:", error)
      toast({
        title: "Error",
        description: "Failed to download records",
        variant: "destructive"
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Download Registration Records</CardTitle>
        <CardDescription>
          Download registration records by chapter and/or center in CSV format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Chapter (Optional)</label>
            <Select value={selectedChapter} onValueChange={setSelectedChapter}>
              <SelectTrigger>
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Chapters</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id.toString()}>
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Center (Optional)</label>
            <Select 
              value={selectedCenter} 
              onValueChange={setSelectedCenter}
              disabled={!selectedChapter}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedChapter ? "Select center" : "Select chapter first"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Centers</SelectItem>
                {filteredCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id.toString()}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleDownload} 
          disabled={downloading}
          className="w-full"
        >
          {downloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Download CSV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
