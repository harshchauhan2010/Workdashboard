'use client';

import TaskCard from "./TaskCard";

export default function TaskGridView({
  tasks = [],
  expandedTaskIds,
  onToggleExpand,
  onLogTimeClick,
  onViewLogsClick,
}) {
  if (!tasks.length) {
    return (
      <div className="py-12 text-center text-[#7B7265] font-mono text-xs bg-[#F7F6F5] rounded-2xl border border-dashed border-[#E7E2DA]">
        No matching tasks in this view.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isExpanded={expandedTaskIds.has(task.id)}
          onToggleExpand={onToggleExpand}
          onLogTimeClick={onLogTimeClick}
          onViewLogsClick={onViewLogsClick}
        />
      ))}
    </div>
  );
}
