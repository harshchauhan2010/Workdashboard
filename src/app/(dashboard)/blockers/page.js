import ManagerViewRouter from "@/components/manager/ManagerViewRouter";

export const metadata = {
  title: "Blockers & Risks | WorkDashboard",
  description: "Active task blockers and risk registry",
};

export default function BlockersPage() {
  return <ManagerViewRouter activeTab="blockers" />;
}
