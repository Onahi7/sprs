import { AdminSupervisorsView } from "@/components/admin/supervisors-view";

export default function AdminSupervisorsPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Supervisors</h1>
          <p className="text-gray-600">Manage supervisors across all chapters and centers</p>
        </div>
        <AdminSupervisorsView />
      </div>
    </div>
  );
}
