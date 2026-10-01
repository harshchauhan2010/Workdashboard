'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api-client';

const SQUAD_COLORS = [
  { id: 'indigo', name: 'Indigo', hex: '#4F46E5', bgClass: 'bg-[#4F46E5]' },
  { id: 'blue',   name: 'Blue',   hex: '#3B82F6', bgClass: 'bg-[#3B82F6]' },
  { id: 'purple', name: 'Purple', hex: '#8B5CF6', bgClass: 'bg-[#8B5CF6]' },
  { id: 'emerald',name: 'Emerald',hex: '#10B981', bgClass: 'bg-[#10B981]' },
  { id: 'amber',  name: 'Amber',  hex: '#D97706', bgClass: 'bg-[#D97706]' },
  { id: 'rose',   name: 'Rose',   hex: '#E11D48', bgClass: 'bg-[#E11D48]' },
  { id: 'cyan',   name: 'Cyan',   hex: '#0D9488', bgClass: 'bg-[#0D9488]' },
  { id: 'orange', name: 'Orange', hex: '#EA580C', bgClass: 'bg-[#EA580C]' },
];

function getInitials(name) {
  if (!name) return 'DEV';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function CreateSquadModal({
  isOpen,
  onClose,
  developers = [],
  onSuccess,
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <CreateSquadDialog
      onClose={onClose}
      developers={developers}
      onSuccess={onSuccess}
    />,
    document.body
  );
}

function CreateSquadDialog({ onClose, developers = [], onSuccess }) {
  const [squadName, setSquadName] = useState('');
  const [focusDomain, setFocusDomain] = useState('');
  const [leadUserId, setLeadUserId] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [selectedDevIds, setSelectedDevIds] = useState(new Set());
  const [memberSearch, setMemberSearch] = useState('');
  const [fetchedDevs, setFetchedDevs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  // Fetch developers if none provided by parent
  useEffect(() => {
    if (!developers || developers.length === 0) {
      api.get('/api/capacity/developers')
        .then((res) => {
          const list = res?.data?.data || res?.data;
          if (Array.isArray(list)) setFetchedDevs(list);
        })
        .catch((err) => console.warn('Could not load developers for CreateSquadDialog:', err));
    }
  }, [developers]);

  const devList = (developers && developers.length > 0) ? developers : fetchedDevs;

  function handleToggleDev(devId) {
    const updated = new Set(selectedDevIds);
    if (updated.has(devId)) {
      updated.delete(devId);
    } else {
      updated.add(devId);
    }
    setSelectedDevIds(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = squadName.trim();
    if (!trimmedName) {
      setError('Please provide a Team / Squad Name.');
      return;
    }
    if (!leadUserId) {
      setError('Please designate a Tech Lead for this squad.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const generatedBadge =
        trimmedName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '_')
          .substring(0, 16) || 'SQUAD';

      const focus = focusDomain.trim() || 'Core Engineering & Product Delivery';

      // Total capacity hours based on selected developers + lead
      const memberCount = Math.max(1, selectedDevIds.size + (selectedDevIds.has(leadUserId) ? 0 : 1));
      const budgetHours = memberCount * 40.0;

      // 1. Create squad in database
      const squadRes = await api.post('/api/squads', {
        name: trimmedName,
        badge_code: generatedBadge,
        focus_domain: focus,
        lead_user_id: leadUserId,
        budget_hours: budgetHours,
        health: 'HEALTHY',
      });

      const newSquad = squadRes?.data?.data || squadRes?.data;
      const squadId = newSquad?.id;

      // 2. Attach selected member developers
      if (squadId) {
        const membersToAttach = new Set(selectedDevIds);
        if (leadUserId) membersToAttach.add(leadUserId);

        const promises = Array.from(membersToAttach).map((devId) =>
          api.post(`/api/squads/${squadId}/members`, {
            user_id: devId,
            allocation_percentage: 100,
          }).catch((err) => console.warn(`Could not add dev ${devId}:`, err))
        );
        await Promise.allSettled(promises);
      }

      onSuccess?.(`🎉 "${trimmedName}" created successfully with ${selectedDevIds.size} engineers!`);
      onClose();
    } catch (err) {
      console.error('Failed to create squad:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to create squad');
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredDevs = devList.filter((d) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    const name = (d.full_name || d.developer_name || d.name || '').toLowerCase();
    const role = (d.role_title || d.role || '').toLowerCase();
    const squad = (d.squad_name || '').toLowerCase();
    return name.includes(q) || role.includes(q) || squad.includes(q);
  });

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
          width: 'min(700px, calc(100vw - 32px))',
          maxWidth: '700px',
          height: 'min(760px, calc(100vh - 32px))',
          minHeight: 'min(740px, calc(100vh - 40px))',
          maxHeight: 'min(760px, calc(100vh - 32px))',
          borderColor: 'rgba(231, 227, 218, 0.95)',
          boxShadow: '0 28px 80px rgba(32, 27, 23, 0.24)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="flex items-start justify-between flex-shrink-0 bg-white"
          style={{
            padding: '22px 26px 18px',
            borderBottom: '1px solid #F3F2F0',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                width: '40px',
                height: '40px',
                background: '#F7F7F6',
                color: '#428CC8',
                fontSize: '17px',
              }}
            >
              <i className="fa-solid fa-users"></i>
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
                Create Engineering Team / Squad
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
                Define team focus, designate Tech Lead, and allocate engineers.
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

        {/* Modal Body (Scrollable with exact generous height) */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-between"
          style={{
            padding: '22px 26px 20px',
            gap: '18px',
            background: '#ffffff',
            overflowX: 'hidden',
          }}
        >
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Team Name & Domain / Specialty */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            style={{
              paddingBottom: '18px',
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
                Team / Squad Name <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Squad F (AI & Data Science)"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                className="w-full outline-none transition-all"
                style={{
                  minHeight: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #EBE7E0',
                  background: '#ffffff',
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#201C17',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#85B4DB';
                  e.target.style.boxShadow = '0 0 0 4px rgba(40, 86, 145, 0.11)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#EBE7E0';
                  e.target.style.boxShadow = 'none';
                }}
              />
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
                Domain / Specialty
              </label>
              <input
                type="text"
                placeholder="e.g. LLM Ops, Machine Learning, Analytics"
                value={focusDomain}
                onChange={(e) => setFocusDomain(e.target.value)}
                className="w-full outline-none transition-all"
                style={{
                  minHeight: '44px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1px solid #EBE7E0',
                  background: '#FDFDFC',
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#201C17',
                }}
                onFocus={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#85B4DB';
                  e.target.style.boxShadow = '0 0 0 4px rgba(40, 86, 145, 0.11)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#FDFDFC';
                  e.target.style.borderColor = '#EBE7E0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Row 2: Tech Lead / Squad Lead & Squad Brand Color */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            style={{
              paddingBottom: '18px',
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
                Tech Lead / Squad Lead <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <select
                required
                value={leadUserId}
                onChange={(e) => setLeadUserId(e.target.value)}
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
                onFocus={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#85B4DB';
                  e.target.style.boxShadow = '0 0 0 4px rgba(40, 86, 145, 0.11)';
                }}
                onBlur={(e) => {
                  e.target.style.background = '#FDFDFC';
                  e.target.style.borderColor = '#EBE7E0';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Select a Tech Lead...</option>
                {devList.map((d) => {
                  const id = d.user_id || d.id;
                  const name = d.full_name || d.developer_name || d.name;
                  const role = d.role_title || d.role || 'Engineer';
                  return (
                    <option key={id} value={id}>
                      {name} ({role})
                    </option>
                  );
                })}
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
                Squad Brand Color
              </label>
              <div
                className="flex items-center gap-2.5 flex-wrap"
                style={{ minHeight: '44px' }}
              >
                {SQUAD_COLORS.map((c) => {
                  const isSelected = selectedColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      title={c.name}
                      style={{
                        width: '27px',
                        height: '27px',
                        borderRadius: '999px',
                        backgroundColor: c.hex,
                        border: '2px solid rgba(255, 255, 255, 0.95)',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.12)' : 'scale(1)',
                        boxShadow: isSelected
                          ? '0 0 0 3px #F2F0EC, 0 3px 8px rgba(40, 86, 145, 0.2)'
                          : '0 1px 3px rgba(32, 27, 23, 0.16)',
                        transition: 'transform 150ms ease, box-shadow 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'scale(1.12)';
                          e.currentTarget.style.boxShadow = '0 4px 10px rgba(32, 27, 23, 0.16)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(32, 27, 23, 0.16)';
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Allocate Engineers to this Team */}
          <div
            style={{
              padding: '16px',
              border: '1px solid #EFECE6',
              borderRadius: '16px',
              background: '#FAFAFA',
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
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
                Allocate Engineers to this Team
              </label>
              <span
                style={{
                  color: '#428CC8',
                  background: '#F7F7F6',
                  border: '1px solid #EFEBE5',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  padding: '3px 10px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedDevIds.size} selected ({selectedDevIds.size * 40}h weekly cap)
              </span>
            </div>

            {/* Filter Input */}
            <div className="relative">
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#98A7B3',
                  fontSize: '12px',
                  pointerEvents: 'none',
                }}
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <input
                type="text"
                placeholder="Filter engineers by name, role, or squad..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full outline-none transition-all"
                style={{
                  minHeight: '40px',
                  paddingLeft: '34px',
                  paddingRight: '12px',
                  borderRadius: '10px',
                  border: '1px solid #EBE7E0',
                  background: '#ffffff',
                  fontFamily: "var(--font-inter), 'Inter', sans-serif",
                  fontSize: '12px',
                  color: '#201C17',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#85B4DB';
                  e.target.style.boxShadow = '0 0 0 3px rgba(40, 86, 145, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#EBE7E0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Scrollable Engineer Checklist */}
            <div
              className="no-scrollbar"
              style={{
                maxHeight: '210px',
                overflowY: 'auto',
                marginTop: '10px',
                padding: '6px',
                border: '1px solid #EDEAE4',
                borderRadius: '12px',
                background: '#F8F8F7',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {filteredDevs.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#98A7B3',
                    fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                  }}
                >
                  No engineers matching query.
                </div>
              ) : (
                filteredDevs.map((d) => {
                  const devId = d.user_id || d.id;
                  const name = d.full_name || d.developer_name || d.name || 'Developer';
                  const role = d.role_title || d.role || 'Software Engineer';
                  const currentSquad = d.squad_name || 'Unassigned';
                  const isChecked = selectedDevIds.has(devId);
                  const initials = getInitials(name);

                  return (
                    <label
                      key={devId}
                      style={{
                        minHeight: '52px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${isChecked ? '#B2D0E9' : '#F0EDE7'}`,
                        background: isChecked ? '#FBFBFB' : '#ffffff',
                        boxShadow: isChecked ? '0 0 0 2px rgba(40, 86, 145, 0.08)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'border-color 150ms ease, box-shadow 150ms ease, background 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isChecked) {
                          e.currentTarget.style.borderColor = '#B9D4EB';
                          e.currentTarget.style.boxShadow = '0 3px 9px rgba(32, 27, 23, 0.06)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isChecked) {
                          e.currentTarget.style.borderColor = '#F0EDE7';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDev(devId)}
                          style={{
                            width: '16px',
                            height: '16px',
                            minHeight: '16px',
                            accentColor: '#428CC8',
                            cursor: 'pointer',
                          }}
                        />
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '999px',
                            background: '#F4F2F0',
                            color: '#475967',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                            fontSize: '11px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#201C17',
                              lineHeight: 1.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {name}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#667785',
                              fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px',
                            }}
                          >
                            {role}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          color: '#667785',
                          background: '#F5F5F4',
                          flexShrink: 0,
                          marginLeft: '8px',
                        }}
                      >
                        {currentSquad.replace(/\s\(.*\)/, '')}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className="flex items-center justify-between flex-shrink-0"
            style={{
              padding: '15px 26px 18px',
              margin: '12px -26px -20px -26px',
              background: '#FDFDFC',
              borderTop: '1px solid #F1EFEB',
            }}
          >
            <div
              className="flex items-center gap-1.5"
              style={{
                color: '#98A7B3',
                fontFamily: "var(--font-mono-local), 'JetBrains Mono', monospace",
                fontSize: '10px',
                lineHeight: 1.35,
              }}
            >
              <i className="fa-solid fa-circle-info" style={{ color: '#428CC8' }}></i>{' '}
              40.0h capacity / engineer / sprint
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
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#1F4373';
                    e.currentTarget.style.boxShadow = '0 8px 18px rgba(40, 86, 145, 0.28)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = '#285691';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(40, 86, 145, 0.22)';
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span>Creating Team...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check text-xs"></i>
                    <span>Create Team</span>
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
