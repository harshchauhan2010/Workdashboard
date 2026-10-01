'use client';

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import api from "@/lib/api-client";

export default function DeveloperSidebar({ activeTab = "overview", onTabChange, onSearchClick }) {
  const { userSquad, userCapacity, currentUser } = useApp();
  const [taskCount, setTaskCount] = useState(null);

  // Fetch real-time count of tasks assigned to this developer
  useEffect(() => {
    if (!currentUser?.id) return;
    let isMounted = true;
    async function fetchTaskCount() {
      try {
        const res = await api.get(`/api/tasks?assigned_user_id=${currentUser.id}`);
        const data = res.data?.data || res.data?.tasks || res.data || [];
        if (isMounted && Array.isArray(data)) {
          setTaskCount(data.length);
        }
      } catch (err) {
        console.warn("Could not retrieve task count for sidebar badge:", err?.message || err);
      }
    }
    fetchTaskCount();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Derive Squad Information dynamically with safe fallbacks
  const squadName = userSquad?.name?.split(" (")?.[0] || userSquad?.name || "Squad A";
  const squadDomain = userSquad?.focus_domain || userSquad?.domain || userSquad?.description || "Backend · FinTech Core";
  const squadLead = userSquad?.lead_name || userSquad?.lead || "";
  const squadSubtitle = squadLead ? `${squadDomain} · Lead: ${squadLead}` : squadDomain;

  // Derive Capacity gauge numbers dynamically from backend DB
  const weeklyCapacity = Number(userCapacity?.weekly_capacity_hours) || 40.0;
  const totalLoad = Number(userCapacity?.total_load_hours) || 37.5;
  const utilizationPct = userCapacity?.utilization_pct !== undefined
    ? Math.round(Number(userCapacity.utilization_pct))
    : Math.round((totalLoad / weeklyCapacity) * 100);

  const isOver = totalLoad > weeklyCapacity;
  const diffHours = Math.abs(weeklyCapacity - totalLoad).toFixed(1);

  const handleNavClick = (tabId, sectionId) => {
    onTabChange?.(tabId);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 select-none z-10 h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Search Trigger */}
        <div className="px-4 pt-5 pb-1">
          <button
            onClick={onSearchClick}
            type="button"
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-magnifying-glass text-xs text-slate-400"></i>
              <span>Search...</span>
            </span>
            <kbd className="text-xs font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation with ample spacing below Search */}
        <nav className="px-4 pt-6 space-y-6">
          {/* Developer Nav */}
          <div>
            <div>
              <div className="px-2 pb-2.5 text-[11px] font-semibold text-slate-400 tracking-[0.07em] uppercase">
                My Workspace
              </div>
              <div className="space-y-1">
                {/* Overview */}
                <button
                  type="button"
                  onClick={() => handleNavClick("overview", "dev-section-overview")}
                  className={`devnav-btn w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 font-medium hover:bg-slate-50"
                  }`}
                >
                  <i className="fa-solid fa-gauge-high w-5 text-center text-xs text-blue-500"></i>
                  <span className="truncate">Overview</span>
                </button>

                {/* My Tasks */}
                <button
                  type="button"
                  onClick={() => handleNavClick("tasks", "dev-section-tasks")}
                  className={`devnav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === "tasks"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 font-medium hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <i className="fa-solid fa-list-check w-5 text-center text-xs text-indigo-500"></i>
                    <span className="truncate">My Tasks</span>
                  </span>
                  <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                    {taskCount !== null ? taskCount : "12"}
                  </span>
                </button>

                {/* My Analytics */}
                <button
                  type="button"
                  onClick={() => handleNavClick("analytics", "dev-section-analytics")}
                  className={`devnav-btn w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === "analytics"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 font-medium hover:bg-slate-50"
                  }`}
                >
                  <i className="fa-solid fa-chart-pie w-5 text-center text-xs text-purple-500"></i>
                  <span className="truncate">My Analytics</span>
                </button>

                {/* Work Logs & Deadlines */}
                <button
                  type="button"
                  onClick={() => handleNavClick("logs", "dev-section-logs")}
                  className={`devnav-btn w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    activeTab === "logs"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 font-medium hover:bg-slate-50"
                  }`}
                >
                  <i className="fa-solid fa-clock-rotate-left w-5 text-center text-xs text-teal-600"></i>
                  <span className="truncate">Work Logs & Deadlines</span>
                </button>
              </div>
            </div>

            {/* My Squad with exact mockup spacing */}
            <div className="mt-6">
              <div className="px-2 pb-2.5 text-[11px] font-semibold text-slate-400 tracking-[0.07em] uppercase">
                My Squad
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {squadName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate leading-tight">
                    {squadSubtitle}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-100">
        {/* Developer footer: personal weekly load */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">My Weekly Load</span>
            <span className="text-slate-700 font-mono font-bold">
              {totalLoad.toFixed(1)} / {weeklyCapacity.toFixed(1)}h
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, utilizationPct)}%`,
                background: isOver
                  ? "linear-gradient(90deg, #3A6FB0, #AE452F)"
                  : "linear-gradient(90deg, #3A6FB0, #3F8258)",
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{utilizationPct}% utilised</span>
            {isOver ? (
              <span className="font-semibold text-rose-600">+{diffHours}h over</span>
            ) : (
              <span className="font-semibold text-emerald-600">{diffHours}h free</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
