import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react'

interface ReportsSummaryProps {
  summary?: {
    totalRegistrations: number
    paidRegistrations: number
    pendingRegistrations: number
    byChapter: { [key: string]: number }
    bySchool: { [key: string]: number }
    byPaymentStatus: { [key: string]: number }
    registrations?: any[] // Add registrations array for detailed report
  }
  loading: boolean
}

export function ReportsSummary({ summary, loading }: ReportsSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>    )
  }  // Provide default values in case summary is undefined or properties are missing
  const safeSummary = {
    totalRegistrations: Number.isFinite(Number(summary?.totalRegistrations)) ? Number(summary?.totalRegistrations) : 0,
    paidRegistrations: Number.isFinite(Number(summary?.paidRegistrations)) ? Number(summary?.paidRegistrations) : 0,
    pendingRegistrations: Number.isFinite(Number(summary?.pendingRegistrations)) ? Number(summary?.pendingRegistrations) : 0,
    byChapter: summary?.byChapter && typeof summary.byChapter === 'object' ? summary.byChapter : {},
    bySchool: summary?.bySchool && typeof summary.bySchool === 'object' ? summary.bySchool : {},
    byPaymentStatus: summary?.byPaymentStatus && typeof summary.byPaymentStatus === 'object' ? summary.byPaymentStatus : {}
  }

  // Calculate total revenue using actual amount_paid for paid registrations
  const totalRevenue = Array.isArray(summary && summary.registrations)
    ? summary.registrations.filter((reg: any) => reg.payment_status === 'completed')
        .reduce((sum: number, reg: any) => sum + (Number(reg.amount_paid) || 0), 0)
    : 0

  const cards = [
    {
      title: 'Total Registrations',
      value: String(Number.isFinite(safeSummary.totalRegistrations) ? safeSummary.totalRegistrations : 0),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Approved Registrations',
      value: String(Number.isFinite(safeSummary.paidRegistrations) ? safeSummary.paidRegistrations : 0),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Pending Registrations',
      value: String(Number.isFinite(safeSummary.pendingRegistrations) ? safeSummary.pendingRegistrations : 0),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  return (    <div className="space-y-6">      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid Registrations</p>
                <p className="text-2xl font-bold">{String(Number.isFinite(safeSummary.paidRegistrations) ? safeSummary.paidRegistrations : 0)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unpaid Registrations</p>
                <p className="text-2xl font-bold">{String(Number.isFinite(safeSummary.pendingRegistrations) ? safeSummary.pendingRegistrations : 0)}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-50">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">₦{String(Number.isFinite(totalRevenue) ? totalRevenue : 0)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chapter Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrations by Chapter</CardTitle>
            <CardDescription>Distribution across different chapters</CardDescription>
          </CardHeader>
          <CardContent>            <div className="space-y-3">
              {Object.entries(safeSummary.byChapter).map(([chapter, count]) => {
                const numericCount = Number(count) || 0
                return (
                  <div key={chapter} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{chapter}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: safeSummary.totalRegistrations > 0 ? `${(numericCount / safeSummary.totalRegistrations) * 100}%` : '0%'
                          }}
                        ></div>
                      </div>
                      <Badge variant="secondary">{numericCount}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Payment distribution overview</CardDescription>
          </CardHeader>
          <CardContent>            <div className="space-y-3">
              {Object.entries(safeSummary.byPaymentStatus).map(([status, count]) => {
                const numericCount = Number(count) || 0
                const statusConfig = {
                  completed: { color: 'bg-green-600', label: 'Completed', icon: CheckCircle },
                  pending: { color: 'bg-orange-600', label: 'Pending', icon: Clock }
                  // Removed 'failed' status as it's not a valid status from the API
                }
                
                const config = statusConfig[status as keyof typeof statusConfig] || {
                  color: 'bg-gray-600',
                  label: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize status if not in config
                  icon: Clock // Default icon
                }

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${config.color} h-2 rounded-full`} 
                          style={{ 
                            width: safeSummary.totalRegistrations > 0 ? `${(numericCount / safeSummary.totalRegistrations) * 100}%` : '0%'
                          }}
                        ></div>
                      </div>
                      <Badge variant="secondary">{numericCount}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Schools */}
      <Card>
        <CardHeader>
          <CardTitle>Top Schools by Registration</CardTitle>
          <CardDescription>Schools with highest registration numbers</CardDescription>
        </CardHeader>
        <CardContent>          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(safeSummary.bySchool)
              .sort(([,a], [,b]) => (Number(b) || 0) - (Number(a) || 0))
              .slice(0, 6)
              .map(([school, count], index) => {
                const numericCount = Number(count) || 0
                return (
                  <div key={school} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium truncate">{school}</p>
                      <p className="text-xs text-gray-600">Rank #{index + 1}</p>
                    </div>
                    <Badge variant="outline">{numericCount}</Badge>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
