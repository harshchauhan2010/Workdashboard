'use client';

import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { useApp } from "@/context/AppContext";

export default function WorkLogStreamCard({
  selectedTaskId = null,
  onClearSelectedTask,
  onOpenLogModal,
  onOpenTaskDetails,
  refreshTrigger = 0,
}) {
  const { currentUser } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchWorkLogs() {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (currentUser?.id) {
          queryParams.set("user_id", currentUser.id);
        }
        if (selectedTaskId) {
          queryParams.set("task_id", selectedTaskId);
        }
        queryParams.set("limit", "25");

        const endpoint = `/api/work-logs?${queryParams.toString()}`;
        const res = await api.get(endpoint);

        if (isMounted) {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          setLogs(list);
        }
      } catch (err) {
        console.error("Error loading work log stream:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchWorkLogs();

    return () => {
      isMounted = false;
    };
  }, [currentUser, selectedTaskId, refreshTrigger]);

  // Selected Task Context
  const selectedTaskLog = logs.find((l) => l.task_id === selectedTaskId);
  const selectedTaskTitle = selectedTaskLog?.task_title || "Selected Task";
  const selectedTaskTotalHours = logs
    .filter((l) => l.task_id === selectedTaskId)
    .reduce((sum, l) => sum + (Number(l.hours) || 0), 0);

  // Time formatter matching reference format
  const formatTime = (ts) => {
    if (!ts) return "Just now";
    try {
      const d = new Date(ts);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const timeStr = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      if (isToday) return `Today, ${timeStr}`;
      if (isYesterday) return `Yesterday, ${timeStr}`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-indigo-500"></i> Work Log Stream
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
            {logs.length} {logs.length === 1 ? "entry" : "entries"} {selectedTaskId ? "" : "(All Tasks)"}
          </span>
        </div>

        {selectedTaskId && onClearSelectedTask && (
          <button
            onClick={onClearSelectedTask}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            View All
          </button>
        )}
      </div>

      {/* Selected Task Context Pill */}
      {selectedTaskId && (
        <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"></span>
            <span className="text-xs text-blue-900 font-bold truncate">
              Logs for: <strong className="text-blue-950">{selectedTaskTitle}</strong> (
              {selectedTaskTotalHours.toFixed(1)}h logged)
            </span>
          </div>
          {onClearSelectedTask && (
            <button
              onClick={onClearSelectedTask}
              title="Show all task logs"
              className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-0.5 rounded hover:bg-blue-100 transition-all flex-shrink-0 cursor-pointer"
            >
              ✕ Reset
            </button>
          )}
        </div>
      )}

      {/* Log Stream List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {loading && logs.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400 font-mono">
            Loading work logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500 font-mono bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="text-slate-400">
              <i className="fa-regular fa-folder-open text-2xl mb-1"></i>
            </div>
            <div>No work logs recorded yet.</div>
            {selectedTaskId && onOpenLogModal && (
              <button
                onClick={() => onOpenLogModal({ id: selectedTaskId })}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                + Log Hours for this Task
              </button>
            )}
          </div>
        ) : (
          logs.map((log) => {
            const squadBadge = log.squad_badge_code || "ALPHA";
            const devName = log.full_name || currentUser?.full_name || "Chiranshi Thummar";

            return (
              <div
                key={log.id}
                onClick={() => onOpenTaskDetails && onOpenTaskDetails({ id: log.task_id, title: log.task_title })}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-2xs transition-all space-y-2.5 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-mono font-bold uppercase border border-blue-100 flex-shrink-0">
                      {squadBadge}
                    </span>
                    <span className="text-sm font-bold text-slate-800 truncate">
                      {log.task_title}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0 shadow-2xs">
                    +{Number(log.hours).toFixed(1)}h logged
                  </span>
                </div>

                {log.notes && (
                  <p className="text-xs text-slate-600 pl-3 border-l-2 border-indigo-400 font-sans italic leading-relaxed">
                    &quot;{log.notes}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                  <span>
                    <i className="fa-regular fa-clock text-[10px] mr-1 text-slate-400"></i>
                    {formatTime(log.log_timestamp)}
                  </span>
                  <span className="text-slate-500 font-medium">By {devName}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
