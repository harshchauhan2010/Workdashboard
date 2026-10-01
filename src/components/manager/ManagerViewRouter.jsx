'use client';

import CapacityHeatmap from "./CapacityHeatmap";

export default function ManagerViewRouter({ activeTab = "capacity" }) {
  if (activeTab === "capacity") {
    return <CapacityHeatmap />;
  }

  return (
    <div className="space-y-6 animate-fade-in text-[#201C17]">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E2DA]">
        <div>
          <h1 className="text-xl font-display font-bold text-[#201C17] capitalize">
            {activeTab === "squads" && "Teams & Squads Hub"}
            {activeTab === "engineer_360" && "Engineer 360° Workload View"}
            {activeTab === "schedule" && "Date & Schedule Planning"}
            {activeTab === "projects" && "Client Project Teams Hub"}
            {activeTab === "blockers" && "Active Task Blockers & Risk Registry"}
            {activeTab === "templates" && "Task Templates & Blueprint Library"}
          </h1>
          <p className="text-xs text-[#7B7265] mt-1">
            Real-time multi-squad allocation, bottleneck detection, and sprint velocity tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E2DA] bg-white hover:bg-[#F7F6F5] text-xs font-semibold text-[#4A4239] transition-colors shadow-2xs">
            <i className="fa-solid fa-arrows-rotate text-[#7B7265]"></i>
            <span>Refresh</span>
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#285691] hover:bg-[#1F4373] text-white text-xs font-semibold transition-colors shadow-sm">
            <i className="fa-solid fa-plus"></i>
            <span>Quick Action</span>
          </button>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-white border border-[#E7E2DA] shadow-2xs min-h-[380px] flex flex-col items-center justify-center text-center space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-[#EEF3FB] text-[#285691] flex items-center justify-center text-xl shadow-2xs">
          <i className="fa-solid fa-cubes"></i>
        </div>
        <h3 className="text-base font-display font-bold text-[#201C17]">
          Manager Module: <span className="capitalize">{activeTab.replace("_", " ")}</span>
        </h3>
        <p className="text-xs text-[#7B7265] max-w-md">
          This tab view is ready to be expanded in Phase 4. Switch to <strong>Capacity Heatmap</strong> to view real-time developer loads.
        </p>
      </div>
    </div>
  );
}
