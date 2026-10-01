import DevOverview from "@/components/developer/DevOverview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Overview | WorkDashboard",
  description: "Developer engineering capacity, sprint velocity, and schedule overview",
};

export default function OverviewPage() {
  return <DevOverview activeSection="overview" />;
}
