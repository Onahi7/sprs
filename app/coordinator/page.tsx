import { CoordinatorDashboard } from "@/components/coordinator/dashboard"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CoordinatorPage() {
  const session = await getSession()
  
  if (!session || session.role !== "coordinator") {
    redirect("/auth/login")
  }
  
  return <CoordinatorDashboard />
}
          <TabsTrigger value="schools">Schools</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>Daily registration count for the past 30 days</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <RegistrationChart />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>School Distribution</CardTitle>
                <CardDescription>Registrations by school</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  School distribution chart will appear here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Registrations</CardTitle>
              <CardDescription>View and manage all registrations for your chapter</CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exam Centers</CardTitle>
              <CardDescription>View and manage exam centers for your chapter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Centers management interface will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schools</CardTitle>
              <CardDescription>View schools and registration counts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Schools management interface will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
