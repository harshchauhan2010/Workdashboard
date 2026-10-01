'use client';

import SprintExecutionProgressCard from "./SprintExecutionProgressCard";
import RecurringScheduleCard from "./RecurringScheduleCard";
import WorkLogStreamCard from "./WorkLogStreamCard";
import UpcomingDeadlinesCard from "./UpcomingDeadlinesCard";

export default function DevBottomAnalyticsDeck({
  tasks = [],
  recurringHours = 8.0,
  selectedTaskId = null,
  onClearSelectedTask,
  onOpenLogModal,
  onOpenTaskDetails,
  refreshTrigger = 0,
}) {
  return (
    <div
      id="dev-section-logs"
      className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start scroll-mt-24 animate-fade-in"
    >
      {/* 1. Sprint Execution Progress (Top-Left) */}
      <SprintExecutionProgressCard tasks={tasks} />

      {/* 2. Recurring Schedule (Top-Right) */}
      <RecurringScheduleCard
        tasks={tasks}
        recurringHours={recurringHours}
        onOpenTaskDetails={onOpenTaskDetails}
        refreshTrigger={refreshTrigger}
      />

      {/* 3. Work Log Stream (Bottom-Left) */}
      <WorkLogStreamCard
        selectedTaskId={selectedTaskId}
        onClearSelectedTask={onClearSelectedTask}
        onOpenLogModal={onOpenLogModal}
        onOpenTaskDetails={onOpenTaskDetails}
        refreshTrigger={refreshTrigger}
      />

      {/* 4. Upcoming Deadlines (Bottom-Right) */}
      <UpcomingDeadlinesCard
        tasks={tasks}
        onOpenTaskDetails={onOpenTaskDetails}
      />
    </div>
  );
}
