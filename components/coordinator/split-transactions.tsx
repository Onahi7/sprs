"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { 
  CreditCard, 
  Copy, 
  CheckCircle, 
  TrendingUp,
  DollarSign,
  Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SplitTransaction {
  id: number
  registrationNumber: string
  studentName: string
  schoolName: string
  centerName: string
  parentEmail: string
  paymentReference: string
  splitCode: string
  amount: string
  paidAt: string
  status: string
}

interface SplitTransactionsProps {
  chapterId: number
}

export function SplitTransactions({ chapterId }: SplitTransactionsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<SplitTransaction[]>([])
  const [splitCode, setSplitCode] = useState<string>("")
  const [totalAmount, setTotalAmount] = useState<number>(0)

  useEffect(() => {
    async function fetchSplitTransactions() {
      try {
        setLoading(true)
        const response = await fetch(`/api/coordinator/dashboard/split-transactions?chapterId=${chapterId}`)
        const data = await response.json()

        if (data.success) {
          setTransactions(data.transactions)
          setSplitCode(data.splitCode)
          setTotalAmount(data.totalAmount)
        } else {
          console.error("Failed to fetch split transactions:", data.error)
        }
      } catch (error) {
        console.error("Error fetching split transactions:", error)
        toast({
          title: "Error",
          description: "Failed to load split code transactions",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (chapterId) {
      fetchSplitTransactions()
    }
  }, [chapterId, toast])

  const handleCopySplitCode = () => {
    if (splitCode) {
      navigator.clipboard.writeText(splitCode)
      toast({
        title: "Copied!",
        description: "Split code copied to clipboard",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(parseFloat(amount))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!splitCode) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No Split Code Configured</h3>
            <p className="text-muted-foreground">
              Contact your administrator to set up a split code for this chapter.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Split Code</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold font-mono">{splitCode}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySplitCode}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Chapter Payment Split Code
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Payments using split code
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalAmount.toString())}</div>
            <p className="text-xs text-muted-foreground">
              Revenue through split code
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Split Code Transactions</CardTitle>
          <CardDescription>
            All payments that were processed using your chapter's split code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground">
                Transactions using your split code will appear here once payments are made.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.registrationNumber}
                      </TableCell>
                      <TableCell>{transaction.studentName}</TableCell>
                      <TableCell>{transaction.schoolName}</TableCell>
                      <TableCell>{formatAmount(transaction.amount)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.paymentReference}
                      </TableCell>
                      <TableCell>{formatDate(transaction.paidAt)}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
