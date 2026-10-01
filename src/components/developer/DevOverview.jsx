'use client';

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/api-client";

// Modular Sub-Components
import DevProfileCard from "./DevProfileCard";
import CapacityLoadSection from "./CapacityLoadSection";
import DevKpiCards from "./DevKpiCards";
import TaskBreakdownChart from "./TaskBreakdownChart";
import HoursLoggedBarChart from "./HoursLoggedBarChart";
import AssignedTasksBoard from "./tasks/AssignedTasksBoard";
import DevBottomAnalyticsDeck from "./dashboard/DevBottomAnalyticsDeck";

export default function DevOverview({ activeSection = "overview" }) {
  const { currentUser, currentPeriod, userSquad, userCapacity } = useApp();
  const { user: clerkUser } = useUser();

  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // Fetch real database tasks for the logged-in developer with backend date filter
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleRefreshTasks = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    let isMounted = true;

    async function fetchTasks() {
      try {
        const queryParams = new URLSearchParams();
        if (currentUser?.id) {
          queryParams.set("assigned_user_id", currentUser.id);
        }
        if (selectedDate) {
          queryParams.set("date", selectedDate);
        }

        const endpoint = `/api/tasks?${queryParams.toString()}`;
        const tasksRes = await api.get(endpoint);
        if (isMounted) {
          const list = Array.isArray(tasksRes.data?.data)
            ? tasksRes.data.data
            : Array.isArray(tasksRes.data)
            ? tasksRes.data
            : [];
          setTasks(list);
        }
      } catch (err) {
        console.warn("Could not load developer tasks:", err?.message || err);
      }
    }

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, [currentUser, currentPeriod, selectedDate, refreshTrigger]);

  // Smooth scroll to active section on tab change matching reference behavior
  useEffect(() => {
    if (!activeSection) return;
    const sectionMap = {
      overview: "dev-section-overview",
      analytics: "dev-section-analytics",
      tasks: "dev-section-tasks",
      logs: "dev-section-logs",
    };
    const targetId = sectionMap[activeSection] || activeSection;
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSection]);

  // Derive Developer Identity strictly from logged in user
  const devName =
    currentUser?.full_name || clerkUser?.fullName || clerkUser?.firstName || "Developer";
  const devRole = currentUser?.role_title || "Software Engineer";
  const initials =
    devName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "ME";

  // Derive Squad Information
  const squadName = userSquad?.name?.split(" (")?.[0] || userCapacity?.squad_name || "Squad Alpha";

  // Derive Capacity Metrics directly from /api/capacity/me or currentUser
  const weeklyCapacity =
    Number(userCapacity?.weekly_capacity_hours) ||
    Number(currentUser?.weekly_capacity_hours) ||
    40.0;
  const recurringHours =
    Number(userCapacity?.recurring_hours) ||
    Number(currentUser?.recurring_overhead_hours) ||
    6.0;
  const prePlanningHours = Number(userCapacity?.pre_planning_hours) || 0.0;
  const adhocHours = Number(userCapacity?.adhoc_hours) || 0.0;

  // Compute Task KPIs accurately from real DB task records
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;

  const totalEstimatedHours =
    tasks.reduce((sum, t) => sum + (Number(t.estimated_hours) || 0), 0) || prePlanningHours;
  const loggedHours =
    tasks
      .filter((t) => t.status === "COMPLETED" || t.status === "IN_PROGRESS")
      .reduce((sum, t) => sum + (Number(t.logged_hours) || Number(t.estimated_hours) || 0), 0) ||
    prePlanningHours;

  const overdueCount = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "COMPLETED"
  ).length;

  // Task Categorization for Donut Chart
  const prePlanTasks = tasks.filter(
    (t) => t.task_type === "PRE_PLANNING" || t.task_type === "PLANNED"
  );
  const adhocTasks = tasks.filter(
    (t) => t.task_type === "ADHOC" || t.task_type === "UNPLANNED"
  );
  const recurringTasks = tasks.filter(
    (t) => t.task_type === "RECURRING_ROUTINE" || t.task_type === "RECURRING"
  );

  return (
    <div className="space-y-6 animate-fade-in text-[#201C17]">
      {/* 1. Header Profile & 4 KPI Stat Cards Section (dev-section-overview) */}
      <div id="dev-section-overview" className="space-y-6 scroll-mt-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E7E2DA] shadow-xs space-y-5">
          <DevProfileCard
            devName={devName}
            devRole={devRole}
            initials={initials}
            squadName={squadName}
            weeklyCapacity={weeklyCapacity}
            tasks={tasks}
            onRefreshData={handleRefreshTasks}
          />

          {/* 2. Weekly Capacity Load Progress Bar */}
          <CapacityLoadSection
            weeklyCapacity={weeklyCapacity}
            recurringHours={recurringHours}
            prePlanningHours={prePlanningHours}
            adhocHours={adhocHours}
          />
        </div>

        {/* 3. 4 KPI Stat Cards */}
        <DevKpiCards
          totalTasks={totalTasksCount}
          completedTasks={completedTasksCount}
          loggedHours={loggedHours}
          estimatedHours={totalEstimatedHours}
          overdueTasks={overdueCount}
        />
      </div>

      {/* 4. Visual Analytics Section (dev-section-analytics) */}
      <div id="dev-section-analytics" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch scroll-mt-6">
        <div className="lg:col-span-5 flex flex-col">
          <TaskBreakdownChart
            prePlanTasks={prePlanTasks}
            adhocTasks={adhocTasks}
            recurringTasks={recurringTasks}
            prePlanningHours={prePlanningHours}
            adhocHours={adhocHours}
            recurringHours={recurringHours}
          />
        </div>

        <div className="lg:col-span-7 flex flex-col">
          <HoursLoggedBarChart
            prePlanningHours={prePlanningHours}
            adhocHours={adhocHours}
            recurringHours={recurringHours}
          />
        </div>
      </div>

      {/* 5. Assigned Tasks & Workflow Board (dev-section-tasks) */}
      <div id="dev-section-tasks" className="scroll-mt-6">
        <AssignedTasksBoard
          tasks={tasks}
          searchDate={selectedDate}
          onSearchDateChange={setSelectedDate}
          onRefreshTasks={handleRefreshTasks}
        />
      </div>

      {/* 6. Bottom Analytics & Log Stream Deck (dev-section-logs) */}
      <div id="dev-section-logs" className="scroll-mt-6">
        <DevBottomAnalyticsDeck
          tasks={tasks}
          recurringHours={recurringHours}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
}
