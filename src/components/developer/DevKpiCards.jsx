'use client';

export default function DevKpiCards({
  totalTasks = 0,
  completedTasks = 0,
  loggedHours = 0,
  estimatedHours = 0,
  overdueTasks = 0,
}) {
  const activeTasks = Math.max(0, totalTasks - completedTasks);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: TOTAL TASKS */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E2DA] shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[#7B7265]">
          <span className="text-[11px] uppercase font-bold tracking-wider">TOTAL TASKS</span>
          <div className="h-8 w-8 rounded-xl bg-[#EEF3FB] text-[#285691] flex items-center justify-center text-sm">
            <i className="fa-solid fa-list-check"></i>
          </div>
        </div>
        <div className="text-3xl font-display font-extrabold text-[#201C17]">{totalTasks}</div>
        <p className="text-xs text-[#7B7265]">{activeTasks} active</p>
      </div>

      {/* Card 2: COMPLETED */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E2DA] shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[#7B7265]">
          <span className="text-[11px] uppercase font-bold tracking-wider">COMPLETED</span>
          <div className="h-8 w-8 rounded-xl bg-[#EEF6F0] text-[#326A47] flex items-center justify-center text-sm">
            <i className="fa-solid fa-check"></i>
          </div>
        </div>
        <div className="text-3xl font-display font-extrabold text-[#201C17]">{completedTasks}</div>
        <p className="text-xs text-[#7B7265]">{completionRate}% completion rate</p>
      </div>

      {/* Card 3: HOURS LOGGED */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E2DA] shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[#7B7265]">
          <span className="text-[11px] uppercase font-bold tracking-wider">HOURS LOGGED</span>
          <div className="h-8 w-8 rounded-xl bg-[#F2EFFB] text-[#574092] flex items-center justify-center text-sm">
            <i className="fa-regular fa-clock"></i>
          </div>
        </div>
        <div className="text-3xl font-display font-extrabold text-[#201C17]">
          {Number(loggedHours).toFixed(1)}h
        </div>
        <p className="text-xs text-[#7B7265]">of {Number(estimatedHours).toFixed(1)}h estimated</p>
      </div>

      {/* Card 4: OVERDUE */}
      <div className="bg-white p-5 rounded-2xl border border-[#E7E2DA] shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[#7B7265]">
          <span className="text-[11px] uppercase font-bold tracking-wider">OVERDUE</span>
          <div className="h-8 w-8 rounded-xl bg-[#FBEEEC] text-[#AE452F] flex items-center justify-center text-sm">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
        </div>
        <div className="text-3xl font-display font-extrabold text-[#AE452F]">{overdueTasks}</div>
        <p className="text-xs text-[#7B7265]">tasks past due date</p>
      </div>
    </div>
  );
}
