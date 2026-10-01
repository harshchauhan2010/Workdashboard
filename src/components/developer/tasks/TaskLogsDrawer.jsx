'use client';

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "@/lib/api-client";
import { useApp } from "@/context/AppContext";
import useIsMounted from "@/hooks/useClientMounted";

export default function TaskLogsDrawer({
  task,
  isOpen,
  onClose,
  onOpenLogModal,
}) {
  const { currentUser } = useApp();
  const isMounted = useIsMounted();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const devName = currentUser?.full_name || "Developer";

  // Load task work logs from database when drawer opens
  useEffect(() => {
    if (!isOpen || !task?.id) return;

    let isMountedFlag = true;
    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await api.get(`/api/tasks/${task.id}/work-logs`);
        if (isMountedFlag) {
          const list = Array.isArray(res.data?.data) ? res.data.data : [];
          setLogs(list);
        }
      } catch (err) {
        console.error("Error loading task logs:", err);
      } finally {
        if (isMountedFlag) setLoading(false);
      }
    }

    fetchLogs();
    return () => {
      isMountedFlag = false;
    };
  }, [isOpen, task?.id]);

  if (!isOpen || !task || !isMounted) return null;

  const estimatedHours = Number(task.estimated_hours || 0);
  const loggedHoursSum = logs.length > 0
    ? logs.reduce((sum, l) => sum + (Number(l.hours) || Number(l.hours_spent) || 0), 0)
    : Number(task.logged_hours || 0);

  const remainingHours = Math.max(0, estimatedHours - loggedHoursSum);
  const isDone = task.status === "COMPLETED";

  const squadCode = task.squad_badge_code || (task.squad_name ? task.squad_name.replace(/\s\(.*\)/, "").toUpperCase() : "ALPHA");

  // Formatted Due Date
  const formatDueDate = (dateStr) => {
    if (!dateStr) return "Sep 1, 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Format log timestamp
  const formatLogTimestamp = (timestamp) => {
    if (!timestamp) return "Today";
    try {
      const d = new Date(timestamp);
      const now = new Date();
      const isToday = now.toDateString() === d.toDateString();
      const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      return isToday ? `Today, ${timeStr}` : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
    } catch {
      return "Today";
    }
  };

  const drawerElement = (
    <div
      id="drawer-task-logs"
      className="fixed inset-0 z-[9999] overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-log-drawer-title"
    >
      {/* Subtle Transparent Overlay across entire viewport */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/15 transition-opacity"
      ></div>

      {/* Off-canvas panel pinned to extreme right of browser window */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-[430px] sm:w-[430px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-screen animate-drawer">
          
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-white flex items-start justify-between gap-3 flex-shrink-0">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0 border border-indigo-100/80">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700">
                    {squadCode}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {task.task_type === "AD_HOC_EMERGENCY" || task.task_type === "ADHOC"
                      ? "Ad-Hoc"
                      : task.task_type === "RECURRING_ROUTINE" || task.task_type === "RECURRING"
                      ? "Recurring"
                      : "Pre-Planning"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      isDone
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isDone ? (
                      <>
                        <i className="fa-solid fa-circle-check text-emerald-600 mr-1 text-[9px]"></i>Completed
                      </>
                    ) : (
                      <>
                        <i className="fa-regular fa-circle-dot text-amber-600 mr-1 text-[9px]"></i>In Progress
                      </>
                    )}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug truncate" id="task-log-drawer-title" title={task.title}>
                  {task.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate" id="task-log-drawer-assignee">
                  Assigned to: {devName} · Due: {formatDueDate(task.due_date)}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Close drawer"
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          {/* Drawer KPI / Quick Stats Strip (3 compact cards) */}
          <div className="px-5 py-3 bg-white border-b border-slate-100 grid grid-cols-3 gap-2 text-xs font-mono flex-shrink-0">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">ESTIMATED</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block" id="task-log-drawer-est">{estimatedHours.toFixed(0)}h</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80">
              <span className="text-indigo-600 block text-[10px] uppercase font-bold tracking-wider">LOGGED</span>
              <span className="font-bold text-indigo-700 text-sm mt-0.5 block" id="task-log-drawer-logged">{loggedHoursSum.toFixed(0)}h</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
              <span className="text-emerald-600 block text-[10px] uppercase font-bold tracking-wider">REMAINING</span>
              <span className="font-bold text-emerald-700 text-sm mt-0.5 block" id="task-log-drawer-remaining">{remainingHours.toFixed(0)}h</span>
            </div>
          </div>

          {/* Drawer Body: Scrollable Activity Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3" id="task-log-drawer-body">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-0.5">
              <span>Activity Stream ({logs.length} {logs.length === 1 ? "entry" : "entries"})</span>
              <span className="text-indigo-600 font-semibold">{loggedHoursSum.toFixed(0)}h total logged</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs font-mono text-slate-400 animate-pulse">
                Loading work history...
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-2.5">
                {logs.map((l) => {
                  const itemHours = Number(l.hours || l.hours_spent || 0);
                  return (
                    <div
                      key={l.id}
                      className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono flex-shrink-0">
                            {itemHours.toFixed(0)}h
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block leading-tight">
                              {l.full_name || l.developer_name || devName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatLogTimestamp(l.log_timestamp || l.work_date || l.created_at)}
                            </span>
                          </div>
                        </div>

                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200 uppercase">
                          {squadCode}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-normal leading-relaxed pl-0.5">
                        {l.notes || "Routine task execution and verification."}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-5 space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-sm">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <h4 className="text-xs font-bold text-slate-800">No Log Entries Yet</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  No work entries recorded for this task yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogModal?.(task);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                  <span>Log First Entry</span>
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer: Clean & Compact */}
          <div className="p-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              Close
            </button>
            <button
              type="button"
              id="task-log-drawer-add-btn"
              onClick={() => {
                onClose();
                onOpenLogModal?.(task);
              }}
              className="px-4 py-2 rounded-lg bg-[#1E4E8C] hover:bg-[#163B6C] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              <span>Log Additional Hours</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(drawerElement, document.body);
}
