import ManagerViewRouter from "@/components/manager/ManagerViewRouter";

export const metadata = {
  title: "Engineer 360° | WorkDashboard",
  description: "360-degree engineer performance and allocation view",
};

export default function Engineer360Page() {
  return <ManagerViewRouter activeTab="engineer_360" />;
}
