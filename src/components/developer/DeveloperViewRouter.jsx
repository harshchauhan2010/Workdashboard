'use client';

import DevOverview from "./DevOverview";

export default function DeveloperViewRouter({ activeTab = "overview" }) {
  return <DevOverview activeSection={activeTab} />;
}
