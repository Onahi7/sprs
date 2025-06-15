import { FacilitatorsManagement } from "@/components/coordinator/facilitators-management";

export default function FacilitatorsPage() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Facilitators</h1>
      <FacilitatorsManagement />
    </div>
  );
}
