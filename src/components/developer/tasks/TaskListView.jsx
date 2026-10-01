'use client';

export default function TaskListView({
  tasks = [],
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

  const formatDueDate = (dateStr) => {
    if (!dateStr) return "–";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#EEF6F0] text-[#326A47] border border-[#B3D7BE]">Completed</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#EEF3FB] text-[#285691] border border-[#B6CFEC]">In Progress</span>;
      case "PENDING_REVIEW":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FBF3E7] text-[#97621C] border border-[#EBC988]">Pending Review</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F0EEEA] text-[#7B7265] border border-[#E7E2DA]">To Do</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E7E2DA] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F7F6F5] border-b border-[#E7E2DA] text-[#7B7265] font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Task Details</th>
              <th className="py-3 px-4">Squad / Type</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Est. Hours</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEEA]">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-[#F7F6F5]/50 transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#201C17] max-w-xs truncate">
                  <div className="font-semibold text-sm truncate" title={t.title}>{t.title}</div>
                  <div className="text-[11px] text-[#7B7265] font-mono">{t.category || "DEVELOPMENT"}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-[#F2EFFB] text-[#574092] font-mono font-bold text-[11px] border border-[#C9BDEB]">
                    {t.squad_name ? t.squad_name.replace(/\s\(.*\)/, "") : "SQUAD F"}
                  </span>
                </td>
                <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>
                <td className="py-3.5 px-4 font-mono font-semibold text-[#201C17]">
                  {Number(t.estimated_hours || 0).toFixed(1)}h
                </td>
                <td className="py-3.5 px-4 font-mono text-[#7B7265]">{formatDueDate(t.due_date)}</td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    onClick={() => onViewLogsClick?.(t)}
                    className="px-2.5 py-1 rounded-lg bg-[#F2EFFB] text-[#574092] font-semibold hover:bg-[#E4DEF5] transition-all cursor-pointer border border-[#C9BDEB]"
                  >
                    Logs
                  </button>
                  <button
                    onClick={() => onLogTimeClick?.(t)}
                    className="px-2.5 py-1 rounded-lg bg-[#EEF3FB] text-[#285691] font-semibold hover:bg-[#DCE7F6] transition-all cursor-pointer border border-[#B6CFEC]"
                  >
                    + Log
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
