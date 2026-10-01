'use client';

import { useState } from "react";
import TaskCard from "./TaskCard";

export default function KanbanColumn({
  title,
  statusKey,
  iconDot,
  colorTheme,
  tasks = [],
  expandedTaskIds,
  onToggleExpand,
  onLogTimeClick,
  onViewLogsClick,
  onDragStart,
  onDragEnd,
  onDropTask,
}) {
  const [isOver, setIsOver] = useState(false);

  const totalHours = tasks.reduce(
    (sum, t) => sum + (Number(t.estimated_hours) || Number(t.logged_hours) || 0),
    0
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    onDropTask?.(statusKey);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-2xl border ${colorTheme.border} ${
        isOver ? "bg-[#EEF3FB]/80 ring-2 ring-[#285691]" : colorTheme.bg
      } p-3.5 flex flex-col transition-all duration-200 shadow-2xs min-w-[260px] flex-1`}
    >
      {/* Column Fixed Header */}
      <div
        className={`flex items-center justify-between pb-2.5 mb-2.5 border-b ${colorTheme.divider} select-none flex-shrink-0`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {iconDot}
          <h4 className="text-xs font-bold text-[#201C17] uppercase tracking-wider font-mono truncate">
            {title}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${colorTheme.badge}`}>
            {tasks.length}
          </span>
          <span className="text-xs font-mono text-[#7B7265] font-semibold">
            {Number(totalHours).toFixed(0)}h
          </span>
        </div>
      </div>

      {/* Column Card List with Independent Scroll */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 min-h-[140px] max-h-[560px] custom-scrollbar">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isExpanded={expandedTaskIds.has(task.id)}
              onToggleExpand={onToggleExpand}
              onLogTimeClick={onLogTimeClick}
              onViewLogsClick={onViewLogsClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        ) : (
          <div className="py-12 text-center text-xs text-[#A49A8B] font-mono border-2 border-dashed border-[#E7E2DA] rounded-xl flex flex-col items-center justify-center gap-2">
            <i className="fa-solid fa-arrows-up-down-left-right text-[#C0B7AB] text-sm"></i>
            <span>Drop tasks here</span>
          </div>
        )}
      </div>
    </div>
  );
}
