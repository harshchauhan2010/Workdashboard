'use client';

import { useState } from "react";
import { createPortal } from "react-dom";
import api from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import { useApp } from "@/context/AppContext";
import useIsMounted from "@/hooks/useClientMounted";

export default function LogHoursModal({
  task,
  isOpen,
  onClose,
  onLogSaved,
}) {
  const { currentUser } = useApp();
  const { showSuccess, showError } = useToast();
  const isMounted = useIsMounted();

  const [hoursSpent, setHoursSpent] = useState("2.0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !task || !isMounted) return null;

  const devName = currentUser?.full_name || "Developer";

  const handleApplyPreset = (hrs) => {
    setHoursSpent(hrs.toFixed(1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numHours = parseFloat(hoursSpent);
    if (isNaN(numHours) || numHours <= 0) {
      showError("Please enter a valid number of hours");
      return;
    }

    if (!notes.trim()) {
      showError("Please provide a note of what was accomplished");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/tasks/${task.id}/work-logs`, {
        hours: numHours,
        notes: notes.trim(),
        log_timestamp: new Date().toISOString(),
      });

      showSuccess(`✓ Logged ${numHours}h to "${task.title}"`);
      onLogSaved?.();
      onClose();
    } catch (err) {
      console.error("Failed to log work hours:", err);
      showError(err.message || "Failed to save work log");
    } finally {
      setSubmitting(false);
    }
  };

  const modalElement = (
    <div
      id="modal-log-time"
      className="fixed inset-0 bg-slate-900/30 z-[9999] flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-semibold text-lg text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-clock text-blue-500"></i>
            <span>Log Hours</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Active Task Info Box */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase font-mono tracking-wider font-semibold">
                Active Task
              </span>
              <span className="text-[11px] font-semibold text-blue-600 font-mono" id="log-modal-dev-name">
                Engineer: {devName}
              </span>
            </div>
            <span className="font-bold text-slate-800 text-sm block" id="log-modal-task-title">
              {task.title}
            </span>
          </div>

          {/* Hours Input */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs font-mono uppercase tracking-wider flex items-center justify-between">
              <span>Hours Spent <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Presets</span>
            </label>
            <input
              id="log-hours-input"
              type="number"
              step="0.5"
              min="0.25"
              max="24"
              required
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-sm outline-none focus:border-blue-400 focus:bg-white transition-all text-slate-900"
            />
            {/* 1-Click Presets matching reference */}
            <div className="flex items-center gap-1.5 pt-2 flex-wrap">
              {[
                { label: "+30m", val: 0.5 },
                { label: "+1.0h", val: 1.0 },
                { label: "+2.0h", val: 2.0 },
                { label: "+4.0h", val: 4.0 },
                { label: "+8.0h (Full Day)", val: 8.0 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset.val)}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 border border-slate-200 text-slate-600 transition-all cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs font-mono uppercase tracking-wider">
              Notes & Accomplishment <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="log-notes-input"
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all text-slate-900"
              placeholder="Describe what was accomplished or unblocked..."
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Submit Log</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
