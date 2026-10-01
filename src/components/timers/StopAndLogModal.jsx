'use client';

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTimer } from "@/context/TimerContext";
import useIsMounted from "@/hooks/useClientMounted";

export default function StopAndLogModal({ isOpen, onClose, onSaved }) {
  const { activeTimer, secondsElapsed, formattedTime, stopAndLog, discardTimer } = useTimer();
  const isMounted = useIsMounted();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !activeTimer || !isMounted) return null;

  const hoursCalculated = Math.max(0.01, Number((secondsElapsed / 3600).toFixed(2)));

  const handleSave = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await stopAndLog(notes || `Stopwatch session on task: ${activeTimer.task_title || "Sprint Task"}`);
      setNotes("");
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Failed to save work log:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await discardTimer();
      setNotes("");
      onSaved?.();
      onClose();
    } catch (err) {
      console.error("Failed to discard timer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const modalElement = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm">
              <i className="fa-solid fa-circle-stop"></i>
            </div>
            <h3 className="font-bold text-base text-slate-900">
              Stop Timer & Save Work Log
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Active Task & Duration Stats */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              TASK: <strong className="text-slate-900">{activeTimer.task_title || "Active Sprint Task"}</strong>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/80">
              <span className="text-xs text-slate-500 font-mono">Elapsed Time:</span>
              <div className="text-right">
                <span className="text-xl font-mono font-extrabold text-slate-900">{formattedTime}</span>
                <span className="text-xs text-blue-600 font-mono font-bold block">
                  ~{hoursCalculated}h recorded
                </span>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
              Work Notes & Deliverables
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all placeholder-slate-400"
              placeholder="Describe what was accomplished in this session..."
            ></textarea>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={submitting}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
              title="Discard timer without logging hours"
            >
              Discard
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check text-xs"></i>
                    <span>Save to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
