import ManagerViewRouter from "@/components/manager/ManagerViewRouter";

export const metadata = {
  title: "Teams & Squads | WorkDashboard",
  description: "Teams and squad performance overview",
};

export default function SquadsPage() {
  return <ManagerViewRouter activeTab="squads" />;
}
