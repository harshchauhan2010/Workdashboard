'use client';

import { useState } from "react";
import api from "@/lib/api-client";
import { useToast } from "@/context/ToastContext";
import KanbanColumn from "./KanbanColumn";
import TaskListView from "./TaskListView";
import TaskGridView from "./TaskGridView";
import LogHoursModal from "./LogHoursModal";
import TaskLogsDrawer from "./TaskLogsDrawer";

export default function AssignedTasksBoard({
  tasks = [],
  searchDate: controlledSearchDate,
  onSearchDateChange,
  onRefreshTasks,
}) {
  const { showSuccess, showError } = useToast();

  // View modes: 'board' | 'list' | 'grid'
  const [viewMode, setViewMode] = useState("board");

  // Category filter: 'ALL' | 'PRE_PLANNING' | 'AD_HOC_EMERGENCY' | 'IN_PROGRESS' | 'COMPLETED'
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Date search filter (controlled or local)
  const [localSearchDate, setLocalSearchDate] = useState("");
  const searchDate = controlledSearchDate !== undefined ? controlledSearchDate : localSearchDate;
  const handleDateChange = (val) => {
    if (onSearchDateChange) {
      onSearchDateChange(val);
    } else {
      setLocalSearchDate(val);
    }
  };

  // Eye toggle state: Set of task IDs that are expanded
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set());

  // Drag-and-drop state
  const [draggedTask, setDraggedTask] = useState(null);

  // Modal / Drawer state
  const [selectedTaskForLogModal, setSelectedTaskForLogModal] = useState(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toggle eye expansion for single task
  const handleToggleExpand = (taskId) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Open Sliding Logs Drawer
  const handleViewLogs = (task) => {
    setSelectedTaskForDrawer(task);
    setIsDrawerOpen(true);
  };

  // Open Log Hours Modal
  const handleLogTime = (task) => {
    setSelectedTaskForLogModal(task);
    setIsLogModalOpen(true);
  };

  // Deliverable tasks (excluding recurring routines which live in Recurring Schedule)
  const deliverableTasks = tasks.filter(
    (t) => t.task_type !== "RECURRING_ROUTINE" && t.task_type !== "RECURRING"
  );

  // Calculate dynamic counts for badges
  const countAll = deliverableTasks.length;
  const countSprint = deliverableTasks.filter(
    (t) => t.task_type === "PRE_PLANNING" || t.task_type === "PLANNED"
  ).length;
  const countAdhoc = deliverableTasks.filter(
    (t) => t.task_type === "AD_HOC_EMERGENCY" || t.task_type === "ADHOC"
  ).length;
  const countInProgress = deliverableTasks.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
  ).length;
  const countDone = deliverableTasks.filter((t) => t.status === "COMPLETED").length;

  // Filter tasks based on Category and Date
  const filteredTasks = deliverableTasks.filter((task) => {
    // 1. Category Filter
    if (categoryFilter === "PRE_PLANNING") {
      if (task.task_type !== "PRE_PLANNING" && task.task_type !== "PLANNED") return false;
    } else if (categoryFilter === "AD_HOC_EMERGENCY") {
      if (task.task_type !== "AD_HOC_EMERGENCY" && task.task_type !== "ADHOC") return false;
    } else if (categoryFilter === "IN_PROGRESS") {
      if (task.status !== "IN_PROGRESS" && task.status !== "IN_REVIEW") return false;
    } else if (categoryFilter === "COMPLETED") {
      if (task.status !== "COMPLETED") return false;
    }

    // 2. Date Filter
    if (searchDate) {
      if (!task.due_date && !task.created_at) return false;
      const targetDate = new Date(searchDate).toISOString().split("T")[0];
      const taskDueDate = task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : null;
      const taskCreatedDate = task.created_at ? new Date(task.created_at).toISOString().split("T")[0] : null;
      if (taskDueDate !== targetDate && taskCreatedDate !== targetDate) return false;
    }

    return true;
  });

  // Drag Handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData("text/plain", task.id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDropTask = async (targetStatus) => {
    if (!draggedTask) return;
    if (draggedTask.status === targetStatus) return;

    const previousStatus = draggedTask.status;
    const taskTitle = draggedTask.title;
    const taskId = draggedTask.id;

    // Optimistic UI update handled via onRefreshTasks
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: targetStatus });
      showSuccess(`✓ Moved "${taskTitle}" to ${targetStatus.replace("_", " ")}`);
      onRefreshTasks?.();
    } catch (err) {
      console.error("Failed to update task status:", err);
      showError(`Failed to update status: ${err.message}`);
      onRefreshTasks?.();
    } finally {
      setDraggedTask(null);
    }
  };

  // Group tasks into 4 kanban columns
  const todoTasks = filteredTasks.filter((t) => t.status === "TO_DO");
  const inProgTasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
  const pendingTasks = filteredTasks.filter((t) => t.status === "PENDING_REVIEW");
  const doneTasks = filteredTasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="bg-white rounded-3xl border border-[#E7E2DA] shadow-xs p-6 space-y-5">
      {/* ── 1. Top Header: Title, View Switcher & Date Search ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F0EEEA]">
        {/* Left: Icon, Title & View Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-2xl bg-[#EEF3FB] text-[#285691] flex items-center justify-center text-lg shadow-2xs flex-shrink-0">
            <i className="fa-solid fa-list-check"></i>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-[#201C17] leading-tight">
              Assigned Tasks
            </h3>
            <p className="text-xs text-[#7B7265] font-mono mt-0.5">
              Drag-and-drop workflow stages, active sprints, and task execution
            </p>
          </div>

          {/* View Mode Switcher (Board, List, Grid) */}
          <div className="bg-[#F7F6F5] p-1 rounded-xl flex items-center gap-1 border border-[#E7E2DA] ml-0 sm:ml-2">
            <button
              onClick={() => setViewMode("board")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "board"
                  ? "bg-white text-[#285691] shadow-2xs"
                  : "text-[#7B7265] hover:text-[#201C17]"
              }`}
            >
              <i className="fa-solid fa-table-columns text-xs"></i>
              <span>Board</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-[#285691] shadow-2xs"
                  : "text-[#7B7265] hover:text-[#201C17]"
              }`}
            >
              <i className="fa-solid fa-list-check text-xs"></i>
              <span>List</span>
            </button>

            <button
              onClick={() => setViewMode("grid")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#285691] shadow-2xs"
                  : "text-[#7B7265] hover:text-[#201C17]"
              }`}
            >
              <i className="fa-solid fa-grip text-xs"></i>
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Right: Date Search Input */}
        <div className="flex items-center gap-2 flex-wrap">
          <label
            htmlFor="dev-date-filter"
            className="text-xs font-bold text-[#4A4239] font-mono flex items-center gap-1.5 whitespace-nowrap"
          >
            <i className="fa-regular fa-calendar text-[#285691]"></i>
            <span>Search Date:</span>
          </label>
          <input
            id="dev-date-filter"
            type="date"
            value={searchDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-[#F7F6F5] border border-[#E7E2DA] rounded-xl px-3 py-1.5 text-xs text-[#201C17] font-mono outline-none focus:border-[#285691] focus:ring-2 focus:ring-[#285691]/20 transition-all cursor-pointer"
          />
          {searchDate && (
            <button
              onClick={() => handleDateChange("")}
              className="px-2.5 py-1.5 rounded-xl bg-[#F0EEEA] hover:bg-[#E7E2DA] text-[#4A4239] text-xs font-semibold border border-[#E7E2DA] transition-all whitespace-nowrap cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Filter Tabs & Recurring Sub-filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar flex-wrap">
          {/* All */}
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-[#EEF3FB] text-[#285691] font-bold border border-[#B6CFEC] shadow-2xs"
                : "bg-[#F7F6F5] text-[#7B7265] font-medium border border-[#E7E2DA] hover:bg-[#F0EEEA]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#285691]"></span>
            <span>All</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                categoryFilter === "ALL"
                  ? "bg-[#DCE7F6] text-[#285691]"
                  : "bg-[#E7E2DA] text-[#4A4239]"
              }`}
            >
              {countAll}
            </span>
          </button>

          {/* Pre-Planning */}
          <button
            onClick={() => setCategoryFilter("PRE_PLANNING")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              categoryFilter === "PRE_PLANNING"
                ? "bg-[#EEF3FB] text-[#285691] font-bold border border-[#B6CFEC] shadow-2xs"
                : "bg-[#F7F6F5] text-[#7B7265] font-medium border border-[#E7E2DA] hover:bg-[#F0EEEA]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#285691]"></span>
            <span>Pre-Planning</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                categoryFilter === "PRE_PLANNING"
                  ? "bg-[#DCE7F6] text-[#285691]"
                  : "bg-[#E7E2DA] text-[#4A4239]"
              }`}
            >
              {countSprint}
            </span>
          </button>

          {/* Ad-Hoc */}
          <button
            onClick={() => setCategoryFilter("AD_HOC_EMERGENCY")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              categoryFilter === "AD_HOC_EMERGENCY"
                ? "bg-[#FBF3E7] text-[#97621C] font-bold border border-[#EBC988] shadow-2xs"
                : "bg-[#F7F6F5] text-[#7B7265] font-medium border border-[#E7E2DA] hover:bg-[#F0EEEA]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#CE9339]"></span>
            <span>Ad-Hoc</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                categoryFilter === "AD_HOC_EMERGENCY"
                  ? "bg-[#F5E4C4] text-[#97621C]"
                  : "bg-[#E7E2DA] text-[#4A4239]"
              }`}
            >
              {countAdhoc}
            </span>
          </button>

          {/* In Progress */}
          <button
            onClick={() => setCategoryFilter("IN_PROGRESS")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              categoryFilter === "IN_PROGRESS"
                ? "bg-[#EEF3FB] text-[#285691] font-bold border border-[#B6CFEC] shadow-2xs"
                : "bg-[#F7F6F5] text-[#7B7265] font-medium border border-[#E7E2DA] hover:bg-[#F0EEEA]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#3A6FB0]"></span>
            <span>In Progress</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                categoryFilter === "IN_PROGRESS"
                  ? "bg-[#DCE7F6] text-[#285691]"
                  : "bg-[#E7E2DA] text-[#4A4239]"
              }`}
            >
              {countInProgress}
            </span>
          </button>

          {/* Done */}
          <button
            onClick={() => setCategoryFilter("COMPLETED")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
              categoryFilter === "COMPLETED"
                ? "bg-[#EEF6F0] text-[#326A47] font-bold border border-[#B3D7BE] shadow-2xs"
                : "bg-[#F7F6F5] text-[#7B7265] font-medium border border-[#E7E2DA] hover:bg-[#F0EEEA]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#3F8258]"></span>
            <span>Done</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                categoryFilter === "COMPLETED"
                  ? "bg-[#D9EBDD] text-[#326A47]"
                  : "bg-[#E7E2DA] text-[#4A4239]"
              }`}
            >
              {countDone}
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. Content Viewport (Board / List / Grid) ── */}
      <div className="pt-2">
        {viewMode === "board" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {/* Column 1: TO DO */}
            <KanbanColumn
              title="To Do"
              statusKey="TO_DO"
              iconDot={<span className="w-2.5 h-2.5 rounded-full bg-[#A49A8B]"></span>}
              colorTheme={{
                border: "border-[#E7E2DA]",
                bg: "bg-[#F7F6F5]/60",
                divider: "border-[#E7E2DA]",
                badge: "bg-[#F0EEEA] text-[#4A4239]",
              }}
              tasks={todoTasks}
              expandedTaskIds={expandedTaskIds}
              onToggleExpand={handleToggleExpand}
              onLogTimeClick={handleLogTime}
              onViewLogsClick={handleViewLogs}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDropTask={handleDropTask}
            />

            {/* Column 2: IN PROGRESS */}
            <KanbanColumn
              title="In Progress"
              statusKey="IN_PROGRESS"
              iconDot={
                <span className="w-2.5 h-2.5 rounded-full bg-[#285691] animate-pulse"></span>
              }
              colorTheme={{
                border: "border-[#B6CFEC]",
                bg: "bg-[#EEF3FB]/40",
                divider: "border-[#B6CFEC]/60",
                badge: "bg-[#DCE7F6] text-[#285691]",
              }}
              tasks={inProgTasks}
              expandedTaskIds={expandedTaskIds}
              onToggleExpand={handleToggleExpand}
              onLogTimeClick={handleLogTime}
              onViewLogsClick={handleViewLogs}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDropTask={handleDropTask}
            />

            {/* Column 3: PENDING REVIEW */}
            <KanbanColumn
              title="Pending Review"
              statusKey="PENDING_REVIEW"
              iconDot={<span className="w-2.5 h-2.5 rounded-full bg-[#CE9339]"></span>}
              colorTheme={{
                border: "border-[#EBC988]",
                bg: "bg-[#FBF3E7]/40",
                divider: "border-[#EBC988]/60",
                badge: "bg-[#F5E4C4] text-[#97621C]",
              }}
              tasks={pendingTasks}
              expandedTaskIds={expandedTaskIds}
              onToggleExpand={handleToggleExpand}
              onLogTimeClick={handleLogTime}
              onViewLogsClick={handleViewLogs}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDropTask={handleDropTask}
            />

            {/* Column 4: COMPLETED */}
            <KanbanColumn
              title="Completed"
              statusKey="COMPLETED"
              iconDot={<span className="w-2.5 h-2.5 rounded-full bg-[#3F8258]"></span>}
              colorTheme={{
                border: "border-[#B3D7BE]",
                bg: "bg-[#EEF6F0]/40",
                divider: "border-[#B3D7BE]/60",
                badge: "bg-[#D9EBDD] text-[#326A47]",
              }}
              tasks={doneTasks}
              expandedTaskIds={expandedTaskIds}
              onToggleExpand={handleToggleExpand}
              onLogTimeClick={handleLogTime}
              onViewLogsClick={handleViewLogs}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDropTask={handleDropTask}
            />
          </div>
        ) : viewMode === "list" ? (
          <TaskListView
            tasks={filteredTasks}
            onLogTimeClick={handleLogTime}
            onViewLogsClick={handleViewLogs}
          />
        ) : (
          <TaskGridView
            tasks={filteredTasks}
            expandedTaskIds={expandedTaskIds}
            onToggleExpand={handleToggleExpand}
            onLogTimeClick={handleLogTime}
            onViewLogsClick={handleViewLogs}
          />
        )}
      </div>

      {/* ── 4. Log Hours Modal (1-Click Presets & Note Submission) ── */}
      <LogHoursModal
        task={selectedTaskForLogModal}
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onLogSaved={onRefreshTasks}
      />

      {/* ── 5. Sliding Task Work Logs Drawer ── */}
      <TaskLogsDrawer
        task={selectedTaskForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenLogModal={(task) => {
          setSelectedTaskForLogModal(task);
          setIsLogModalOpen(true);
        }}
      />
    </div>
  );
}
