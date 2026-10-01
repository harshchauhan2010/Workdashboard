import ManagerViewRouter from "@/components/manager/ManagerViewRouter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Capacity Heatmap | WorkDashboard",
  description: "Manager capacity intelligence and squad workload heatmap",
};

export default function CapacityPage() {
  return <ManagerViewRouter activeTab="capacity" />;
}
