import ManagerViewRouter from "@/components/manager/ManagerViewRouter";

export const metadata = {
  title: "Schedule Planning | WorkDashboard",
  description: "Sprint schedule and routine cadence planning",
};

export default function SchedulePage() {
  return <ManagerViewRouter activeTab="schedule" />;
}
