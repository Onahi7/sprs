import { SupervisorsManagement } from "@/components/coordinator/supervisors-management";

export default function SupervisorsPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supervisors</h1>
      <SupervisorsManagement />
    </div>
  );
}
