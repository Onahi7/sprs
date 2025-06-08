"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function PurchasesTable() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPurchases()
  }, [])

  async function fetchPurchases() {
    setLoading(true)
    const res = await fetch('/api/admin/dashboard/purchases')
    const data = await res.json()
    setPurchases(data)
    setLoading(false)
  }
  async function handleResendEmail(purchase: any) {
    try {
      const response = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId: purchase.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();
      toast({ 
        title: 'Email sent', 
        description: `Confirmation email sent to ${purchase.coordinatorName}` 
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to send confirmation email', 
        variant: 'destructive' 
      });
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Coordinator</TableHead>
          <TableHead>Chapter</TableHead>
          <TableHead>Package</TableHead>
          <TableHead>Slots</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.id}</TableCell>
            <TableCell>{p.coordinatorName}</TableCell>
            <TableCell>{p.chapterName}</TableCell>
            <TableCell>{p.packageName}</TableCell>
            <TableCell>{p.slotsPurchased}</TableCell>
            <TableCell>₦{p.amountPaid.toLocaleString()}</TableCell>
            <TableCell>{p.paymentStatus}</TableCell>
            <TableCell>{new Date(p.purchaseDate).toLocaleString()}</TableCell>
            <TableCell>
              <Button size="sm" onClick={() => handleResendEmail(p)} disabled={p.paymentStatus!=='completed'}>
                Resend Email
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
