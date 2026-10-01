import ManagerViewRouter from "@/components/manager/ManagerViewRouter";

export const metadata = {
  title: "Task Templates | WorkDashboard",
  description: "Task templates and blueprint library",
};

export default function TemplatesPage() {
  return <ManagerViewRouter activeTab="templates" />;
}
