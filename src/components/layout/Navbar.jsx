'use client';

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const { currentUser, currentPeriod, allPeriods, setCurrentPeriod, isManager } = useApp();
  const { user: clerkUser } = useUser();
  const pathname = usePathname();

  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const devName = currentUser?.full_name || clerkUser?.fullName || clerkUser?.firstName || "Team Member";
  const userRoleTitle = currentUser?.role_title || (currentUser?.system_role === "MANAGER" ? "Engineering Manager" : "Software Engineer");

  // Dynamic View title based on active route and role
  const cleanPath = (pathname || "").replace(/^\/+/, "").toLowerCase();
  let viewTitle = "Overview";
  if (isManager) {
    if (cleanPath === "capacity" || !cleanPath || cleanPath === "overview") viewTitle = "Capacity Heatmap";
    else if (cleanPath === "squads" || cleanPath === "teams") viewTitle = "Teams & Squads Hub";
    else if (cleanPath === "engineer-360" || cleanPath === "engineer_360") viewTitle = "Engineer 360° View";
    else if (cleanPath === "schedule") viewTitle = "Date & Schedule Planning";
    else if (cleanPath === "projects") viewTitle = "Project Teams Hub";
    else if (cleanPath === "blockers") viewTitle = "Task Blockers & Risks";
    else if (cleanPath === "templates") viewTitle = "Task Templates";
    else viewTitle = "Capacity Heatmap";
  } else {
    if (cleanPath === "overview" || !cleanPath || cleanPath === "capacity") viewTitle = "Personal Capacity Hub";
    else if (cleanPath === "tasks") viewTitle = "My Tasks";
    else if (cleanPath === "analytics") viewTitle = "My Analytics";
    else if (cleanPath === "logs" || cleanPath === "work-logs") viewTitle = "Work Logs & Deadlines";
    else viewTitle = "Personal Capacity Hub";
  }

  // Period formatted dates strictly derived from database planning_periods
  const formatPeriodDates = (period) => {
    if (!period?.start_date || !period?.end_date) return "Sprint Cycle";
    const s = new Date(period.start_date);
    const e = new Date(period.end_date);
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  // Clean formatted period display name (removing ugly timestamps)
  const formatPeriodName = (period) => {
    if (!period) return "Sprint Cycle";
    const name = period.name || "";
    // If name contains trailing timestamp like "- 179058...", clean it up
    const cleanName = name.replace(/\s*-\s*\d{10,}$/, "").trim();
    return cleanName || `Sprint ${formatPeriodDates(period)}`;
  };

  const periodLabel = currentPeriod ? formatPeriodDates(currentPeriod) : "Sep 21 – Sep 27, 2026";
  const isCurrentActive = currentPeriod?.is_current;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsPeriodMenuOpen(false);
      }
    };
    if (isPeriodMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPeriodMenuOpen]);

  const handleSelectPeriod = (p) => {
    setCurrentPeriod(p);
    setIsPeriodMenuOpen(false);
  };

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-stretch justify-between z-20 select-none flex-shrink-0">
      {/* Left: Brand / Logo Container (Width w-[260px] with border-r perfectly aligned with Sidebar below) */}
      <div className="w-[260px] h-[72px] px-5 flex items-center gap-3 border-r border-slate-200 flex-shrink-0">
        <div className="h-9 w-9 rounded-xl bg-blue-700 flex items-center justify-center text-white text-base shadow-sm flex-shrink-0">
          <i className="fa-solid fa-layer-group text-sm"></i>
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-display font-bold tracking-tight text-slate-900 leading-tight truncate">
            WorkDashboard
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 leading-tight">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>Enterprise · v2.4</span>
          </div>
        </div>
      </div>

      {/* Center & Right: Breadcrumbs + Interactive Sprint Period Selector + User Profile */}
      <div className="flex-1 flex items-center justify-between px-6 min-w-0">
        {/* Breadcrumb & Sprint Badge */}
        <div className="flex items-center gap-3 text-xs min-w-0">
          <div className="flex items-center gap-2 text-slate-500 font-medium truncate">
            <span>Workspace</span>
            <i className="fa-solid fa-chevron-right text-[9px] text-slate-400"></i>
            <span className="font-semibold text-slate-900 truncate">{viewTitle}</span>
          </div>

          <div className="hidden sm:inline-flex h-5 w-px bg-slate-200 mx-1"></div>

          {/* Interactive Sprint Cycle Dropdown */}
          <div className="relative hidden sm:block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsPeriodMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-xl text-slate-700 font-medium shadow-2xs transition-all cursor-pointer group"
              title="Click to switch sprint period"
            >
              <i className="fa-regular fa-calendar text-xs text-slate-400 group-hover:text-blue-600 transition-colors"></i>
              <span className="font-mono text-xs">{periodLabel}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ml-1 ${
                  isCurrentActive
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {isCurrentActive ? "Current Week" : "Sprint Cycle"}
              </span>
              <i
                className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${
                  isPeriodMenuOpen ? "rotate-180 text-blue-600" : ""
                }`}
              ></i>
            </button>

            {/* Dropdown Menu */}
            {isPeriodMenuOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-scale-in">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Sprint Periods
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {allPeriods?.length || 0} periods
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
                  {allPeriods && allPeriods.length > 0 ? (
                    allPeriods.map((period) => {
                      const isSelected = currentPeriod?.id === period.id;
                      return (
                        <button
                          key={period.id}
                          type="button"
                          onClick={() => handleSelectPeriod(period)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 text-blue-800 font-semibold border border-blue-200/80"
                              : "text-slate-700 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-xs truncate">
                              {formatPeriodDates(period)}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {formatPeriodName(period)}
                            </div>
                          </div>

                          {period.is_current && (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded flex-shrink-0">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-slate-400">
                      No additional planning periods found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Logged-in User Profile Name, Role and Clerk UserButton */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 leading-tight capitalize">
              {devName}
            </div>
            <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
              {userRoleTitle}
            </div>
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 rounded-full ring-2 ring-slate-200 shadow-xs",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
