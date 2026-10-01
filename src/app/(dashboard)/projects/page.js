import ManagerViewRouter from "@/components/manager/ManagerViewRouter";

export const metadata = {
  title: "Projects | WorkDashboard",
  description: "Client project teams hub",
};

export default function ProjectsPage() {
  return <ManagerViewRouter activeTab="projects" />;
}
