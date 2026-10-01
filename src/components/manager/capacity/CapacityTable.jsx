'use client';

const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-indigo-500 to-purple-600',
  'from-teal-500 to-emerald-600'
];

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

export default function CapacityTable({
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#E4E0D8] bg-[#F8F7F4]/90">
              <th className="px-5 py-3.5 text-[12px] font-bold text-[#847B6C] uppercase tracking-[0.08em] font-mono table-header-title">
                Developer
              </th>
              <th className="px-4 py-3.5 text-[12px] font-bold text-[#847B6C] uppercase tracking-[0.08em] font-mono table-header-title">
                Recurring
              </th>
              <th className="px-4 py-3.5 text-[12px] font-bold text-[#847B6C] uppercase tracking-[0.08em] font-mono table-header-title">
                Pre-Planning
              </th>
              <th className="px-4 py-3.5 text-[12px] font-bold text-[#847B6C] uppercase tracking-[0.08em] font-mono table-header-title">
                Ad-Hoc
              </th>
              <th className="px-4 py-3.5 text-[12px] font-bold text-[#847B6C] uppercase tracking-[0.08em] font-mono table-header-title">
                Total
              </th>
              <th className="px-5 py-3.5 text-[12px] font-bold text-[#847B6C] uppercase tracking-[0.08em] font-mono table-header-title w-56">
                Capacity
              </th>
              <th className="px-4 py-3.5 text-[12px] font-bold text-[#847B6C] uppercase tracking-[0.08em] font-mono table-header-title">
                Status
              </th>
              <th className="px-5 py-3.5 text-[12px] font-bold text-[#847B6C] uppercase tracking-[0.08em] font-mono table-header-title text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {developers.map((dev, idx) => {
              const cap = Number(dev.weekly_capacity_hours) || 40.0;
              const rec = Number(dev.recurring_hours) || 0.0;
              const sprint = Number(dev.pre_planning_hours) || 0.0;
              const adhoc = Number(dev.adhoc_hours) || 0.0;
              const total = Number(dev.total_load_hours) || (rec + sprint + adhoc);
              const isOver = dev.is_overallocated || total > cap;
              const overage = Math.max(0, total - cap);
              const avail = Math.max(0, cap - total);
              const isNear = !isOver && avail <= 4.0;

              // Gauge segment percentages
              const rPct = Math.min(100, (rec / cap) * 100);
              const sPct = Math.min(Math.max(0, 100 - rPct), (sprint / cap) * 100);
              const aPct = Math.min(Math.max(0, 100 - rPct - sPct), (adhoc / cap) * 100);

              const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
              const initials = getInitials(dev.developer_name);

              return (
                <tr
                  key={dev.user_id || dev.id || idx}
                  className={`transition-colors hover:bg-slate-50/70 ${
                    isOver ? 'bg-red-50/30' : idx % 2 === 1 ? 'bg-slate-50/40' : ''
                  }`}
                >
                  {/* Developer Info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onInspectDev(dev)}
                        title="View 360° Developer Dashboard"
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-[11px] flex-shrink-0 cursor-pointer transition-all hover:scale-105 hover:shadow-md shadow-2xs`}
                      >
                        {initials}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onInspectDev(dev)}
                            className="text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline underline-offset-2 cursor-pointer truncate transition-colors text-left"
                          >
                            {dev.developer_name}
                          </button>
                          {dev.squad_name && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                              {dev.squad_name.replace(/\s*\(.*\)/, '').trim()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-0.5">
                          {dev.role_title || 'Engineer'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Recurring Hours */}
                  <td className="px-4 py-3.5 text-sm text-[#7A4CA6] font-bold font-mono tabular-nums">
                    {rec.toFixed(1)}h
                  </td>

                  {/* Pre-Planning Hours */}
                  <td className="px-4 py-3.5 text-sm text-[#2563EB] font-bold font-mono tabular-nums">
                    {sprint.toFixed(1)}h
                  </td>

                  {/* Ad-Hoc Hours */}
                  <td className="px-4 py-3.5 text-sm text-[#B87A26] font-bold font-mono tabular-nums">
                    {adhoc.toFixed(1)}h
                  </td>

                  {/* Total Hours */}
                  <td className="px-4 py-3.5 text-sm font-mono tabular-nums">
                    <span
                      className={`font-bold ${
                        isOver ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {total.toFixed(1)}
                    </span>
                    <span className="text-slate-400 font-normal"> / {cap.toFixed(0)}</span>
                  </td>

                  {/* Capacity Multi-Segment Gauge */}
                  <td className="px-5 py-3.5 w-56">
                    <div className="capacity-gauge border border-slate-200">
                      <div
                        className="capacity-gauge-segment bg-purple-500"
                        style={{ width: `${rPct}%` }}
                        title={`Recurring: ${rec.toFixed(1)}h`}
                      />
                      <div
                        className="capacity-gauge-segment bg-blue-500"
                        style={{ width: `${sPct}%` }}
                        title={`Pre-Planning: ${sprint.toFixed(1)}h`}
                      />
                      <div
                        className="capacity-gauge-segment bg-amber-500"
                        style={{ width: `${aPct}%` }}
                        title={`Ad-Hoc: ${adhoc.toFixed(1)}h`}
                      />
                      {isOver && (
                        <div
                          className="capacity-gauge-segment bg-striped-rose flex-1 animate-pulse"
                          title={`Overbooked: +${overage.toFixed(1)}h`}
                        />
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    {isOver ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        +{overage.toFixed(1)}h over
                      </span>
                    ) : isNear ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-200 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {avail.toFixed(1)}h left
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {avail.toFixed(1)}h free
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onInspectDev(dev)}
                        title="360° Developer Dashboard"
                        className="p-2 rounded-lg hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-id-badge text-sm"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => onAssignTask(dev)}
                        title="Assign Task"
                        className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-plus text-sm"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => onInspectDev(dev)}
                        title="Quick Inspector"
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
