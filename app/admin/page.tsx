import { AdminDashboard } from "@/components/admin/dashboard"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await getSession()
  
  if (!session || session.role !== "admin") {
    redirect("/auth/login")
  }
  
  return <AdminDashboard />
}
                <CardTitle>Chapter Distribution</CardTitle>
                <CardDescription>Registrations by chapter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Chapter distribution chart will appear here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Registrations</CardTitle>
              <CardDescription>View and manage all registrations across all chapters</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminRegistrationsTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chapters</CardTitle>
              <CardDescription>Manage chapters, schools, and centers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Chapters management interface will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordinators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coordinators</CardTitle>
              <CardDescription>Manage chapter coordinators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Coordinators management interface will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Settings management interface will appear here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
