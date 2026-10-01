'use client';

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/context/AppContext";
import { useTimer } from "@/context/TimerContext";
import api from "@/lib/api-client";
import useIsMounted from "@/hooks/useClientMounted";

const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-purple-500 to-violet-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-purple-600",
  "from-teal-500 to-emerald-600",
];

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

function getInitials(name) {
  if (!name) return "DEV";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default function CommandPaletteModal({ isOpen, onClose, onNavigate }) {
  const isMounted = useIsMounted();
  const { currentUser, isManager } = useApp();
  const { startTimer, isRunning, activeTimer } = useTimer();

  const [query, setQuery] = useState("");
  const [developers, setDevelopers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fetch live developers, squads, and tasks from database
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    async function loadData() {
      setLoading(true);
      try {
        const taskEndpoint = !isManager && currentUser?.id
          ? `/api/tasks?assigned_user_id=${currentUser.id}`
          : "/api/tasks";

        const [devsRes, squadsRes, tasksRes] = await Promise.allSettled([
          api.get("/api/capacity/developers"),
          api.get("/api/squads"),
          api.get(taskEndpoint),
        ]);

        if (!isSubscribed) return;

        // 1. Developers from database
        if (devsRes.status === "fulfilled" && devsRes.value?.data) {
          const devList = devsRes.value.data?.data || devsRes.value.data;
          if (Array.isArray(devList)) {
            setDevelopers(devList);
          }
        }

        // 2. Squads from database
        if (squadsRes.status === "fulfilled" && squadsRes.value?.data) {
          const squadList = squadsRes.value.data?.data || squadsRes.value.data?.squads || squadsRes.value.data;
          if (Array.isArray(squadList)) {
            setSquads(squadList);
          }
        }

        // 3. Tasks from database
        if (tasksRes.status === "fulfilled" && tasksRes.value?.data) {
          const raw = tasksRes.value.data;
          let taskList = Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.tasks)
            ? raw.tasks
            : Array.isArray(raw)
            ? raw
            : [];

          if (!isManager && currentUser?.id) {
            taskList = taskList.filter((t) => {
              const directMatch = t.assigned_user_id === currentUser.id;
              const assignmentMatch =
                Array.isArray(t.assignments) &&
                t.assignments.some((a) => a.user_id === currentUser.id);
              return directMatch || assignmentMatch || !t.assigned_user_id;
            });
          }

          setTasks(taskList);
        }
      } catch (err) {
        console.error("Failed to load command palette data:", err);
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    loadData();
    return () => {
      isSubscribed = false;
    };
  }, [isOpen, isManager, currentUser?.id]);

  const handleCloseModal = () => {
    setQuery("");
    onClose?.();
  };

  // Keyboard navigation shortcuts
  const navigationItems = useMemo(() => {
    if (isManager) {
      return [
        { id: "capacity", label: "Capacity Heatmap", icon: "fa-solid fa-users-viewfinder", color: "text-blue-500", category: "Operations" },
        { id: "squads", label: "Teams & Squads Hub", icon: "fa-solid fa-people-group", color: "text-indigo-500", category: "Operations" },
        { id: "engineer_360", label: "Engineer 360° Management", icon: "fa-solid fa-id-badge", color: "text-cyan-600", category: "Operations" },
        { id: "schedule", label: "Date & Schedule Dispatcher", icon: "fa-solid fa-calendar-day", color: "text-teal-600", category: "Operations" },
        { id: "projects", label: "Project Teams Hub", icon: "fa-solid fa-diagram-project", color: "text-indigo-500", category: "Operations" },
        { id: "blockers", label: "Blocker & Risk Intelligence", icon: "fa-solid fa-triangle-exclamation", color: "text-amber-500", category: "Operations" },
        { id: "templates", label: "Task Templates Engine", icon: "fa-solid fa-layer-group", color: "text-indigo-500", category: "Operations" },
      ];
    }
    return [
      { id: "overview", label: "My Overview Deck", sectionId: "dev-section-overview", icon: "fa-solid fa-gauge-high", color: "text-blue-500", category: "Navigation" },
      { id: "tasks", label: "My Assigned Tasks Board", sectionId: "dev-section-tasks", icon: "fa-solid fa-list-check", color: "text-indigo-500", category: "Navigation" },
      { id: "analytics", label: "My Sprint Analytics & Charts", sectionId: "dev-section-analytics", icon: "fa-solid fa-chart-pie", color: "text-purple-500", category: "Navigation" },
      { id: "logs", label: "My Work Logs & Deadlines", sectionId: "dev-section-logs", icon: "fa-solid fa-clock-rotate-left", color: "text-teal-600", category: "Navigation" },
    ];
  }, [isManager]);

  // Filter items based on query
  const q = query.toLowerCase().trim();

  const filteredDevelopers = useMemo(() => {
    if (!developers.length) return [];
    if (!q) return developers.slice(0, 5);
    return developers
      .filter((dev) => {
        const name = (dev.developer_name || "").toLowerCase();
        const role = (dev.role_title || "").toLowerCase();
        const squad = (dev.squad_name || "").toLowerCase();
        const seniority = (dev.seniority || "").toLowerCase();
        const skills = Array.isArray(dev.skills)
          ? dev.skills.join(" ").toLowerCase()
          : String(dev.skills || "").toLowerCase();
        return (
          name.includes(q) ||
          role.includes(q) ||
          squad.includes(q) ||
          seniority.includes(q) ||
          skills.includes(q)
        );
      })
      .slice(0, 6);
  }, [developers, q]);

  const filteredSquads = useMemo(() => {
    if (!squads.length) return [];
    if (!q) return squads.slice(0, 4);
    return squads
      .filter((sq) => {
        const name = (sq.name || "").toLowerCase();
        const focus = (sq.focus_domain || "").toLowerCase();
        const badge = (sq.badge_code || "").toLowerCase();
        const lead = (sq.lead_name || "").toLowerCase();
        return (
          name.includes(q) ||
          focus.includes(q) ||
          badge.includes(q) ||
          lead.includes(q)
        );
      })
      .slice(0, 5);
  }, [squads, q]);

  const filteredNav = useMemo(() => {
    if (!q) return navigationItems.slice(0, 4);
    return navigationItems.filter((item) =>
      item.label.toLowerCase().includes(q)
    );
  }, [navigationItems, q]);

  const filteredTasks = useMemo(() => {
    if (!tasks.length) return [];
    if (!q) return tasks.slice(0, 4);
    return tasks
      .filter((t) => {
        const title = (t.title || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const status = (t.status || "").toLowerCase();
        const type = (t.task_type || "").toLowerCase();
        return (
          title.includes(q) ||
          desc.includes(q) ||
          status.includes(q) ||
          type.includes(q)
        );
      })
      .slice(0, 5);
  }, [tasks, q]);

  const hasAnyResults =
    filteredDevelopers.length > 0 ||
    filteredSquads.length > 0 ||
    filteredTasks.length > 0 ||
    filteredNav.length > 0;

  // Click handlers
  const handleSelectDev = (dev) => {
    handleCloseModal();
    onNavigate?.("capacity");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("workdash:inspect-dev", { detail: { developer: dev } })
      );
    }, 150);
  };

  const handleSelectSquad = (squad) => {
    handleCloseModal();
    onNavigate?.("squads");
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("workdash:filter-squad", { detail: { squadId: squad.id } })
      );
    }, 150);
  };

  const handleSelectNav = (item) => {
    handleCloseModal();
    onNavigate?.(item.id);
    if (item.sectionId) {
      setTimeout(() => {
        const el = document.getElementById(item.sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const handleSelectTask = () => {
    handleCloseModal();
    onNavigate?.("tasks");
    setTimeout(() => {
      const el = document.getElementById("dev-section-tasks");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleStartTaskTimer = (task) => {
    startTimer(task.id, task.title);
    handleCloseModal();
  };

  const handleCreateSquadAction = () => {
    handleCloseModal();
    onNavigate?.("capacity");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("workdash:create-squad"));
    }, 150);
  };

  const handleAssignTaskAction = () => {
    handleCloseModal();
    onNavigate?.("capacity");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("workdash:assign-task"));
    }, 150);
  };

  if (!isOpen || !isMounted) return null;

  const modalElement = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/40 backdrop-blur-xs p-4 sm:pt-20 animate-fade-in"
      onClick={handleCloseModal}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[82vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
          <i className="fa-solid fa-magnifying-glass text-slate-400 text-sm pl-1"></i>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search developers, squads, tasks, or operations..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
          />
          {loading && (
            <i className="fa-solid fa-spinner animate-spin text-xs text-blue-500"></i>
          )}

          <kbd className="text-[10.5px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-xs hidden sm:inline-block">
            ESC
          </kbd>

          <button
            onClick={handleCloseModal}
            type="button"
            className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
            title="Close search"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!hasAnyResults && !loading && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg mx-auto">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <div className="text-sm font-semibold text-slate-800">
                No results found for &ldquo;{query}&rdquo;
              </div>
              <div className="text-xs text-slate-400 max-w-xs mx-auto">
                Try searching by developer name, role title, squad pod name, or task topic.
              </div>
            </div>
          )}

          {/* 1. DEVELOPERS SEARCH RESULTS (100% live from DB) */}
          {filteredDevelopers.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-widest text-[#847B6C] font-bold flex items-center justify-between">
                <span>Developers & Engineers ({filteredDevelopers.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Live Capacity</span>
              </div>
              <div className="space-y-1">
                {filteredDevelopers.map((dev, idx) => {
                  const cap = Number(dev.weekly_capacity_hours) || 40.0;
                  const total = Number(dev.total_load_hours) || 0.0;
                  const isOver = dev.is_overallocated || total > cap;
                  const overage = Math.max(0, total - cap);
                  const avail = Math.max(0, cap - total);
                  const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                  const initials = getInitials(dev.developer_name);

                  return (
                    <button
                      key={dev.id || dev.user_id || idx}
                      type="button"
                      onClick={() => handleSelectDev(dev)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0 shadow-2xs`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                              {dev.developer_name}
                            </span>
                            {dev.squad_name && (
                              <span className="text-[9.5px] font-semibold px-2 py-0.2 rounded-full border border-slate-200 bg-slate-50 text-slate-600 flex-shrink-0">
                                {dev.squad_name.replace(/\s*\(.*\)/, '').trim()}
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-400 truncate">
                            {dev.role_title || "Engineer"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isOver
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isOver ? `+${overage.toFixed(1)}h over` : `${avail.toFixed(1)}h free`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-300 group-hover:text-blue-600 transition-colors">
                          Inspect →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. SQUADS SEARCH RESULTS (100% live from DB) */}
          {filteredSquads.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-widest text-[#847B6C] font-bold flex items-center justify-between">
                <span>Squad Pods & Teams ({filteredSquads.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Database Squads</span>
              </div>
              <div className="space-y-1">
                {filteredSquads.map((squad, idx) => {
                  const color = SQUAD_COLORS[idx % SQUAD_COLORS.length];
                  const healthBadge =
                    squad.health === "CRITICAL"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : squad.health === "AT_RISK"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200";

                  return (
                    <button
                      key={squad.id || idx}
                      type="button"
                      onClick={() => handleSelectSquad(squad)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <span className={`w-2 h-2 rounded-full ${color}`}></span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                              {squad.name}
                            </span>
                            {squad.badge_code && (
                              <span className="text-[9.5px] font-mono text-slate-400">
                                [{squad.badge_code}]
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-400 truncate">
                            {squad.focus_domain || "Engineering Pod"} · {squad.lead_name ? `Lead: ${squad.lead_name}` : `${squad.member_count || 0} members`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded border ${healthBadge}`}
                        >
                          {squad.health || "HEALTHY"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-300 group-hover:text-indigo-600 transition-colors">
                          View →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. QUICK ACTIONS (Manager operations shortcuts) */}
          {isManager && (
            <div>
              <div className="px-3 pt-1 pb-1 text-[10.5px] font-mono uppercase tracking-widest text-[#847B6C] font-bold">
                Manager Actions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleCreateSquadAction}
                  className="text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 flex items-center gap-2 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-users-gear text-indigo-500 text-xs"></i>
                  <span>+ Create Squad Pod</span>
                </button>

                <button
                  type="button"
                  onClick={handleAssignTaskAction}
                  className="text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 flex items-center gap-2 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-blue-500 text-xs"></i>
                  <span>+ Create & Assign Task</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. SPRINT TASKS */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-widest text-[#847B6C] font-bold flex items-center justify-between">
                <span>Sprint Tasks ({filteredTasks.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Backlog</span>
              </div>
              <div className="space-y-1">
                {filteredTasks.map((task) => {
                  const isBlocked = task.is_blocked;
                  const isCurrentTimer =
                    activeTimer &&
                    (activeTimer.task_id === task.id || activeTimer.taskId === task.id);

                  return (
                    <div
                      key={task.id}
                      className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center justify-between gap-3 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectTask(task)}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {task.title}
                          </span>
                          {isBlocked && (
                            <span className="text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                              Blocked
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono uppercase text-slate-500 font-semibold">
                            {task.task_type || "TASK"}
                          </span>
                          <span>·</span>
                          <span>{task.status?.replace("_", " ")}</span>
                          <span>·</span>
                          <span className="font-mono font-bold text-slate-600">
                            {Number(task.estimated_hours || 0).toFixed(1)}h est
                          </span>
                        </div>
                      </button>

                      {!isManager && !isBlocked && task.status !== "COMPLETED" && (
                        <button
                          type="button"
                          onClick={() => handleStartTaskTimer(task)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                            isCurrentTimer && isRunning
                              ? "bg-slate-900 text-white shadow-xs"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                          title="Start stopwatch on this task"
                        >
                          <i
                            className={`fa-solid ${
                              isCurrentTimer && isRunning
                                ? "fa-circle-dot animate-pulse text-rose-400"
                                : "fa-play text-[10px]"
                            }`}
                          ></i>
                          <span>{isCurrentTimer && isRunning ? "Running" : "Timer"}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. NAVIGATION SHORTCUTS */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-widest text-[#847B6C] font-bold">
                {isManager ? "Operations Navigation" : "My Workspace Navigation"}
              </div>
              <div className="space-y-0.5">
                {filteredNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <i className={`${item.icon} w-4 text-center text-xs ${item.color}`}></i>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-600 transition-colors">
                      Jump →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="text-[11px] flex items-center gap-1.5">
            <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">↑↓</kbd>
            <span>navigate ·</span>
            <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">↵</kbd>
            <span>select</span>
          </span>
          <span className="text-[11px] text-slate-500 font-semibold">
            WorkDashboard Enterprise
          </span>
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
