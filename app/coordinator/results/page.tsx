import { CoordinatorResultsManagement } from "@/components/coordinator/coordinator-results-management"

export default function CoordinatorResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Results Overview</h1>
        <p className="text-muted-foreground">
          View and export examination results for your chapter
        </p>
      </div>
      
      <CoordinatorResultsManagement />
    </div>
  )
}
