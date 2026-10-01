import DevOverview from "@/components/developer/DevOverview";

export const metadata = {
  title: "Analytics | WorkDashboard",
  description: "Engineering velocity, capacity breakdown, and historical trends",
};

export default function AnalyticsPage() {
  return <DevOverview activeSection="analytics" />;
}
