import DevOverview from "@/components/developer/DevOverview";

export const metadata = {
  title: "My Tasks | WorkDashboard",
  description: "Kanban board and sprint task deliverables",
};

export default function TasksPage() {
  return <DevOverview activeSection="tasks" />;
}
