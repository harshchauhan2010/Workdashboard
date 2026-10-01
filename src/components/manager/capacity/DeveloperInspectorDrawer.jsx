'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api-client';

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

export default function DeveloperInspectorDrawer({
  developer,
  isOpen,
  onClose,
  onAssignTask,
}) {
  const [tasks, setTasks] = useState(null);

  useEffect(() => {
    if (!isOpen || !developer) return;
    let isMounted = true;
    const devId = developer.user_id || developer.id;

    api
      .get(`/api/tasks?assignedTo=${devId}`)
      .then((res) => {
        if (!isMounted) return;
        const list = res?.data?.data || res?.data || [];
        setTasks(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.warn('Could not fetch developer tasks:', err);
        if (isMounted) setTasks([]);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, developer]);

  const isLoadingTasks = tasks === null;
  const taskList = tasks || [];

  if (!isOpen || !developer) return null;

  const cap = Number(developer.weekly_capacity_hours) || 40.0;
  const rec = Number(developer.recurring_hours) || 0.0;
  const sprint = Number(developer.pre_planning_hours) || 0.0;
  const adhoc = Number(developer.adhoc_hours) || 0.0;
  const total = Number(developer.total_load_hours) || (rec + sprint + adhoc);
  const isOver = developer.is_overallocated || total > cap;
  const overage = Math.max(0, total - cap);
  const avail = Math.max(0, cap - total);
  const utilPct = Number(developer.utilization_pct) || Math.round((total / cap) * 100);

  const rPct = Math.min(100, (rec / cap) * 100);
  const sPct = Math.min(Math.max(0, 100 - rPct), (sprint / cap) * 100);
  const aPct = Math.min(Math.max(0, 100 - rPct - sPct), (adhoc / cap) * 100);

  const initials = getInitials(developer.developer_name);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 truncate">
                  {developer.developer_name}
                </h2>
                <p className="text-xs text-slate-400 truncate">
                  {developer.role_title || 'Engineer'}
                </p>
                {developer.squad_name && (
                  <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                    {developer.squad_name.replace(/\s\(.*\)/, '')}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Capacity Status Hero Card */}
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isOver
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Weekly Capacity
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                    isOver
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  }`}
                >
                  {isOver ? `+${overage.toFixed(1)}h Over` : `${avail.toFixed(1)}h Free`}
                </span>
              </div>

              <div className="flex items-baseline justify-between font-mono">
                <span className="text-2xl font-bold text-slate-900">
                  {total.toFixed(1)} / {cap.toFixed(1)}h
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  {utilPct}% booked
                </span>
              </div>

              {/* Multi-segment bar */}
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
            </div>

            {/* Breakdown Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Workload Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                  <span className="text-[11px] text-purple-700 block font-semibold">
                    Recurring Routines
                  </span>
                  <span className="text-lg font-bold font-mono text-purple-900">
                    {rec.toFixed(1)}h
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                  <span className="text-[11px] text-blue-700 block font-semibold">
                    Pre-Planning Sprint
                  </span>
                  <span className="text-lg font-bold font-mono text-blue-900">
                    {sprint.toFixed(1)}h
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <span className="text-[11px] text-amber-700 block font-semibold">
                    Ad-Hoc Emergency
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-900">
                    {adhoc.toFixed(1)}h
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 block font-semibold">
                    Available Buffer
                  </span>
                  <span className="text-lg font-bold font-mono text-emerald-900">
                    {avail.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 text-xs">
              <h3 className="font-bold text-slate-400 uppercase tracking-wider font-mono">
                Engineer Details
              </h3>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-mono text-slate-800">{developer.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seniority:</span>
                  <span className="font-semibold text-slate-800">
                    {developer.seniority || 'Senior Engineer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Load Band:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {developer.load_band || (isOver ? 'OVERALLOCATED' : 'OPTIMAL')}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Tasks Assigned */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Assigned Tasks ({taskList.length})
                </h3>
              </div>

              {isLoadingTasks ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <i className="fa-solid fa-spinner fa-spin mr-1.5"></i> Loading tasks...
                </div>
              ) : taskList.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No active tasks assigned this period.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {taskList.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all text-xs space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800 truncate">
                          {t.title}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-700 flex-shrink-0">
                          {Number(t.estimated_hours || 0).toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {t.task_type || 'TASK'}
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                          {t.status || 'TO_DO'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-sm transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAssignTask(developer);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Assign Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
