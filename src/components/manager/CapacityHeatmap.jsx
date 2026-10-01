'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api-client';

import CapacityKPIs from './capacity/CapacityKPIs';
import CapacityToolbar from './capacity/CapacityToolbar';
import CapacityTable from './capacity/CapacityTable';
import CapacityCardGrid from './capacity/CapacityCardGrid';
import AddDeveloperModal from './capacity/AddDeveloperModal';
import CreateSquadModal from './capacity/CreateSquadModal';
import AssignTaskModal from './capacity/AssignTaskModal';
import DeveloperInspectorDrawer from './capacity/DeveloperInspectorDrawer';

export default function CapacityHeatmap() {
  const { currentPeriod } = useApp();
  const { showSuccess, showError } = useToast();

  const [developers, setDevelopers] = useState([]);
  const [squads, setSquads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSquad, setSelectedSquad] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all'); // 'all' | 'over' | 'avail'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modal Dialogs & Inspector State
  const [isAddDevOpen, setIsAddDevOpen] = useState(false);
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [assignTargetDev, setAssignTargetDev] = useState(null);
  const [inspectorDev, setInspectorDev] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Fetch real data from PostgreSQL backend on mount and period change
  useEffect(() => {
    let isMounted = true;

    async function fetchHeatmapData() {
      try {
        const [devsRes, squadsRes] = await Promise.allSettled([
          api.get('/api/capacity/developers'),
          api.get('/api/squads'),
        ]);

        if (!isMounted) return;

        if (devsRes.status === 'fulfilled') {
          const devList = devsRes.value?.data?.data || devsRes.value?.data;
          if (Array.isArray(devList)) {
            setDevelopers(devList);
          }
        }

        if (squadsRes.status === 'fulfilled') {
          const squadList = squadsRes.value?.data?.data || squadsRes.value?.data;
          if (Array.isArray(squadList)) {
            setSquads(squadList);
          }
        }
      } catch (err) {
        console.error('Failed to load capacity heatmap:', err);
        showError('Failed to load capacity metrics.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchHeatmapData();

    return () => {
      isMounted = false;
    };
  }, [currentPeriod, showError]);

  // Refetch data when actions complete
  const refreshData = useCallback(async () => {
    try {
      const [devsRes, squadsRes] = await Promise.allSettled([
        api.get('/api/capacity/developers'),
        api.get('/api/squads'),
      ]);

      if (devsRes.status === 'fulfilled') {
        const devList = devsRes.value?.data?.data || devsRes.value?.data;
        if (Array.isArray(devList)) setDevelopers(devList);
      }
      if (squadsRes.status === 'fulfilled') {
        const squadList = squadsRes.value?.data?.data || squadsRes.value?.data;
        if (Array.isArray(squadList)) setSquads(squadList);
      }
    } catch (err) {
      console.error('Error refreshing capacity data:', err);
    }
  }, []);

  // Handle open actions
  const handleOpenAssignTask = (dev = null) => {
    setAssignTargetDev(dev);
    setIsAssignTaskOpen(true);
  };

  const handleInspectDev = (dev) => {
    setInspectorDev(dev);
    setIsInspectorOpen(true);
  };

  // Listen for global custom events from Command Palette or Sidebar
  useEffect(() => {
    const handleGlobalInspect = (e) => {
      const dev = e.detail?.developer;
      if (dev) {
        setInspectorDev(dev);
        setIsInspectorOpen(true);
      }
    };
    const handleGlobalCreateSquad = () => {
      setIsCreateSquadOpen(true);
    };
    const handleGlobalAssignTask = (e) => {
      setAssignTargetDev(e.detail?.developer || null);
      setIsAssignTaskOpen(true);
    };
    const handleGlobalFilterSquad = (e) => {
      const squadId = e.detail?.squadId;
      if (squadId) {
        setSelectedSquad(squadId);
      }
    };

    window.addEventListener('workdash:inspect-dev', handleGlobalInspect);
    window.addEventListener('workdash:create-squad', handleGlobalCreateSquad);
    window.addEventListener('workdash:assign-task', handleGlobalAssignTask);
    window.addEventListener('workdash:filter-squad', handleGlobalFilterSquad);

    return () => {
      window.removeEventListener('workdash:inspect-dev', handleGlobalInspect);
      window.removeEventListener('workdash:create-squad', handleGlobalCreateSquad);
      window.removeEventListener('workdash:assign-task', handleGlobalAssignTask);
      window.removeEventListener('workdash:filter-squad', handleGlobalFilterSquad);
    };
  }, []);

  const handleActionSuccess = (msg) => {
    if (msg) showSuccess(msg);
    refreshData();
  };

  // Compute live KPIs dynamically from PostgreSQL data
  const totalDevs = developers.length;
  const overbookedDevs = developers.filter(
    (d) => d.is_overallocated || Number(d.total_load_hours) > Number(d.weekly_capacity_hours || 40)
  );
  const overbookedCount = overbookedDevs.length;

  const totalCapacityHours = developers.reduce(
    (acc, d) => acc + (Number(d.weekly_capacity_hours) || 40.0),
    0
  );
  const totalAllocatedHours = developers.reduce(
    (acc, d) => acc + (Number(d.total_load_hours) || 0.0),
    0
  );
  const overallUtilization =
    totalCapacityHours > 0
      ? ((totalAllocatedHours / totalCapacityHours) * 100).toFixed(1)
      : '0.0';

  const teamsOnTrackCount = squads.filter((s) => s.health !== 'CRITICAL').length;
  const totalTeamsCount = squads.length;

  // Filter developers based on user controls
  const filteredDevs = developers.filter((dev) => {
    // Search query match
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const nameMatch = dev.developer_name?.toLowerCase().includes(q);
      const roleMatch = dev.role_title?.toLowerCase().includes(q);
      const squadMatch = dev.squad_name?.toLowerCase().includes(q);
      if (!nameMatch && !roleMatch && !squadMatch) return false;
    }

    // Squad dropdown match
    if (selectedSquad !== 'all' && dev.squad_id !== selectedSquad) {
      return false;
    }

    // Capacity status filter match
    const cap = Number(dev.weekly_capacity_hours) || 40.0;
    const total = Number(dev.total_load_hours) || 0.0;
    const isOver = dev.is_overallocated || total > cap;
    const avail = Math.max(0, cap - total);

    if (capacityFilter === 'over') {
      return isOver;
    }
    if (capacityFilter === 'avail') {
      return !isOver && avail >= 8.0;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-[#201C17]">
      {/* 1. TOP KPI METRICS CARDS */}
      <CapacityKPIs
        totalDevs={totalDevs}
        squadsCount={squads.length}
        overallUtilization={overallUtilization}
        totalAllocatedHours={totalAllocatedHours}
        totalCapacityHours={totalCapacityHours}
        overbookedCount={overbookedCount}
        teamsOnTrackCount={teamsOnTrackCount}
        totalTeamsCount={totalTeamsCount}
      />

      {/* 2. SEARCH, SQUAD SELECTOR & TOOLBAR */}
      <CapacityToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSquad={selectedSquad}
        setSelectedSquad={setSelectedSquad}
        squads={squads}
        capacityFilter={capacityFilter}
        setCapacityFilter={setCapacityFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAddDeveloper={() => setIsAddDevOpen(true)}
        onOpenCreateSquad={() => setIsCreateSquadOpen(true)}
        onOpenAssignTask={handleOpenAssignTask}
      />

      {/* 3. ROSTER DATA DISPLAY (TABLE / CARDS) */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="inline-flex items-center gap-2.5 text-sm text-slate-500 font-medium">
            <i className="fa-solid fa-spinner fa-spin text-base text-blue-600"></i>
            <span>Loading live engineering capacity heatmap...</span>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <CapacityTable
          developers={filteredDevs}
          onInspectDev={handleInspectDev}
          onAssignTask={handleOpenAssignTask}
        />
      ) : (
        <CapacityCardGrid
          developers={filteredDevs}
          onInspectDev={handleInspectDev}
          onAssignTask={handleOpenAssignTask}
        />
      )}

      {/* 4. MODALS & SLIDE-OVER INSPECTOR */}
      <AddDeveloperModal
        isOpen={isAddDevOpen}
        onClose={() => setIsAddDevOpen(false)}
        developers={developers}
        squads={squads}
        onSuccess={handleActionSuccess}
      />

      <CreateSquadModal
        isOpen={isCreateSquadOpen}
        onClose={() => setIsCreateSquadOpen(false)}
        developers={developers}
        onSuccess={handleActionSuccess}
      />

      <AssignTaskModal
        key={assignTargetDev?.user_id || assignTargetDev?.id || 'new_task'}
        isOpen={isAssignTaskOpen}
        onClose={() => {
          setIsAssignTaskOpen(false);
          setAssignTargetDev(null);
        }}
        initialDev={assignTargetDev}
        developers={developers}
        squads={squads}
        onSuccess={handleActionSuccess}
      />

      <DeveloperInspectorDrawer
        key={inspectorDev?.user_id || inspectorDev?.id || 'none'}
        developer={inspectorDev}
        isOpen={isInspectorOpen}
        onClose={() => {
          setIsInspectorOpen(false);
          setInspectorDev(null);
        }}
        onAssignTask={handleOpenAssignTask}
      />
    </div>
  );
}
