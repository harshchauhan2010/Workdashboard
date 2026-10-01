'use client';

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import api from "@/lib/api-client";

const SQUAD_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-teal-500",
];

export default function ManagerSidebar({
  activeTab = "capacity",
  onTabChange,
  onSearchClick,
}) {
  const { currentPeriod } = useApp();

  const [squads, setSquads] = useState([]);
  const [capacityData, setCapacityData] = useState([]);
  const [unresolvedBlockersCount, setUnresolvedBlockersCount] = useState(null);
  const [templatesCount, setTemplatesCount] = useState(null);
  const [engineersCount, setEngineersCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all manager metrics live from PostgreSQL backend
  useEffect(() => {
    let isMounted = true;

    async function fetchManagerMetrics() {
      try {
        const [squadsRes, capRes, blockersRes, templatesRes, usersRes] = await Promise.allSettled([
          api.get("/api/squads"),
          api.get("/api/capacity/developers"),
          api.get("/api/blockers"),
          api.get("/api/task-templates"),
          api.get("/api/users"),
        ]);

        if (!isMounted) return;

        // 1. Squads list
        if (squadsRes.status === "fulfilled" && squadsRes.value?.data) {
          const raw = squadsRes.value.data?.data || squadsRes.value.data?.squads || squadsRes.value.data;
          if (Array.isArray(raw)) {
            setSquads(raw);
          }
        }

        // 2. Capacity Heatmap developers
        if (capRes.status === "fulfilled" && capRes.value?.data) {
          const raw = capRes.value.data?.data || capRes.value.data;
          if (Array.isArray(raw)) {
            setCapacityData(raw);
          }
        }

        // 3. Unresolved Blockers
        if (blockersRes.status === "fulfilled" && blockersRes.value?.data) {
          const raw = blockersRes.value.data?.data || blockersRes.value.data?.blockers || blockersRes.value.data;
          if (Array.isArray(raw)) {
            const unresolved = raw.filter((b) => b.is_resolved === false || !b.resolved_at);
            setUnresolvedBlockersCount(unresolved.length);
          }
        }

        // 4. Task Templates
        if (templatesRes.status === "fulfilled" && templatesRes.value?.data) {
          const raw = templatesRes.value.data?.data || templatesRes.value.data?.templates || templatesRes.value.data;
          if (Array.isArray(raw)) {
            setTemplatesCount(raw.length);
          }
        }

        // 5. Total Engineers / Users
        if (usersRes.status === "fulfilled" && usersRes.value?.data) {
          const raw = usersRes.value.data?.data || usersRes.value.data?.users || usersRes.value.data;
          if (Array.isArray(raw)) {
            setEngineersCount(raw.length);
          }
        }
      } catch (err) {
        console.warn("Could not synchronize manager sidebar metrics:", err?.message || err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchManagerMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live org capacity metrics from PostgreSQL
  const totalCapacity = useMemo(() => {
    if (!capacityData.length) return 0;
    return capacityData.reduce((acc, dev) => acc + (Number(dev.weekly_capacity_hours) || 40), 0);
  }, [capacityData]);

  const totalLoad = useMemo(() => {
    if (!capacityData.length) return 0;
    return capacityData.reduce((acc, dev) => acc + (Number(dev.total_load_hours) || 0), 0);
  }, [capacityData]);

  const utilizationPct = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;
  const freeHours = Math.max(0, Math.round(totalCapacity - totalLoad));

  // Dynamic navigation items based 100% on live database state
  const navItems = [
    {
      id: "capacity",
      label: "Capacity Heatmap",
      icon: "fa-solid fa-users-viewfinder",
      iconColor: "text-blue-500",
      badge: isLoading ? "..." : `${utilizationPct}%`,
      badgeColor:
        utilizationPct > 100
          ? "bg-rose-50 text-rose-700 font-bold"
          : utilizationPct > 80
          ? "bg-amber-50 text-amber-700 font-bold"
          : "bg-blue-100 text-blue-700",
    },
    {
      id: "squads",
      label: "Teams / Squads Hub",
      icon: "fa-solid fa-people-group",
      iconColor: "text-indigo-500",
      badge: isLoading ? "..." : String(squads.length),
      badgeColor: "bg-indigo-50 text-indigo-700",
    },
    {
      id: "engineer_360",
      label: "Engineer 360° View",
      icon: "fa-solid fa-id-badge",
      iconColor: "text-cyan-600",
      badge: isLoading ? "..." : String(engineersCount ?? capacityData.length ?? 0),
      badgeColor: "bg-slate-100 text-slate-700 font-mono",
    },
    {
      id: "schedule",
      label: "Date & Schedule Search",
      icon: "fa-solid fa-calendar-day",
      iconColor: "text-teal-600",
      badge: currentPeriod?.name ? "Active" : "Sprint",
      badgeColor: "bg-teal-50 text-teal-700",
    },
    {
      id: "projects",
      label: "Project Teams Hub",
      icon: "fa-solid fa-diagram-project",
      iconColor: "text-indigo-500",
      badge: isLoading ? "..." : `${squads.length} ${squads.length === 1 ? "Team" : "Teams"}`,
      badgeColor: "bg-indigo-50 text-indigo-700",
    },
    {
      id: "blockers",
      label: "Task Blockers & Risks",
      icon: "fa-solid fa-triangle-exclamation",
      iconColor: "text-amber-500",
      badge: isLoading ? "..." : String(unresolvedBlockersCount ?? 0),
      badgeColor:
        (unresolvedBlockersCount || 0) > 0
          ? "bg-amber-100 text-amber-800 font-bold"
          : "bg-slate-100 text-slate-500",
    },
    {
      id: "templates",
      label: "Task Templates",
      icon: "fa-solid fa-layer-group",
      iconColor: "text-indigo-500",
      badge: isLoading ? "..." : String(templatesCount ?? 0),
      badgeColor: "bg-indigo-50 text-indigo-700",
    },
  ];

  return (
    <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 select-none z-10 h-full overflow-hidden">
      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-4 space-y-5">
        {/* Search Option matching mockup UI */}
        <div className="pb-1">
          <button
            type="button"
            onClick={onSearchClick}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer group shadow-2xs"
            title="Quick Search (⌘K)"
          >
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-magnifying-glass text-xs text-slate-400 group-hover:text-slate-600 transition-colors"></i>
              <span className="text-slate-400 group-hover:text-slate-700 transition-colors">Search...</span>
            </span>
            <kbd className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Operations Navigation */}
        <div>
          <div className="px-2 pb-2 text-[10.5px] font-semibold text-slate-400 tracking-[0.06em] uppercase">
            Operations
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 font-medium hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <i
                      className={`${item.icon} w-4 text-center text-xs ${item.iconColor || "text-slate-400"}`}
                    ></i>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-bold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Squad Pods Section - 100% Dynamic from Database */}
        <div>
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-[10.5px] font-semibold text-slate-400 tracking-[0.06em] uppercase">
              Squad Pods {squads.length > 0 && `(${squads.length})`}
            </span>
            <button
              type="button"
              onClick={() => {
                if (activeTab !== "squads") onTabChange?.("squads");
                window.dispatchEvent(new CustomEvent("workdash:create-squad"));
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
              title="Create new squad pod"
            >
              + New
            </button>
          </div>
          <div className="space-y-0.5">
            {isLoading ? (
              <div className="px-3 py-2 space-y-2">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-slate-50 rounded animate-pulse w-1/2"></div>
              </div>
            ) : squads.length > 0 ? (
              squads.map((squad, idx) => {
                const color = SQUAD_COLORS[idx % SQUAD_COLORS.length];
                const cleanName = squad.name.replace(/\s*\(.*\)/, '').trim();

                // Compute dynamic live squad utilization from PostgreSQL capacity data
                const squadDevs = capacityData.filter(
                  (d) =>
                    d.squad_id === squad.id ||
                    (d.squad_name &&
                      (d.squad_name.toLowerCase().includes(cleanName.toLowerCase()) ||
                        cleanName.toLowerCase().includes(d.squad_name.toLowerCase())))
                );
                const squadCap = squadDevs.reduce(
                  (acc, d) => acc + (Number(d.weekly_capacity_hours) || 40),
                  0
                );
                const squadLoad = squadDevs.reduce(
                  (acc, d) => acc + (Number(d.total_load_hours) || 0),
                  0
                );

                let utilPct = 0;
                if (squadCap > 0) {
                  utilPct = Math.round((squadLoad / squadCap) * 100);
                } else if (Number(squad.budget_hours) > 0) {
                  utilPct = Math.round(
                    (Number(squad.spent_hours || 0) / Number(squad.budget_hours)) * 100
                  );
                }

                return (
                  <button
                    key={squad.id}
                    onClick={() => {
                      if (activeTab !== "capacity") onTabChange?.("capacity");
                      window.dispatchEvent(
                        new CustomEvent("workdash:filter-squad", {
                          detail: { squadId: squad.id },
                        })
                      );
                    }}
                    type="button"
                    title={`${squad.name} · ${utilPct}% utilized (${squadDevs.length} members)`}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className={`h-2 w-2 rounded-full ${color} flex-shrink-0`}></span>
                      <span className="truncate font-medium text-xs text-slate-700 group-hover:text-blue-700 transition-colors">
                        {cleanName}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono font-medium ${
                        utilPct >= 95
                          ? "text-rose-600 font-bold"
                          : utilPct >= 80
                          ? "text-amber-600 font-bold"
                          : "text-slate-400"
                      } flex-shrink-0`}
                    >
                      {utilPct}%
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 rounded-lg border border-dashed border-slate-200 text-center">
                <p className="text-[11px] text-slate-400">No active squads</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manager Footer: Org-Wide Capacity - 100% Dynamic from Database */}
      <div className="p-3.5 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Org Capacity</span>
            <span className="text-slate-700 font-mono font-bold text-xs">
              {isLoading ? (
                <span className="text-slate-400 font-normal">Loading...</span>
              ) : (
                `${Math.round(totalLoad)} / ${Math.round(totalCapacity)}h`
              )}
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilizationPct > 100
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : utilizationPct > 80
                  ? "bg-gradient-to-r from-blue-500 to-amber-500"
                  : "bg-gradient-to-r from-blue-500 to-emerald-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, utilizationPct))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10.5px] font-mono text-slate-400">
            <span>{isLoading ? "--" : `${utilizationPct}% utilised`}</span>
            <span
              className={
                freeHours === 0 && totalLoad > totalCapacity
                  ? "text-rose-600 font-semibold"
                  : "text-emerald-600 font-semibold"
              }
            >
              {isLoading
                ? "--"
                : freeHours === 0 && totalLoad > totalCapacity
                ? `${Math.round(totalLoad - totalCapacity)}h over`
                : `${freeHours}h free`}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
