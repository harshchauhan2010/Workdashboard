'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api-client';
import { useApp } from '@/context/AppContext';

const CATEGORY_ICONS = {
  DEVELOPMENT: '💻', TESTING_QA: '🧪', BUG_FIX: '🐛',
  REPORTING: '📊', UI_UX: '🎨', DEVOPS: '⚙️', MEETING: '👥',
};

function getInitials(name = '') {
  if (!name) return 'DEV';
  const parts = name.trim().split(/\s+/);
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AssignTaskModal({
  isOpen,
  onClose,
  initialDev = null,
  developers = [],
  squads = [],
  onSuccess,
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AssignTaskDialog
      onClose={onClose}
      initialDev={initialDev}
      developers={developers}
      squads={squads}
      onSuccess={onSuccess}
    />,
    document.body
  );
}

function AssignTaskDialog({ onClose, initialDev, developers, squads, onSuccess }) {
  const { currentUser, isManager } = useApp();
  const currentUserName = currentUser?.full_name 
    ? `${currentUser.full_name} (${currentUser.role_title || (isManager ? 'Engineering Manager' : 'Engineer')})` 
    : '';

  const defaultSquadId = initialDev?.squad_id || squads[0]?.id || '';
  const defaultDevId = initialDev?.user_id || initialDev?.id || '';

  // Form Fields
  const [title, setTitle] = useState('');
  const [assignedBy, setAssignedBy] = useState(currentUserName || '');
  const [category, setCategory] = useState('DEVELOPMENT');
  const [taskType, setTaskType] = useState('PRE_PLANNING');
  const [estimatedHours, setEstimatedHours] = useState('8');
  const [priority, setPriority] = useState('P2_MEDIUM');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T18:00`;
  });
  const [recurrence, setRecurrence] = useState('WEEKLY');

  // Assignment Target Modes
  const [assignMode, setAssignMode] = useState('single');
  const [squadFilter, setSquadFilter] = useState(defaultSquadId);
  const [assignedTo, setAssignedTo] = useState(defaultDevId);

  // Multi Mode
  const [multiSquadFilter, setMultiSquadFilter] = useState('all');
  const [multiSplitMode, setMultiSplitMode] = useState('split');
  const [multiDevSearch, setMultiDevSearch] = useState('');
  const [selectedMultiDevIds, setSelectedMultiDevIds] = useState(() => (defaultDevId ? [defaultDevId] : []));

  // Team Mode
  const [teamSquadId, setTeamSquadId] = useState(defaultSquadId);

  // Dynamic templates from DB
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) { if (e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch task templates from backend
  useEffect(() => {
    api.get('/api/task-templates')
      .then((res) => {
        const list = res?.data?.data || res?.data;
        if (Array.isArray(list)) setTemplates(list);
      })
      .catch((err) => console.warn('Could not load task templates:', err));
  }, []);

  function applyTemplate(templateId) {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setTitle(tpl.default_task_title || tpl.name || '');
    if (tpl.category) setCategory(tpl.category);
    if (tpl.task_type) setTaskType(tpl.task_type);
    if (tpl.default_estimated_hours) setEstimatedHours(String(tpl.default_estimated_hours));
    if (tpl.default_priority) setPriority(tpl.default_priority);
  }

  // --- Single Mode Calculations ---
  const squadDevs = squadFilter ? developers.filter((d) => d.squad_id === squadFilter) : developers;
  const devOptions = squadDevs.length > 0 ? squadDevs : developers;
  const selectedDev = developers.find((d) => (d.user_id || d.id) === assignedTo);
  const currentTotal = selectedDev ? Number(selectedDev.total_load_hours) || 0 : 0;
  const devCapacity = selectedDev ? Number(selectedDev.weekly_capacity_hours) || 40 : 40;
  const addedHours = Number(estimatedHours) || 0;
  const singleSimTotal = currentTotal + addedHours;
  const singleWillOverallocate = singleSimTotal > devCapacity;
  const singleOverage = Math.max(0, singleSimTotal - devCapacity);
  const singleRemaining = Math.max(0, devCapacity - singleSimTotal);

  // --- Multi Mode Calculations ---
  const filteredMultiDevs = useMemo(() => {
    const q = multiDevSearch.toLowerCase().trim();
    return developers.filter((d) => {
      if (multiSquadFilter !== 'all' && d.squad_id !== multiSquadFilter) return false;
      if (!q) return true;
      const devName = (d.developer_name || d.full_name || d.name || '').toLowerCase();
      const role = (d.role_title || d.role || '').toLowerCase();
      const squad = squads.find((s) => s.id === d.squad_id);
      const squadName = (squad?.name || '').toLowerCase();
      return devName.includes(q) || role.includes(q) || squadName.includes(q);
    });
  }, [developers, squads, multiSquadFilter, multiDevSearch]);

  const multiCount = selectedMultiDevIds.length;
  const multiHoursPerDev = multiCount > 0 ? (multiSplitMode === 'split' ? addedHours / multiCount : addedHours) : 0;
  const multiDevSimulations = useMemo(() => {
    return selectedMultiDevIds.map((devId) => {
      const dev = developers.find((d) => (d.user_id || d.id) === devId);
      const load = dev ? Number(dev.total_load_hours) || 0 : 0;
      const cap = dev ? Number(dev.weekly_capacity_hours) || 40 : 40;
      const newTotal = load + multiHoursPerDev;
      return { devId, name: dev?.developer_name || dev?.full_name || 'Engineer', cap, newTotal, isOver: newTotal > cap };
    });
  }, [selectedMultiDevIds, developers, multiHoursPerDev]);
  const multiHasBreach = multiDevSimulations.some((s) => s.isOver);

  // --- Team Mode Calculations ---
  const selectedTeamSquad = squads.find((s) => s.id === teamSquadId) || squads[0];
  const teamDevs = selectedTeamSquad ? developers.filter((d) => d.squad_id === selectedTeamSquad.id) : [];
  const teamTotalCap = teamDevs.length * 40;
  const teamTotalAllocated = teamDevs.reduce((sum, d) => sum + (Number(d.total_load_hours) || 0), 0);
  const teamUtilPct = teamTotalCap > 0 ? Math.round((teamTotalAllocated / teamTotalCap) * 100) : 0;
  const teamBuffer = Math.max(0, teamTotalCap - teamTotalAllocated);
  const teamLeadName = selectedTeamSquad?.lead_name || selectedTeamSquad?.lead || 'Tech Lead';

  // --- Submit Handler ---
  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError('Please provide a task title.'); return; }
    setIsSubmitting(true);
    setError('');

    try {
      if (assignMode === 'single') {
        const targetSquadId = squadFilter || squads[0]?.id;
        if (!targetSquadId) throw new Error('Please select a squad.');
        await api.post('/api/tasks', {
          title: title.trim(),
          squad_id: targetSquadId,
          assigned_to_user_id: assignedTo || null,
          task_type: taskType,
          category,
          priority,
          estimated_hours: addedHours,
          due_date: dueDate || null,
          status: 'TO_DO',
        });
        onSuccess?.(`Task "${title.trim()}" assigned successfully!`);
      } else if (assignMode === 'multi') {
        if (selectedMultiDevIds.length === 0) throw new Error('Select at least one developer for the pod.');
        const promises = selectedMultiDevIds.map((devId) => {
          const dev = developers.find((d) => (d.user_id || d.id) === devId);
          const devSquadId = dev?.squad_id || multiSquadFilter !== 'all' ? (dev?.squad_id || multiSquadFilter) : (squads[0]?.id);
          const podTitle = selectedMultiDevIds.length > 1
            ? `${title.trim()} (Pod: ${(dev?.developer_name || dev?.full_name || 'Dev').split(' ')[0]})`
            : title.trim();
          return api.post('/api/tasks', {
            title: podTitle,
            squad_id: devSquadId || squads[0]?.id,
            assigned_to_user_id: devId,
            task_type: taskType,
            category,
            priority,
            estimated_hours: multiHoursPerDev,
            due_date: dueDate || null,
            status: 'TO_DO',
          });
        });
        await Promise.all(promises);
        onSuccess?.(`Task "${title.trim()}" assigned to ${selectedMultiDevIds.length} engineers!`);
      } else if (assignMode === 'team') {
        if (!selectedTeamSquad) throw new Error('Select a target squad.');
        const leadDev = teamDevs.find((d) => (d.developer_name || d.full_name) === teamLeadName) || teamDevs[0];
        await api.post('/api/tasks', {
          title: `[${selectedTeamSquad.name.replace(/\s\(.*\)/, '')}] ${title.trim()}`,
          squad_id: selectedTeamSquad.id,
          assigned_to_user_id: leadDev ? (leadDev.user_id || leadDev.id) : null,
          task_type: taskType,
          category,
          priority,
          estimated_hours: addedHours,
          due_date: dueDate || null,
          status: 'TO_DO',
        });
        onSuccess?.(`Task "${title.trim()}" queued to ${selectedTeamSquad.name}!`);
      }
      onClose();
    } catch (err) {
      console.error('Failed to assign task:', err);
      setError(err?.response?.data?.error || err?.response?.data?.message || err.message || 'Failed to assign task');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      id="modal-assign"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: 'rgba(32, 27, 23, 0.58)',
        backdropFilter: 'blur(10px) saturate(115%)',
        WebkitBackdropFilter: 'blur(10px) saturate(115%)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="bg-white rounded-[22px] border border-[#E7E3DA] shadow-[0_28px_80px_rgba(32,27,23,0.24)] flex flex-col overflow-hidden w-full"
        style={{
          width: 'min(720px, calc(100vw - 32px))',
          maxWidth: '720px',
          maxHeight: 'min(800px, calc(100vh - 32px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between px-7 py-4.5 border-b border-[#F3F2F0] flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F7F6] text-[#428CC8] flex items-center justify-center text-lg flex-shrink-0">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h3 className="font-bold text-[17px] text-slate-900 leading-tight tracking-[-0.02em]">Pre-Flight Task Assignment</h3>
              <p className="text-[11px] text-[#98A7B3] mt-0.5">Assign tasks to a single engineer, multiple developers, or an entire team.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-base transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="px-7 py-5 space-y-4 text-sm overflow-y-auto no-scrollbar flex-1 bg-white">
            {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {/* ⚡ QUICK TASK TEMPLATE DROPDOWN BAR */}
          <div className="flex items-center justify-between gap-3 p-2.5 px-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-100/80">
                <i className="fa-solid fa-bolt"></i>
              </span>
              <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">Template:</span>
            </div>
            <div className="flex-1 min-w-0">
              <select
                id="assign-template-select"
                value={selectedTemplateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer min-h-[36px]"
              >
                <option value="">⚡ Select a 1-Click Task Template to auto-fill...</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {CATEGORY_ICONS[tpl.category] || '✨'} {tpl.name} ({Number(tpl.default_estimated_hours || 0).toFixed(1)}h · {(tpl.default_priority || '').replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ROW 1: Task Title */}
          <div>
            <label
              className="block mb-1.5 font-mono"
              style={{
                fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#667785',
              }}
            >
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="assign-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title or requirement..."
              className="w-full bg-white border border-[#E2DCD5] rounded-xl px-3.5 min-h-[42px] text-sm text-[#201C17] font-medium outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-[#98A7B3]"
            />
          </div>

          {/* ROW 2: Assigned By & Task Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                className="block mb-1.5 font-mono"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#667785',
                }}
              >
                Assigned By <span className="text-rose-500">*</span>
              </label>
              <select
                id="assign-by-select"
                value={assignedBy}
                onChange={(e) => setAssignedBy(e.target.value)}
                className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[42px] text-xs font-medium text-[#201C17] outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-all"
              >
                <option value="">Select Assigner / Manager...</option>
                {currentUserName && (
                  <option value={currentUserName}>
                    {currentUserName} (You)
                  </option>
                )}
                {developers.map((d) => {
                  const devLabel = `${d.developer_name || d.full_name} (${d.role_title || 'Engineer'})`;
                  if (devLabel === currentUserName) return null;
                  return (
                    <option key={d.user_id || d.id} value={devLabel}>
                      {devLabel}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label
                className="block mb-1.5 font-mono"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#667785',
                }}
              >
                Task Category <span className="text-rose-500">*</span>
              </label>
              <select
                id="assign-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[42px] text-xs font-medium text-[#201C17] outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-all"
              >
                <option value="DEVELOPMENT">💻 Development Task</option>
                <option value="TESTING_QA">🧪 Testing & QA</option>
                <option value="BUG_FIX">🐛 Bug Fix / Hotfix</option>
                <option value="REPORTING">📊 Reporting & Docs</option>
                <option value="UI_UX">🎨 UI/UX Design</option>
                <option value="DEVOPS">⚙️ DevOps & Infra</option>
                <option value="MEETING">👥 Architecture & Sync</option>
              </select>
            </div>
          </div>

          {/* ROW 3: Workload Type & Estimated Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                className="block mb-1.5 font-mono"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#667785',
                }}
              >
                Workload Type <span className="text-rose-500">*</span>
              </label>
              <select
                id="assign-type-select"
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[42px] text-xs font-medium text-[#201C17] outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-all"
              >
                <option value="PRE_PLANNING">Pre-Planning</option>
                <option value="AD_HOC_EMERGENCY">Ad-Hoc Emergency</option>
                <option value="RECURRING_ROUTINE">Recurring Routine</option>
              </select>
            </div>
            <div>
              <label
                className="block mb-1.5 font-mono"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#667785',
                }}
              >
                Estimated Hours <span className="text-rose-500">*</span>
              </label>
              <input
                id="assign-hours-input"
                type="number"
                step="0.5"
                min="0.5"
                max="80"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[42px] text-xs text-[#201C17] font-mono font-bold outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* Recurrence fields (if RECURRING_ROUTINE) */}
          {taskType === 'RECURRING_ROUTINE' && (
            <div id="assign-recurrence-fields" className="rounded-xl border border-purple-200 bg-purple-50/60 p-3.5">
              <div className="flex items-center gap-2 mb-2 text-purple-800">
                <i className="fa-solid fa-repeat text-xs"></i>
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Recurring schedule</span>
              </div>
              <label
                className="block mb-1.5 font-mono"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#667785',
                }}
              >
                Repeat
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full bg-white border border-purple-200 rounded-xl px-3.5 min-h-[42px] text-xs font-medium outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 cursor-pointer"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
              <p className="mt-1.5 text-[11px] text-purple-700">This task will be marked with its repeat schedule in the task board.</p>
            </div>
          )}

          {/* ROW 4: Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                className="block mb-1.5 font-mono"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#667785',
                }}
              >
                Priority
              </label>
              <select
                id="assign-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[42px] text-xs font-medium text-[#201C17] outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-all"
              >
                <option value="P1_HIGH">P1 — Urgent Priority</option>
                <option value="P2_MEDIUM">P2 — Standard Priority</option>
                <option value="P3_LOW">P3 — Low Priority</option>
              </select>
            </div>
            <div>
              <label
                className="block mb-1.5 font-mono"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#667785',
                }}
              >
                Due Date
              </label>
              <input
                id="assign-due-date-input"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[42px] text-xs text-[#201C17] font-mono font-medium outline-none focus:border-[#818CF8] focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ASSIGNMENT TARGET: SEGMENTED MODE SELECTOR (CONTAINER CARD)     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EFECE6] space-y-3">
            <div className="flex items-center justify-between">
              <label
                className="block font-mono"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#667785',
                }}
              >
                Assignment Target
              </label>
              <span
                id="assign-mode-helper"
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  color: '#98A7B3',
                }}
              >
                {assignMode === 'single' && 'Assign directly to one engineer with pre-flight check'}
                {assignMode === 'multi' && 'Assign to a collaborative pair or multi-dev pod'}
                {assignMode === 'team' && 'Assign to the entire squad backlog and Tech Lead'}
              </span>
            </div>

            {/* Mode Pills */}
            <div className="grid grid-cols-3 gap-2 bg-[#F1EFEB] p-1.5 rounded-xl">
              <button
                type="button"
                onClick={() => setAssignMode('single')}
                id="assign-mode-btn-single"
                className={`py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  assignMode === 'single' ? 'bg-white text-[#1F4A86] shadow-xs font-bold' : 'font-medium text-[#667785] hover:text-[#201C17]'
                }`}
              >
                <i className="fa-solid fa-user"></i> Single Developer
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('multi')}
                id="assign-mode-btn-multi"
                className={`py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  assignMode === 'multi' ? 'bg-white text-[#1F4A86] shadow-xs font-bold' : 'font-medium text-[#667785] hover:text-[#201C17]'
                }`}
              >
                <i className="fa-solid fa-users"></i> Multiple Devs
              </button>
              <button
                type="button"
                onClick={() => setAssignMode('team')}
                id="assign-mode-btn-team"
                className={`py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  assignMode === 'team' ? 'bg-white text-[#1F4A86] shadow-xs font-bold' : 'font-medium text-[#667785] hover:text-[#201C17]'
                }`}
              >
                <i className="fa-solid fa-people-group"></i> Entire Team / Squad
              </button>
            </div>

            {/* MODE 1: SINGLE DEVELOPER PANEL */}
            {assignMode === 'single' && (
              <div id="assign-panel-single" className="p-3.5 rounded-xl border border-[#F0EDE7] bg-white space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block mb-1 font-mono"
                      style={{
                        fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#667785',
                      }}
                    >
                      Filter by Team / Squad
                    </label>
                    <select
                      id="assign-single-squad-filter"
                      value={squadFilter}
                      onChange={(e) => {
                        setSquadFilter(e.target.value);
                        const firstDev = developers.find((d) => d.squad_id === e.target.value);
                        if (firstDev) setAssignedTo(firstDev.user_id || firstDev.id);
                      }}
                      className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[38px] text-xs font-medium text-[#201C17] outline-none focus:border-[#818CF8] cursor-pointer"
                    >
                      <option value="">All Squads ({squads.length})</option>
                      {squads.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block mb-1 font-mono"
                      style={{
                        fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#667785',
                      }}
                    >
                      Assignee <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="assign-dev-select"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[38px] text-xs font-semibold text-[#201C17] outline-none focus:border-[#818CF8] cursor-pointer"
                    >
                      <option value="">Unassigned (Squad Backlog)</option>
                      {devOptions.map((d) => {
                        const buffer = Number(d.available_buffer_hours || (40 - (Number(d.total_load_hours) || 0))).toFixed(1);
                        return (
                          <option key={d.user_id || d.id} value={d.user_id || d.id}>
                            {d.developer_name || d.full_name} ({d.role_title || 'Engineer'}) — {buffer}h free
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Audit Simulation */}
                {selectedDev && (
                  <div
                    id="sim-audit-container"
                    className={`p-3.5 rounded-xl border transition-all space-y-2 font-mono text-xs ${
                      singleWillOverallocate ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className={`flex items-center gap-1.5 ${singleWillOverallocate ? 'text-rose-700' : 'text-emerald-700'}`}>
                        <i className={`fa-solid ${singleWillOverallocate ? 'fa-triangle-exclamation' : 'fa-circle-check'} text-xs`}></i>
                        {singleWillOverallocate ? 'Capacity Breach (Overallocated)' : 'Pre-Flight Passed (Within Capacity)'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold border ${
                        singleWillOverallocate ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {singleWillOverallocate ? `+${singleOverage.toFixed(1)}h over limit` : `${singleRemaining.toFixed(1)}h buffer left`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-sans">
                      <strong>{selectedDev.developer_name || selectedDev.full_name}</strong>: <strong>{currentTotal.toFixed(1)}h</strong> + <strong>{addedHours.toFixed(1)}h</strong> → <strong>{singleSimTotal.toFixed(1)}h / {devCapacity.toFixed(0)}h</strong> workload ({Math.round((singleSimTotal / devCapacity) * 100)}% load).
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: MULTIPLE DEVELOPERS PANEL */}
            {assignMode === 'multi' && (
              <div id="assign-panel-multi" className="p-3.5 rounded-xl border border-[#F0EDE7] bg-white space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block mb-1 font-mono"
                      style={{
                        fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#667785',
                      }}
                    >
                      Filter by Squad
                    </label>
                    <select
                      id="assign-multi-squad-filter"
                      value={multiSquadFilter}
                      onChange={(e) => setMultiSquadFilter(e.target.value)}
                      className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[38px] text-xs font-medium text-[#201C17] outline-none focus:border-[#818CF8] cursor-pointer"
                    >
                      <option value="all">All Squads ({squads.length})</option>
                      {squads.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      className="block mb-1 font-mono"
                      style={{
                        fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#667785',
                      }}
                    >
                      Hour Distribution
                    </label>
                    <select
                      id="assign-multi-split-mode"
                      value={multiSplitMode}
                      onChange={(e) => setMultiSplitMode(e.target.value)}
                      className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[38px] text-xs font-semibold text-[#201C17] outline-none focus:border-[#818CF8] cursor-pointer"
                    >
                      <option value="split">Divide hours evenly among developers</option>
                      <option value="full">Assign full hours to each developer</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <i className="fa-solid fa-magnifying-glass text-xs"></i>
                    </div>
                    <input
                      type="text"
                      id="assign-multi-dev-search"
                      placeholder="Search developers to add to this task..."
                      value={multiDevSearch}
                      onChange={(e) => setMultiDevSearch(e.target.value)}
                      className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl pl-9 pr-3.5 min-h-[38px] text-xs text-[#201C17] placeholder-[#98A7B3] outline-none focus:border-[#818CF8] focus:bg-white transition-all"
                    />
                  </div>

                  <div id="assign-multi-dev-list" className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50/70 border border-slate-200 rounded-2xl no-scrollbar">
                    {filteredMultiDevs.length === 0 ? (
                      <div className="text-xs text-slate-400 font-mono text-center py-4">No developers match filter.</div>
                    ) : (
                      filteredMultiDevs.map((d) => {
                        const devId = d.user_id || d.id;
                        const isChecked = selectedMultiDevIds.includes(devId);
                        const name = d.developer_name || d.full_name || 'Engineer';
                        const squad = squads.find((s) => s.id === d.squad_id);
                        const squadName = squad ? squad.name.replace(/\s\(.*\)/, '') : 'Squad';
                        const freeBuffer = Number(d.available_buffer_hours || (40 - (Number(d.total_load_hours) || 0)));
                        const isOver = (Number(d.total_load_hours) || 0) > 40;

                        return (
                          <label
                            key={devId}
                            onClick={() => setSelectedMultiDevIds((prev) => prev.includes(devId) ? prev.filter((id) => id !== devId) : [...prev, devId])}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                              isChecked ? 'bg-blue-50/80 border border-blue-200' : 'bg-white border border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input type="checkbox" checked={isChecked} onChange={() => {}} className="rounded accent-blue-600 w-4 h-4 cursor-pointer" />
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center font-mono flex-shrink-0">
                                {getInitials(name)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">{name}</div>
                                <div className="text-[11px] text-slate-500 font-mono truncate">{d.role_title || 'Engineer'} · {squadName}</div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              isOver ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isOver ? `+${(Number(d.total_load_hours) - 40).toFixed(1)}h over` : `${freeBuffer.toFixed(1)}h free`}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div id="multi-sim-audit-container">
                  {multiCount === 0 ? (
                    <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 text-center text-xs text-slate-500 font-mono">
                      👉 Select 2 or more developers from the list above to assign this task as a pair / pod.
                    </div>
                  ) : (
                    <div className={`p-3.5 rounded-xl border space-y-2.5 ${multiHasBreach ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="font-bold text-slate-800">
                          {multiCount} Engineers Selected · {multiHoursPerDev.toFixed(1)}h each {multiSplitMode === 'split' ? '(Split equally)' : '(Full hours)'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                          multiHasBreach ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {multiHasBreach ? '⚠️ Capacity Breach' : '✅ All Within Capacity'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {multiDevSimulations.map((s) => (
                          <div key={s.devId} className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate">{s.name}</span>
                            <span className={`font-mono text-[11px] font-bold ${s.isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {s.newTotal.toFixed(1)}h / {s.cap}h
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE 3: ENTIRE SQUAD / TEAM PANEL */}
            {assignMode === 'team' && (
              <div id="assign-panel-team" className="p-3.5 rounded-xl border border-[#F0EDE7] bg-white space-y-3">
                <div>
                  <label
                    className="block mb-1 font-mono"
                    style={{
                      fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#667785',
                    }}
                  >
                    Select Target Squad / Team <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="assign-team-squad-select"
                    value={teamSquadId}
                    onChange={(e) => setTeamSquadId(e.target.value)}
                    className="w-full bg-[#FDFDFC] border border-[#E2DCD5] rounded-xl px-3.5 min-h-[42px] text-xs font-semibold text-[#201C17] outline-none focus:border-[#818CF8] cursor-pointer"
                  >
                    {squads.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {selectedTeamSquad && (
                  <div id="team-sim-audit-container" className="p-4 rounded-xl border bg-indigo-50/70 border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{selectedTeamSquad.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          Tech Lead: <strong className="text-slate-800">{teamLeadName}</strong> · {teamDevs.length} Active Engineers
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                        teamUtilPct >= 90 ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {teamUtilPct}% Squad Load
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs space-y-1.5 font-mono text-slate-600">
                      <div className="flex justify-between">
                        <span>Squad Total Capacity:</span>
                        <strong className="text-slate-800">{teamTotalCap}h / sprint</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Allocated Load:</span>
                        <strong>{teamTotalAllocated.toFixed(1)}h</strong>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Available Squad Buffer:</span>
                        <strong>{teamBuffer.toFixed(1)}h free</strong>
                      </div>
                    </div>

                    <div className="text-xs text-indigo-900 font-medium flex items-center gap-1.5">
                      <i className="fa-solid fa-circle-info text-indigo-500"></i>
                      <span>
                        This task will be queued directly into <strong>{selectedTeamSquad.name}</strong> and assigned to Tech Lead <strong>{teamLeadName}</strong> for sprint execution.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Modal Footer */}
          <div className="px-7 py-4 bg-[#FDFDFC] border-t border-[#F1EFEB] flex items-center justify-between flex-shrink-0">
            <div
              className="text-xs font-mono flex items-center gap-1.5"
              style={{
                fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#98A7B3',
              }}
            >
              <i className="fa-solid fa-shield-check text-[#428CC8]"></i> Pre-flight check simulates workload impact
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[#F4F2EE] hover:bg-[#EAE7E0] text-[#667785] hover:text-[#201C17] text-xs font-semibold transition-colors cursor-pointer min-h-[40px] border-none"
              >
                Cancel
              </button>
              <button
                id="btn-submit-task-assignment"
                type="submit"
                disabled={isSubmitting || (assignMode === 'multi' && multiCount === 0)}
                className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer min-h-[40px] border-none ${
                  (assignMode === 'multi' && multiCount === 0)
                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-[#1F4A86] hover:bg-[#183B6B] shadow-[0_6px_14px_rgba(31,74,134,0.22)]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span>Assigning...</span>
                  </>
                ) : assignMode === 'multi' ? (
                  multiCount === 0 ? (
                    <span>Select Developers</span>
                  ) : multiHasBreach ? (
                    <>
                      <i className="fa-solid fa-bolt text-xs"></i>
                      <span>Force Assign Pod (Overtime)</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-users text-xs"></i>
                      <span>Assign to {multiCount} Developers</span>
                    </>
                  )
                ) : assignMode === 'team' ? (
                  <>
                    <i className="fa-solid fa-check text-xs"></i>
                    <span>Assign to {selectedTeamSquad?.name?.replace(/\s\(.*\)/, '') || 'Squad'}</span>
                  </>
                ) : singleWillOverallocate ? (
                  <>
                    <i className="fa-solid fa-bolt text-xs"></i>
                    <span>Force Assign (Overtime)</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check text-xs"></i>
                    <span>Confirm Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
