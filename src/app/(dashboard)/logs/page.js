import DevOverview from "@/components/developer/DevOverview";

export const metadata = {
  title: "Work Logs | WorkDashboard",
  description: "Logged engineering hours and task audit stream",
};

export default function LogsPage() {
  return <DevOverview activeSection="logs" />;
}
