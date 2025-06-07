"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Copy,
  ExternalLink
} from "lucide-react"

interface SplitCode {
  id: number
  chapterId: number
  chapterName: string
  slotPackageId: number
  packageName: string
  slotCount: number
  splitCode: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Chapter {
  id: number
  name: string
  amount: string
}

interface SlotPackage {
  id: number
  name: string
  slotCount: number
}

export function SplitCodeManagement() {
  const [splitCodes, setSplitCodes] = useState<SplitCode[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [packages, setPackages] = useState<SlotPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<SplitCode | null>(null)
  const [formData, setFormData] = useState({
    chapterId: "",
    slotPackageId: "",
    splitCode: "",
    isActive: true
  })
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [splitCodesResponse, optionsResponse] = await Promise.all([
        fetch('/api/admin/split-codes'),
        fetch('/api/admin/split-codes/options')
      ])

      if (!splitCodesResponse.ok || !optionsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const splitCodesData = await splitCodesResponse.json()
      const optionsData = await optionsResponse.json()

      setSplitCodes(splitCodesData.splitCodes)
      setChapters(optionsData.chapters)
      setPackages(optionsData.packages)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load split codes data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.chapterId || !formData.slotPackageId || !formData.splitCode.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/admin/split-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save split code')
      }

      toast({
        title: "Success",
        description: data.message
      })

      setShowDialog(false)
      setEditingCode(null)
      setFormData({
        chapterId: "",
        slotPackageId: "",
        splitCode: "",
        isActive: true
      })
      fetchData()
    } catch (error) {
      console.error('Error saving split code:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save split code",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (splitCode: SplitCode) => {
    setEditingCode(splitCode)
    setFormData({
      chapterId: splitCode.chapterId.toString(),
      slotPackageId: splitCode.slotPackageId.toString(),
      splitCode: splitCode.splitCode,
      isActive: splitCode.isActive
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this split code?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/split-codes?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete split code')
      }

      toast({
        title: "Success",
        description: data.message
      })

      fetchData()
    } catch (error) {
      console.error('Error deleting split code:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete split code",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Split code copied to clipboard"
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return <div>Loading split codes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Split Code Management</h2>
          <p className="text-muted-foreground">
            Manage Paystack split codes for chapter-specific slot packages
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCode(null)
              setFormData({
                chapterId: "",
                slotPackageId: "",
                splitCode: "",
                isActive: true
              })
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Split Code
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCode ? 'Edit Split Code' : 'Add New Split Code'}
              </DialogTitle>
              <DialogDescription>
                Configure Paystack split codes for chapter-specific slot packages
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chapter">Chapter</Label>
                  <Select
                    value={formData.chapterId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, chapterId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters.map((chapter) => (
                        <SelectItem key={chapter.id} value={chapter.id.toString()}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package">Slot Package</Label>
                  <Select
                    value={formData.slotPackageId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, slotPackageId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id.toString()}>
                          {pkg.name} ({pkg.slotCount} slots)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="splitCode">Paystack Split Code</Label>
                <Input
                  id="splitCode"
                  placeholder="SPLT_xxxxxxxxx"
                  value={formData.splitCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, splitCode: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the Paystack split code for this chapter-package combination
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCode ? 'Update' : 'Create'} Split Code
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Split Codes</CardTitle>
          <CardDescription>
            Active split codes configured for chapters and slot packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {splitCodes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No split codes configured yet</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowDialog(true)}
              >
                Add First Split Code
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Split Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {splitCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-medium">
                      {code.chapterName}
                    </TableCell>
                    <TableCell>
                      {code.packageName}
                      <div className="text-sm text-muted-foreground">
                        {code.slotCount} slots
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {code.splitCode}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.splitCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.isActive ? "default" : "secondary"}>
                        {code.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(code.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(code)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(code.id)}
                          disabled={!code.isActive}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
