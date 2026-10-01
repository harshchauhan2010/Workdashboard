'use client';

import { useTimer } from "@/context/TimerContext";

export default function TaskCard({
  task,
  isExpanded = false,
  onToggleExpand,
  onLogTimeClick,
  onViewLogsClick,
  onDragStart,
  onDragEnd,
}) {
  const { startTimer, pauseTimer, resumeTimer, isRunning, activeTimer } = useTimer();

  const isTimerForThisTask = (activeTimer?.taskId === task.id || activeTimer?.task_id === task.id);
  const isCurrentTimerRunning = isTimerForThisTask && isRunning;
  const isCurrentTimerPaused = isTimerForThisTask && !isRunning;
  const isDone = task.status === "COMPLETED";
  const isPending = task.status === "PENDING_REVIEW";

  const estimatedHours = Number(task.estimated_hours || 0);
  const loggedHours = Number(task.logged_hours || 0);
  const pct = estimatedHours > 0 ? Math.min(100, Math.round((loggedHours / estimatedHours) * 100)) : (isDone ? 100 : 0);

  // Squad display badge
  const squadLabel = task.squad_name
    ? task.squad_name.replace(/\s\(.*\)/, "")
    : "SQUAD F";

  // Formatted Due Date
  const formatDueDate = (dateStr) => {
    if (!dateStr) return "No due date";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Priority Badge Helper
  const renderPriorityBadge = () => {
    if (task.priority === "P1_HIGH") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#FBEEEC] text-[#AE452F] border border-[#E9B2A8]">
          P1 Urgent
        </span>
      );
    }
    if (task.priority === "P2_MEDIUM") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#FBF3E7] text-[#97621C] border border-[#EBC988]">
          P2 Standard
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-[#F0EEEA] text-[#7B7265] border border-[#E7E2DA]">
        P3 Low
      </span>
    );
  };

  // Task Type Badge Helper
  const renderTypeBadge = () => {
    if (task.task_type === "PRE_PLANNING" || task.task_type === "PLANNED") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#EEF3FB] text-[#285691] border border-[#B6CFEC] flex items-center gap-1">
          <i className="fa-solid fa-crosshairs text-[9px]"></i>
          <span>Pre-Planning</span>
        </span>
      );
    }
    if (task.task_type === "AD_HOC_EMERGENCY" || task.task_type === "ADHOC") {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#FBF3E7] text-[#97621C] border border-[#EBC988] flex items-center gap-1">
          <i className="fa-solid fa-fire text-[9px]"></i>
          <span>Ad-Hoc</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#F2EFFB] text-[#574092] border border-[#C9BDEB] flex items-center gap-1">
        <i className="fa-solid fa-repeat text-[9px]"></i>
        <span>Recurring</span>
      </span>
    );
  };

  // Category Tag
  const categoryLabel = task.category === "DEVELOPMENT" ? "</> Dev" : task.category ? task.category.replace("_", " ") : "</> Dev";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
      onDragEnd={(e) => onDragEnd?.(e)}
      className={`bg-white rounded-2xl border transition-all select-none p-3.5 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing ${
        isPending
          ? "border-[#EBC988] ring-1 ring-[#FBF3E7]"
          : isDone
          ? "border-[#B3D7BE] bg-[#EEF6F0]/20"
          : "border-[#E7E2DA] hover:border-[#B6CFEC]"
      }`}
    >
      {/* ═══ Always Visible Top Header ═══ */}
      <div className="space-y-2.5">
        {/* Top Badges & Hours */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-[#F2EFFB] text-[#574092] text-[11px] font-mono font-bold uppercase border border-[#C9BDEB]">
              {squadLabel}
            </span>
            {task.is_blocked ? (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#FBEEEC] text-[#AE452F] border border-[#E9B2A8] flex items-center gap-1">
                <i className="fa-solid fa-ban text-[9px]"></i>
                <span>Blocked</span>
              </span>
            ) : (
              task.priority === "P1_HIGH" && renderPriorityBadge()
            )}
          </div>
          <span className="text-xs font-mono font-bold text-[#4A4239] flex-shrink-0 tabular-nums">
            {estimatedHours > 0 ? `${estimatedHours}h` : "–"}
          </span>
        </div>

        {/* Task Title */}
        <h5
          className="text-sm font-semibold text-[#201C17] leading-snug line-clamp-2"
          title={task.title}
        >
          {task.title}
        </h5>

        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#F0EEEA] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isDone ? "bg-[#326A47]" : "bg-[#285691]"
              }`}
              style={{ width: `${pct}%` }}
            ></div>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#7B7265] flex-shrink-0">
            {pct}%
          </span>
        </div>

        {/* Footer: Due Date + Eye Toggle Button */}
        <div className="flex items-center justify-between text-xs font-medium text-[#7B7265] pt-0.5">
          <span className="truncate flex items-center gap-1.5 text-[11px]">
            <i className="fa-regular fa-calendar text-[11px] text-[#A49A8B]"></i>
            <span>{formatDueDate(task.due_date)}</span>
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand?.(task.id);
            }}
            title={isExpanded ? "Hide details" : "Show more details"}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs transition-all flex-shrink-0 cursor-pointer border ${
              isExpanded
                ? "bg-[#EEF3FB] text-[#285691] border-[#B6CFEC] shadow-2xs"
                : "bg-[#F7F6F5] text-[#7B7265] border-[#E7E2DA] hover:text-[#201C17] hover:bg-[#F0EEEA]"
            }`}
          >
            <i className={isExpanded ? "fa-solid fa-eye-slash" : "fa-regular fa-eye"}></i>
          </button>
        </div>
      </div>

      {/* ═══ Hidden by Default: Revealed when Eye Icon is Clicked ═══ */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#F0EEEA] space-y-2.5 animate-fade-in">
          {/* Detailed Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.priority !== "P1_HIGH" && renderPriorityBadge()}
            {renderTypeBadge()}
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#F7F6F5] text-[#4A4239] border border-[#E7E2DA]">
              {categoryLabel}
            </span>
          </div>

          {/* Logged Hours Summary */}
          <div className="flex justify-between items-center text-xs font-mono text-[#7B7265]">
            <span>
              Logged: <strong className="text-[#201C17] font-semibold">{loggedHours}h</strong> / {estimatedHours}h
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewLogsClick?.(task);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#F2EFFB] hover:bg-[#E4DEF5] text-[#574092] font-bold transition-all flex items-center gap-1.5 text-xs border border-[#C9BDEB] cursor-pointer"
              title="View Work Logs"
            >
              <i className="fa-solid fa-clock-rotate-left text-[10px]"></i>
              <span>Logs ({task.logs_count || (loggedHours > 0 ? 1 : 0)})</span>
            </button>

            {!isDone ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogTimeClick?.(task);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#EEF3FB] hover:bg-[#DCE7F6] text-[#285691] border border-[#B6CFEC] font-bold transition-all flex items-center gap-1 text-xs cursor-pointer"
                title="Log Time to Task"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                <span>Log Time</span>
              </button>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-[#EEF6F0] text-[#326A47] border border-[#B3D7BE] flex items-center gap-1">
                <i className="fa-solid fa-check text-[9px]"></i> Done
              </span>
            )}

            {!isDone && (
              <button
                type="button"
                disabled={task.is_blocked}
                onClick={(e) => {
                  e.stopPropagation();
                  if (task.is_blocked) return;
                  if (isCurrentTimerRunning) {
                    pauseTimer();
                  } else if (isCurrentTimerPaused) {
                    resumeTimer();
                  } else {
                    startTimer(task.id, task.title);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs border ${
                  task.is_blocked
                    ? "bg-[#F7F6F5] text-[#A49A8B] border-[#E7E2DA] cursor-not-allowed opacity-60"
                    : isCurrentTimerRunning
                    ? "bg-[#1E1917] text-white border-black shadow-xs cursor-pointer"
                    : isCurrentTimerPaused
                    ? "bg-amber-100 text-amber-900 border-amber-300 cursor-pointer"
                    : "bg-[#FBF3E7] hover:bg-[#F5E4C4] text-[#97621C] border-[#EBC988] cursor-pointer"
                }`}
                title={
                  task.is_blocked
                    ? "Stopwatch disabled: Task has an active blocker"
                    : isCurrentTimerRunning
                    ? "Pause active timer"
                    : isCurrentTimerPaused
                    ? "Resume timer"
                    : "Start timer on this task"
                }
              >
                <i
                  className={`fa-solid ${
                    task.is_blocked
                      ? "fa-ban"
                      : isCurrentTimerRunning
                      ? "fa-pause"
                      : isCurrentTimerPaused
                      ? "fa-play"
                      : "fa-play"
                  } text-[10px]`}
                ></i>
                <span>
                  {task.is_blocked
                    ? "Blocked"
                    : isCurrentTimerRunning
                    ? "Pause"
                    : isCurrentTimerPaused
                    ? "Resume"
                    : "Timer"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
