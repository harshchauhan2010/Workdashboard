'use client';

import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";

export default function TaskLogsModal({
  task,
  mode = "view", // 'view' | 'log'
  isOpen,
  onClose,
  onLogSaved,
}) {
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState(mode || "view");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [hoursSpent, setHoursSpent] = useState("1.0");
  const [notes, setNotes] = useState("");
  const [workDate, setWorkDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // Load task logs
  useEffect(() => {
    if (!isOpen || !task?.id) return;

    let isMounted = true;
    async function fetchLogs() {
      setLoading(true);
      try {
        const res = await api.get(`/api/tasks/${task.id}/work-logs`);
        if (isMounted) {
          const list = Array.isArray(res.data?.data) ? res.data.data : [];
          setLogs(list);
        }
      } catch (err) {
        console.error("Error loading task logs:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    const numHours = parseFloat(hoursSpent);
    if (isNaN(numHours) || numHours <= 0) {
      showError("Please enter a valid number of hours");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/work-logs`, {
        hours_spent: numHours,
        notes: notes || "Work log entry",
        work_date: workDate || new Date().toISOString().split("T")[0],
      });

      showSuccess(`✅ Logged ${numHours}h to "${task.title}"`);
      setNotes("");
      onLogSaved?.();
      onClose();
    } catch (err) {
      showError(err.message || "Failed to log work hours");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#E7E2DA] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#F0EEEA] flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#F2EFFB] text-[#574092] font-mono font-bold text-xs border border-[#C9BDEB]">
                {task.squad_name || "SQUAD F"}
              </span>
              <span className="text-xs font-mono text-[#7B7265]">
                {Number(task.estimated_hours || 0).toFixed(1)}h estimated
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-[#201C17] line-clamp-2">
              {task.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#F7F6F5] hover:bg-[#F0EEEA] text-[#7B7265] hover:text-[#201C17] flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-[#F0EEEA] bg-[#F7F6F5]/50">
          <button
            onClick={() => setActiveTab("view")}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "view"
                ? "border-[#285691] text-[#285691]"
                : "border-transparent text-[#7B7265] hover:text-[#201C17]"
            }`}
          >
            <i className="fa-solid fa-clock-rotate-left text-[11px]"></i>
            <span>Logged History ({logs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "log"
                ? "border-[#285691] text-[#285691]"
                : "border-transparent text-[#7B7265] hover:text-[#201C17]"
            }`}
          >
            <i className="fa-solid fa-plus text-[11px]"></i>
            <span>+ Log Work Hours</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "view" ? (
            <div className="space-y-3">
              {loading ? (
                <div className="py-8 text-center text-xs font-mono text-[#7B7265] animate-pulse">
                  Loading work history...
                </div>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-[#F7F6F5] border border-[#E7E2DA] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#285691] bg-[#EEF3FB] px-2 py-0.5 rounded border border-[#B6CFEC]">
                        {Number(log.hours_spent || 0).toFixed(1)}h
                      </span>
                      <span className="text-[11px] font-mono text-[#7B7265]">
                        {new Date(log.work_date || log.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-[#4A4239] leading-relaxed">{log.notes}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs font-mono text-[#7B7265] bg-[#F7F6F5]/60 rounded-2xl border border-dashed border-[#E7E2DA] space-y-2">
                  <i className="fa-regular fa-clock text-xl text-[#C0B7AB]"></i>
                  <p>No hours logged on this task yet.</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A4239] mb-1.5 uppercase font-mono tracking-wider">
                  Hours Spent (e.g. 1.5)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="40"
                  required
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(e.target.value)}
                  className="w-full bg-[#F7F6F5] border border-[#E7E2DA] rounded-xl px-3.5 py-2 text-sm text-[#201C17] font-mono outline-none focus:border-[#285691] focus:ring-2 focus:ring-[#285691]/20 transition-all"
                  placeholder="1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4239] mb-1.5 uppercase font-mono tracking-wider">
                  Work Date
                </label>
                <input
                  type="date"
                  required
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full bg-[#F7F6F5] border border-[#E7E2DA] rounded-xl px-3.5 py-2 text-xs text-[#201C17] font-mono outline-none focus:border-[#285691] focus:ring-2 focus:ring-[#285691]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A4239] mb-1.5 uppercase font-mono tracking-wider">
                  Work Notes & Deliverables
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#F7F6F5] border border-[#E7E2DA] rounded-xl p-3 text-xs text-[#201C17] outline-none focus:border-[#285691] focus:ring-2 focus:ring-[#285691]/20 transition-all placeholder-[#A49A8B]"
                  placeholder="Describe the tasks completed, PRs submitted, or debugging progress..."
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7B7265] hover:bg-[#F0EEEA] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#285691] hover:bg-[#1F4373] text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check text-xs"></i>
                      <span>Save Work Log</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
