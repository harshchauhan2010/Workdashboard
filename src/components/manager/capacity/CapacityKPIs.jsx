'use client';

export default function CapacityKPIs({
  totalDevs = 0,
  squadsCount = 0,
  overallUtilization = 0,
  totalAllocatedHours = 0,
  totalCapacityHours = 0,
  overbookedCount = 0,
  teamsOnTrackCount = 0,
  totalTeamsCount = 0,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. ENGINEERS */}
      <div className="kpi-card space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="kpi-label">Engineers</span>
          <span className="kpi-icon bg-blue-50 text-blue-600">
            <i className="fa-solid fa-users"></i>
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="kpi-value text-slate-900" id="kpi-total-devs">
            {totalDevs}
          </span>
          <span className="text-xs font-medium text-slate-400">developers</span>
        </div>
        <div className="kpi-sub flex items-center gap-1.5" id="kpi-squads-count">
          <span>{squadsCount} Squads</span>
          <span className="text-slate-300">•</span>
          <span>{squadsCount} Leads</span>
        </div>
      </div>

      {/* 2. UTILIZATION */}
      <div className="kpi-card space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="kpi-label">Utilization</span>
          <span className="kpi-icon bg-emerald-50 text-emerald-600">
            <i className="fa-solid fa-chart-pie"></i>
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="kpi-value text-emerald-600" id="kpi-utilization-pct">
            {Number(overallUtilization).toFixed(1)}%
          </span>
        </div>
        <div className="kpi-sub" id="kpi-utilization-sub">
          {totalAllocatedHours.toFixed(0)}h / {totalCapacityHours.toFixed(0)}h allocated
        </div>
      </div>

      {/* 3. OVERBOOKED */}
      <div className="kpi-card space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="kpi-label">Overbooked</span>
          <span
            className={`kpi-icon ${
              overbookedCount > 0 ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`kpi-value ${
              overbookedCount > 0 ? "text-rose-600" : "text-amber-600"
            }`}
            id="kpi-overallocated-count"
          >
            {overbookedCount}
          </span>
          <span className="text-xs font-medium text-slate-400">engineers</span>
        </div>
        <div
          className={`kpi-sub flex items-center gap-1.5 ${
            overbookedCount > 0 ? "text-rose-600" : "text-amber-600"
          }`}
        >
          <i className="fa-solid fa-circle-exclamation text-[11px]"></i>
          <span>Over 40h weekly limit</span>
        </div>
      </div>

      {/* 4. PROJECT DELIVERY SLA */}
      <div className="kpi-card space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="kpi-label">Project Delivery SLA</span>
          <span className="kpi-icon bg-indigo-50 text-indigo-600">
            <i className="fa-solid fa-diagram-project"></i>
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="kpi-value text-slate-900">
            {teamsOnTrackCount}{" "}
            <span className="text-base font-normal text-slate-400">
              / {totalTeamsCount || squadsCount || 1}
            </span>
          </span>
          <span className="text-xs font-medium text-slate-400">teams</span>
        </div>
        <div className="kpi-sub text-emerald-600 flex items-center gap-1.5">
          <i className="fa-solid fa-circle-check text-[11px]"></i>
          <span>All squad milestones on track</span>
        </div>
      </div>
    </div>
  );
}
