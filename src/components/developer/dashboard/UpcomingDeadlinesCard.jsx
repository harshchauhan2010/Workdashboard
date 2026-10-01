'use client';

export default function UpcomingDeadlinesCard({ tasks = [], onOpenTaskDetails }) {
  const activeTasks = tasks.filter(
    (t) =>
      t.status !== "COMPLETED" &&
      t.status !== "PENDING_REVIEW" &&
      t.status !== "PENDING_ACCEPTANCE"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withDates = activeTasks
    .map((t) => {
      if (!t.due_date) return null;
      const raw = String(t.due_date).replace(/\s·.*/, "").replace(/\s\(.*\)/, "").trim();
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : { ...t, parsedDate: d };
    })
    .filter(Boolean)
    .sort((a, b) => a.parsedDate - b.parsedDate)
    .slice(0, 6);

  const upcomingCount = withDates.length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <i className="fa-regular fa-calendar-check text-indigo-500"></i> Upcoming Deadlines
        </h3>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
          {upcomingCount} upcoming
        </span>
      </div>

      {/* Deadlines List */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {withDates.length === 0 ? (
          <div className="text-sm text-slate-400 font-mono text-center py-6">
            No upcoming deadlines scheduled.
          </div>
        ) : (
          withDates.map((t) => {
            const taskDate = new Date(t.parsedDate);
            taskDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));

            const isOverdue = diffDays < 0;
            const isToday = diffDays === 0;
            const isTomorrow = diffDays === 1;

            let urgencyBadge = null;
            let cardBorder = "border-slate-200 bg-white hover:border-slate-300";
            let leftAccent = "bg-blue-500";

            if (isOverdue) {
              urgencyBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <span>Overdue ({Math.abs(diffDays)}d)</span>
                </span>
              );
              cardBorder = "border-rose-200 bg-rose-50/20 hover:border-rose-300";
              leftAccent = "bg-rose-500";
            } else if (isToday) {
              urgencyBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <i className="fa-solid fa-fire text-amber-500"></i>
                  <span>Due Today</span>
                </span>
              );
              cardBorder = "border-rose-200 bg-rose-50/20 hover:border-rose-300";
              leftAccent = "bg-rose-500";
            } else if (isTomorrow) {
              urgencyBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                  <i className="fa-regular fa-clock"></i>
                  <span>Tomorrow</span>
                </span>
              );
              cardBorder = "border-amber-200 bg-amber-50/20 hover:border-amber-300";
              leftAccent = "bg-amber-500";
            } else {
              urgencyBadge = (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                  In {diffDays} days
                </span>
              );
              cardBorder = "border-slate-200 bg-white hover:border-slate-300";
              leftAccent =
                t.task_type === "ADHOC" || t.task_type === "AD_HOC_EMERGENCY"
                  ? "bg-amber-500"
                  : t.task_type === "RECURRING" || t.task_type === "RECURRING_ROUTINE"
                  ? "bg-purple-500"
                  : "bg-blue-500";
            }

            const isRecurring =
              t.task_type === "RECURRING" || t.task_type === "RECURRING_ROUTINE";
            const isAdhoc =
              t.task_type === "ADHOC" || t.task_type === "AD_HOC_EMERGENCY";
            const typeName = isRecurring
              ? "Recurring"
              : isAdhoc
              ? "Ad-Hoc"
              : "Pre-Planning";

            const typeBadgeColor = isRecurring
              ? "text-purple-700 bg-purple-50 border-purple-200"
              : isAdhoc
              ? "text-amber-700 bg-amber-50 border-amber-200"
              : "text-blue-700 bg-blue-50 border-blue-200";

            const est = Number(t.estimated_hours) || 0;
            const log = Number(t.logged_hours) || 0;
            const hoursRemaining = Math.max(0, est - log);

            const formattedDueDate = t.parsedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={t.id}
                onClick={() => onOpenTaskDetails && onOpenTaskDetails(t)}
                className={`relative p-3.5 rounded-2xl border ${cardBorder} shadow-2xs transition-all overflow-hidden space-y-2.5 cursor-pointer`}
              >
                <div className={`absolute inset-y-0 left-0 w-1 ${leftAccent} rounded-l-2xl`}></div>

                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold uppercase border border-slate-200">
                        {t.squad_badge_code || "ALPHA"}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${typeBadgeColor}`}>
                        {typeName}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                      {t.title}
                    </h4>
                  </div>
                  <div className="flex-shrink-0">{urgencyBadge}</div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-mono pl-2 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-regular fa-calendar text-slate-400"></i> {formattedDueDate}
                  </span>
                  <span>
                    <strong>{hoursRemaining.toFixed(1)}h</strong> remaining
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
