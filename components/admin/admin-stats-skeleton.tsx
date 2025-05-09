import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AdminStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="overflow-hidden border-t-4 border-t-blue-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-32" />
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-t-4 border-t-green-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-32" />
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-4 w-28" />
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-t-4 border-t-purple-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-32" />
          <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
            <Skeleton className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-8" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-8" />
            </div>
          </div>
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    </div>
  )
}
