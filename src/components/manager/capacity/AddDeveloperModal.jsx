'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api-client';

export default function AddDeveloperModal({
  isOpen,
  onClose,
  developers = [],
  initialDev = null,
  squads = [],
  onSuccess,
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AddDeveloperDialog
      onClose={onClose}
      developers={developers}
      initialDev={initialDev}
      squads={squads}
      onSuccess={onSuccess}
    />,
    document.body
  );
}

function AddDeveloperDialog({ onClose, developers = [], initialDev = null, squads = [], onSuccess }) {
  const targetDev = initialDev || developers[0] || null;
  const initialId = targetDev?.user_id || targetDev?.id || '';
  const [selectedDevId, setSelectedDevId] = useState(initialId);

  const initialName = targetDev?.developer_name || targetDev?.full_name || '';
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(
    targetDev?.email ||
      (initialName ? `${initialName.toLowerCase().replace(/[^a-z0-9]/g, '.') }@workdash.internal` : '')
  );
  const [roleTitle, setRoleTitle] = useState(targetDev?.role_title || 'Software Engineer');
  const [seniority, setSeniority] = useState(targetDev?.seniority || 'L3_SENIOR');
  const [squadId, setSquadId] = useState(targetDev?.squad_id || squads[0]?.id || '');
  const [weeklyCapacity, setWeeklyCapacity] = useState(String(targetDev?.weekly_capacity_hours || '40'));
  const [recurringOverhead, setRecurringOverhead] = useState(String(targetDev?.recurring_overhead_hours || '6.0'));
  const [skills, setSkills] = useState(() => {
    if (!targetDev?.skills) return '';
    return Array.isArray(targetDev.skills) ? targetDev.skills.join(', ') : String(targetDev.skills);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Handle ESC key to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleDevSelect(devId) {
    setSelectedDevId(devId);
    setErrors({});
    setServerError('');

    const dev = developers.find((d) => (d.user_id || d.id) === devId);
    if (!dev) return;

    const devName = dev.developer_name || dev.full_name || '';
    setFullName(devName);
    setEmail(dev.email || `${devName.toLowerCase().replace(/[^a-z0-9]/g, '.') }@workdash.internal`);
    setRoleTitle(dev.role_title || 'Software Engineer');
    setSeniority(dev.seniority || 'L3_SENIOR');
    setSquadId(dev.squad_id || '');
    setWeeklyCapacity(String(dev.weekly_capacity_hours || 40));
    setRecurringOverhead(String(dev.recurring_overhead_hours || 6.0));
    setSkills(Array.isArray(dev.skills) ? dev.skills.join(', ') : (dev.skills || ''));
  }

  function setQuickDevRole(role, recurringHours, skillsList) {
    setRoleTitle(role);
    setRecurringOverhead(String(recurringHours));
    setSkills(skillsList);
    setErrors((prev) => ({ ...prev, role: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = {};

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      newErrors.name = 'Please select a valid developer.';
    }

    const trimmedRole = roleTitle.trim();
    if (!trimmedRole || trimmedRole.length < 2) {
      newErrors.role = 'Please specify a technical role.';
    }

    const capNum = parseFloat(weeklyCapacity) || 0;
    if (capNum < 10 || capNum > 80) {
      newErrors.capacity = 'Capacity hours must be between 10h and 80h.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // UPDATE EXISTING DEVELOPER (Email & Name cannot be edited by admin)
      await api.patch(`/api/users/${selectedDevId}`, {
        role_title: trimmedRole,
        seniority: seniority,
        weekly_capacity_hours: Number(weeklyCapacity) || 40.0,
        recurring_overhead_hours: Number(recurringOverhead) || 6.0,
        skills: skillsArray,
      });

      // If squad changed, link member to new squad
      if (squadId) {
        try {
          await api.post(`/api/squads/${squadId}/members`, {
            user_id: selectedDevId,
            allocation_percentage: 100,
          });
        } catch (memberErr) {
          console.warn('Squad membership update notice:', memberErr);
        }
      }

      onSuccess?.(`Successfully updated ${trimmedName}'s profile!`);
      onClose?.();
    } catch (err) {
      console.error('Failed to update developer profile:', err);
      setServerError(err.response?.data?.message || err.message || 'Failed to update developer profile');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: 'rgba(32, 27, 23, 0.58)',
        backdropFilter: 'blur(10px) saturate(115%)',
        WebkitBackdropFilter: 'blur(10px) saturate(115%)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className="bg-white rounded-[22px] border flex flex-col overflow-hidden shadow-2xl"
        style={{
          width: 'min(680px, calc(100vw - 32px))',
          maxWidth: '680px',
          maxHeight: 'min(800px, calc(100vh - 32px))',
          borderColor: 'rgba(231, 227, 218, 0.95)',
          boxShadow: '0 28px 80px rgba(32, 27, 23, 0.24)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-start justify-between flex-shrink-0 bg-white"
          style={{
            padding: '22px 28px 18px',
            borderBottom: '1px solid #F3F2F0',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                width: '42px',
                height: '42px',
                background: '#F7F7F6',
                color: '#428CC8',
                fontSize: '17px',
              }}
            >
              <i className="fa-solid fa-user-gear"></i>
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-sora), 'Sora', sans-serif",
                  fontSize: '17px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#201C17',
                  lineHeight: 1.25,
                }}
              >
                Update Developer Profile
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '11px',
                  color: '#98A7B3',
                  lineHeight: 1.35,
                  marginTop: '3px',
                }}
              >
                Manage squad allocation, technical role, and workload capacity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: '#FAFAFA',
              color: '#98A7B3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F0EEEA';
              e.currentTarget.style.color = '#201C17';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FAFAFA';
              e.currentTarget.style.color = '#98A7B3';
            }}
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body (Scrollable with hidden scrollbar) */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-between"
          style={{
            padding: '20px 28px 20px',
            gap: '16px',
            background: '#ffffff',
            overflowX: 'hidden',
          }}
        >
          {serverError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{serverError}</span>
            </div>
          )}

          {/* ⚡ SELECT DEVELOPER (DYNAMIC DROPDOWN OF EXISTING DEVELOPERS) */}
          <div className="flex items-center justify-between gap-3 p-2.5 px-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100/80">
                <i className="fa-solid fa-user-gear"></i>
              </span>
              <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">Developer:</span>
            </div>
            <div className="flex-1 min-w-0">
              <select
                id="dev-profile-select"
                value={selectedDevId}
                onChange={(e) => handleDevSelect(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {developers.map((d) => (
                  <option key={d.user_id || d.id} value={d.user_id || d.id}>
                    👤 {d.developer_name || d.full_name} ({d.role_title || 'Engineer'} · {d.squad_name || 'Unassigned'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 1: Full Name & Internal Email (Read-Only) */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            style={{
              paddingBottom: '17px',
              borderBottom: '1px solid #F3F2F0',
            }}
          >
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#667785',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: '7px',
                }}
              >
                <span>Full Name</span>
                <span className="text-[10px] text-slate-400 font-mono lowercase tracking-normal font-normal ml-auto flex items-center gap-1">
                  <i className="fa-solid fa-lock text-[9px]"></i> read-only
                </span>
              </label>
              <input
                type="text"
                placeholder="Developer Name"
                value={fullName}
                disabled={true}
                readOnly={true}
                className="w-full outline-none transition-all"
                style={{
                  minHeight: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #EBE7E0',
                  background: '#F4F2EE',
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#78716C',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#667785',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: '7px',
                }}
              >
                <span>Internal Email</span>
                <span className="text-[10px] text-slate-400 font-mono lowercase tracking-normal font-normal ml-auto flex items-center gap-1">
                  <i className="fa-solid fa-lock text-[9px]"></i> read-only
                </span>
              </label>
              <input
                type="email"
                placeholder="Developer Email"
                value={email}
                disabled={true}
                readOnly={true}
                className="w-full outline-none transition-all"
                style={{
                  minHeight: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #EBE7E0',
                  background: '#F4F2EE',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#78716C',
                  cursor: 'not-allowed',
                }}
              />
            </div>
          </div>

          {/* Row 2: Assigned Squad & Seniority */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            style={{
              paddingBottom: '17px',
              borderBottom: '1px solid #F3F2F0',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#667785',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: '7px',
                }}
              >
                Assigned Squad / Team <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <select
                value={squadId}
                onChange={(e) => setSquadId(e.target.value)}
                className="w-full outline-none cursor-pointer transition-all"
                style={{
                  minHeight: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #EBE7E0',
                  background: '#FDFDFC',
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#201C17',
                }}
                onFocus={(e) => (e.target.style.background = '#ffffff')}
                onBlur={(e) => (e.target.style.background = '#FDFDFC')}
              >
                {squads.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="">Unassigned (Bench / Floater)</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#667785',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: '7px',
                }}
              >
                Seniority / Level
              </label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full outline-none cursor-pointer transition-all"
                style={{
                  minHeight: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #EBE7E0',
                  background: '#FDFDFC',
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#201C17',
                }}
                onFocus={(e) => (e.target.style.background = '#ffffff')}
                onBlur={(e) => (e.target.style.background = '#FDFDFC')}
              >
                <option value="L3_SENIOR">Senior Engineer (L3)</option>
                <option value="L2_MID">Mid-Level Engineer (L2)</option>
                <option value="L1_JUNIOR">Junior Engineer (L1)</option>
                <option value="L4_STAFF">Staff Engineer (L4)</option>
                <option value="L5_PRINCIPAL">Principal Engineer (L5)</option>
                <option value="LEAD">Tech Lead</option>
              </select>
            </div>
          </div>

          {/* Row 3: Primary Technical Role */}
          <div className="flex flex-col gap-2">
            <label
              style={{
                display: 'block',
                color: '#667785',
                fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                lineHeight: 1.2,
                textTransform: 'uppercase',
              }}
            >
              Primary Technical Role <span style={{ color: '#E11D48' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Senior React Architect, Go Microservices Specialist"
              value={roleTitle}
              onChange={(e) => {
                setRoleTitle(e.target.value);
                if (errors.role) setErrors((prev) => ({ ...prev, role: '' }));
              }}
              className={`w-full outline-none transition-all ${
                errors.role ? 'input-error' : ''
              }`}
              style={{
                minHeight: '44px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #EBE7E0',
                background: '#ffffff',
                fontFamily: "var(--font-inter), 'Inter', sans-serif",
                fontSize: '12px',
                fontWeight: 600,
                color: '#201C17',
              }}
            />
            {errors.role && (
              <div className="form-error-hint">
                <i className="fa-solid fa-circle-exclamation"></i> {errors.role}
              </div>
            )}

            {/* Quick-fill Actions (Single Line, No Scrollbar) */}
            <div
              className="flex items-center gap-1.5 flex-wrap"
              style={{ paddingTop: '1px' }}
            >
              <span
                style={{
                  color: '#98A7B3',
                  fontSize: '10px',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  marginRight: '2px',
                }}
              >
                Quick-fill:
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuickDevRole(
                    'Senior React Architect',
                    6.0,
                    'React, TypeScript, Next.js, Tailwind'
                  )
                }
                style={{
                  minHeight: '25px',
                  padding: '4px 9px',
                  borderRadius: '999px',
                  border: '1px solid transparent',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: '#EEF3FB',
                  color: '#285691',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#DCE7F6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#EEF3FB')}
              >
                🎨 Frontend React
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuickDevRole(
                    'Senior Backend & API Engineer',
                    7.0,
                    'Node.js, Go, PostgreSQL, Redis, gRPC'
                  )
                }
                style={{
                  minHeight: '25px',
                  padding: '4px 9px',
                  borderRadius: '999px',
                  border: '1px solid transparent',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: '#F2EFFB',
                  color: '#574092',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E4DEF5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F2EFFB')}
              >
                💻 Backend API
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuickDevRole(
                    'Lead Mobile Developer (iOS/Android)',
                    6.0,
                    'Swift, Kotlin, React Native, Mobile CI/CD'
                  )
                }
                style={{
                  minHeight: '25px',
                  padding: '4px 9px',
                  borderRadius: '999px',
                  border: '1px solid transparent',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: '#EEF6F0',
                  color: '#326A47',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#D9EBDD')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#EEF6F0')}
              >
                📱 Mobile Dev
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuickDevRole(
                    'Cloud Platform & Kubernetes SRE',
                    8.0,
                    'Kubernetes, AWS, Terraform, Docker, Datadog'
                  )
                }
                style={{
                  minHeight: '25px',
                  padding: '4px 9px',
                  borderRadius: '999px',
                  border: '1px solid transparent',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: '#F4EFF9',
                  color: '#623C87',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E7DBF1')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F4EFF9')}
              >
                ☁️ Cloud / SRE
              </button>
              <button
                type="button"
                onClick={() =>
                  setQuickDevRole(
                    'QA Automation Lead (Playwright/k6)',
                    6.0,
                    'Playwright, Cypress, k6, Jest, API Testing'
                  )
                }
                style={{
                  minHeight: '25px',
                  padding: '4px 9px',
                  borderRadius: '999px',
                  border: '1px solid transparent',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: '#FBF3E7',
                  color: '#97621C',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F5E4C4')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FBF3E7')}
              >
                🧪 QA Automation
              </button>
            </div>
          </div>

          {/* Row 4: Grouped Capacity Container */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{
              padding: '16px 18px',
              border: '1px solid #F0EDE7',
              borderRadius: '14px',
              background: '#FAFAFA',
              gap: '16px',
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#667785',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: '7px',
                }}
              >
                Weekly Total Hours <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={weeklyCapacity}
                  min="10"
                  max="80"
                  onChange={(e) => {
                    setWeeklyCapacity(e.target.value);
                    if (errors.capacity)
                      setErrors((prev) => ({ ...prev, capacity: '' }));
                  }}
                  className={`w-full outline-none ${
                    errors.capacity ? 'input-error' : ''
                  }`}
                  style={{
                    minHeight: '44px',
                    padding: '0 34px 0 14px',
                    borderRadius: '10px',
                    border: '1px solid #EBE7E0',
                    background: '#ffffff',
                    fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#201C17',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                    fontSize: '12px',
                    color: '#98A7B3',
                    pointerEvents: 'none',
                  }}
                >
                  h
                </span>
              </div>
              {errors.capacity && (
                <div className="form-error-hint">
                  <i className="fa-solid fa-circle-exclamation"></i> {errors.capacity}
                </div>
              )}
              <span
                style={{
                  display: 'block',
                  color: '#98A7B3',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  lineHeight: 1.35,
                  marginTop: '5px',
                }}
              >
                Standard full-time is 40.0h
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  color: '#667785',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: '7px',
                }}
              >
                Recurring Meeting Overhead
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={recurringOverhead}
                  min="0"
                  max="20"
                  onChange={(e) => setRecurringOverhead(e.target.value)}
                  className="w-full outline-none"
                  style={{
                    minHeight: '44px',
                    padding: '0 34px 0 14px',
                    borderRadius: '10px',
                    border: '1px solid #EBE7E0',
                    background: '#ffffff',
                    fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#623C87',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                    fontSize: '12px',
                    color: '#B08BD2',
                    pointerEvents: 'none',
                  }}
                >
                  h
                </span>
              </div>
              <span
                style={{
                  display: 'block',
                  color: '#98A7B3',
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  fontSize: '10px',
                  lineHeight: 1.35,
                  marginTop: '5px',
                }}
              >
                Standups, planning, & syncs
              </span>
            </div>
          </div>

          {/* Row 5: Skills & Tech Stack */}
          <div style={{ paddingTop: '2px' }}>
            <label
              style={{
                display: 'block',
                color: '#667785',
                fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                lineHeight: 1.2,
                textTransform: 'uppercase',
                marginBottom: '7px',
              }}
            >
              Skills & Tech Stack Tags
            </label>
            <input
              type="text"
              placeholder="e.g. React, TypeScript, Node.js, AWS, PostgreSQL, GraphQL"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full outline-none transition-all"
              style={{
                minHeight: '44px',
                padding: '0 14px',
                borderRadius: '10px',
                border: '1px solid #EBE7E0',
                background: '#ffffff',
                fontFamily: "var(--font-inter), 'Inter', sans-serif",
                fontSize: '12px',
                color: '#201C17',
              }}
            />
            <span
              style={{
                display: 'block',
                color: '#98A7B3',
                fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                fontSize: '10px',
                marginTop: '5px',
              }}
            >
              Comma-separated tags for smart skill matching
            </span>
          </div>

          {/* Modal Footer */}
          <div
            className="flex items-center justify-between flex-shrink-0"
            style={{
              padding: '18px 28px 20px',
              margin: '12px -28px -22px -28px',
              background: '#FDFDFC',
              borderTop: '1px solid #F1EFEB',
            }}
          >
            <div
              style={{
                maxWidth: '230px',
                color: '#98A7B3',
                fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                fontSize: '10px',
                lineHeight: 1.35,
              }}
            >
              Auto-updates squad capacity and<br />manager metrics
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                style={{
                  minHeight: '42px',
                  padding: '0 18px',
                  borderRadius: '10px',
                  background: '#F1EFE9',
                  color: '#4A4239',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E4E0D8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#F1EFE9')}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  minHeight: '42px',
                  padding: '0 20px',
                  borderRadius: '10px',
                  background: '#285691',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 14px rgba(40, 86, 145, 0.22)',
                  transition: 'all 0.15s ease',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) e.currentTarget.style.background = '#1F4373';
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) e.currentTarget.style.background = '#285691';
                }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check text-xs"></i>
                    <span>Save Changes</span>
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
