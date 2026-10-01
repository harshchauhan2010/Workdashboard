'use client';

function getInitials(name) {
  if (!name) return 'DEV';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getSquadColorClasses(squadName = '', squadBadge = '') {
  const norm = (squadName + ' ' + squadBadge).toLowerCase();
  if (norm.includes('squad a') || norm.includes('alpha')) {
    return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
  }
  if (norm.includes('squad b') || norm.includes('beta')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
  }
  if (norm.includes('squad c') || norm.includes('gamma') || norm.includes('emerald')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
  }
  if (norm.includes('squad d') || norm.includes('delta') || norm.includes('purple')) {
    return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
  }
  if (norm.includes('squad e') || norm.includes('epsilon') || norm.includes('amber')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
  }
  if (norm.includes('squad f') || norm.includes('rose')) {
    return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
}

export default function CapacityCardGrid({
  developers = [],
  onInspectDev,
  onAssignTask,
}) {
  if (!developers.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs py-16 text-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl mb-1">
            <i className="fa-solid fa-users-slash"></i>
          </div>
          <div className="text-sm font-bold text-slate-800">No developers found</div>
          <div className="text-xs text-slate-400 max-w-sm">
            Try adjusting your search query, squad filter, or capacity status filter.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {developers.map((dev, idx) => {
        const cap = Number(dev.weekly_capacity_hours) || 40.0;
        const rec = Number(dev.recurring_hours) || 0.0;
        const sprint = Number(dev.pre_planning_hours) || 0.0;
        const adhoc = Number(dev.adhoc_hours) || 0.0;
        const total = Number(dev.total_load_hours) || (rec + sprint + adhoc);
        const isOver = dev.is_overallocated || total > cap;
        const overage = Math.max(0, total - cap);
        const avail = Math.max(0, cap - total);

        const rPct = Math.min(100, (rec / cap) * 100);
        const sPct = Math.min(Math.max(0, 100 - rPct), (sprint / cap) * 100);
        const aPct = Math.min(Math.max(0, 100 - rPct - sPct), (adhoc / cap) * 100);

        const initials = getInitials(dev.developer_name);
        const shortSquadName = dev.squad_name
          ? dev.squad_name.replace(/\s*\(.*\)/, '').trim()
          : '';

        return (
          <div
            key={dev.user_id || dev.id || idx}
            className={`bg-white rounded-2xl border p-5 space-y-3.5 transition-all hover:shadow-card-hover ${
              isOver ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 shadow-card'
            }`}
          >
            {/* Top Header: Avatar + Developer Name / Role + Status Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => onInspectDev(dev)}
                  title="View 360° Developer Dashboard"
                  className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center font-bold text-slate-700 text-xs flex-shrink-0 cursor-pointer transition-all"
                >
                  {initials}
                </button>
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onInspectDev(dev)}
                    className="text-sm font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate transition-colors text-left block"
                  >
                    {dev.developer_name}
                  </button>
                  <div className="text-xs text-slate-400 truncate">
                    {dev.role_title || 'Engineer'}
                  </div>
                </div>
              </div>

              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                  isOver
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                {isOver ? `+${overage.toFixed(1)}h` : `${avail.toFixed(1)}h`}
              </span>
            </div>

            {/* Middle Row: Squad Pill Badge & Total Load */}
            <div className="flex items-center justify-between text-xs">
              {shortSquadName ? (
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold border flex-shrink-0 transition-colors ${getSquadColorClasses(
                    dev.squad_name,
                    dev.squad_badge
                  )}`}
                >
                  {shortSquadName}
                </span>
              ) : (
                <span />
              )}
              <span className="font-mono text-slate-500 font-medium">
                <strong>{total.toFixed(1)}h</strong> / {cap.toFixed(1)}h
              </span>
            </div>

            {/* Multi-segment Capacity Gauge Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex border border-slate-200">
              <div
                className="bg-purple-500 h-full"
                style={{ width: `${rPct}%` }}
                title={`Recurring: ${rec.toFixed(1)}h`}
              />
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${sPct}%` }}
                title={`Pre-Planning: ${sprint.toFixed(1)}h`}
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${aPct}%` }}
                title={`Ad-Hoc: ${adhoc.toFixed(1)}h`}
              />
              {isOver && (
                <div
                  className="bg-striped-rose h-full flex-1 animate-pulse"
                  title={`Overbooked: +${overage.toFixed(1)}h`}
                />
              )}
            </div>

            {/* Footer Row: 360° Dashboard & + Assign */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onInspectDev(dev)}
                className="text-cyan-700 hover:text-cyan-900 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <i className="fa-solid fa-id-badge text-[10px]"></i> 360° Dashboard
              </button>
              <button
                type="button"
                onClick={() => onAssignTask(dev)}
                className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer transition-colors"
              >
                + Assign
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
