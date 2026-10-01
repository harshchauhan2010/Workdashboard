'use client';

import { useState } from "react";
import { useTimer } from "@/context/TimerContext";
import StopAndLogModal from "@/components/timers/StopAndLogModal";

export default function DevProfileCard({
  devName = "Developer",
  devRole = "Software Engineer",
  initials = "ME",
  squadName = "Squad Alpha",
  weeklyCapacity = 40,
  tasks = [],
  onRefreshData,
}) {
  const { activeTimer, isRunning, elapsedTime, startTimer, pauseTimer, resumeTimer, discardTimer } = useTimer();
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const timerDisplay = activeTimer ? formatTimer(elapsedTime) : "00:00:00";

  // Handle Quick Start when no timer is running
  const handleQuickStart = () => {
    const candidateTask =
      tasks.find((t) => !t.is_blocked && t.status === "IN_PROGRESS") ||
      tasks.find((t) => !t.is_blocked && t.status === "TO_DO") ||
      tasks.find((t) => !t.is_blocked && t.status !== "COMPLETED");

    if (candidateTask) {
      startTimer(candidateTask.id, candidateTask.title);
    } else {
      startTimer(null, "Active Sprint Work");
    }
  };

  const handleStopClick = () => {
    if (isRunning) {
      pauseTimer();
    }
    setIsStopModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
      {/* Left: Avatar & Logged In Developer Identity */}
      <div className="flex items-center gap-4">
        {/* Initial Avatar */}
        <div className="h-16 w-16 rounded-2xl bg-[#E06A26] text-white flex items-center justify-center font-display font-extrabold text-xl shadow-xs flex-shrink-0 tracking-wider">
          {initials}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-display font-bold text-slate-900 capitalize">{devName}</h1>
            <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg font-semibold">
              {squadName}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {devRole} · {Number(weeklyCapacity).toFixed(0)}h / week
          </p>
        </div>
      </div>

      {/* Right: Active Stopwatch Widget */}
      <div className="flex items-center gap-3.5 bg-slate-900 px-5 py-3 rounded-2xl text-white shadow-sm flex-shrink-0">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          {isRunning ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </>
          ) : (
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activeTimer ? "bg-amber-400" : "bg-slate-500"}`}></span>
          )}
        </span>

        <div>
          <div className="text-[11px] text-slate-400 uppercase tracking-widest font-mono font-semibold">
            {activeTimer ? (isRunning ? "Active Timer" : "Timer Paused") : "Active Timer"}
          </div>
          <div className="text-lg font-mono font-bold tracking-widest text-white mt-0.5">
            {timerDisplay}
          </div>
          {activeTimer?.task_title && (
            <div className="text-[10px] text-slate-400 max-w-[130px] truncate font-mono">
              {activeTimer.task_title}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTimer ? (
            <>
              {isRunning ? (
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Pause Stopwatch"
                >
                  <i className="fa-solid fa-pause text-xs"></i>
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Resume Stopwatch"
                >
                  <i className="fa-solid fa-play text-xs"></i>
                  <span>Resume</span>
                </button>
              )}

              {/* Stop & Log to Database */}
              <button
                type="button"
                onClick={handleStopClick}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Stop and save work log to database"
              >
                <i className="fa-solid fa-circle-stop text-xs"></i>
                <span>Stop</span>
              </button>

              {/* Discard */}
              {!isRunning && (
                <button
                  type="button"
                  onClick={discardTimer}
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs transition-all cursor-pointer"
                  title="Discard timer"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={handleQuickStart}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Start Stopwatch on Task"
            >
              <i className="fa-solid fa-play text-xs"></i>
              <span>Start</span>
            </button>
          )}
        </div>
      </div>

      {/* Stop & Log Modal */}
      <StopAndLogModal
        isOpen={isStopModalOpen}
        onClose={() => setIsStopModalOpen(false)}
        onSaved={onRefreshData}
      />
    </div>
  );
}
