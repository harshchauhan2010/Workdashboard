'use client';

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import api from "@/lib/api-client";
import TaskBreakdownChart from "./TaskBreakdownChart";
import HoursLoggedBarChart from "./HoursLoggedBarChart";

export default function DevAnalytics() {
  const { currentUser, userCapacity } = useApp();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let isMounted = true;
    async function fetchTasks() {
      try {
        const res = await api.get(`/api/tasks?assigned_user_id=${currentUser.id}`);
        if (isMounted) {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          setTasks(list);
        }
      } catch (err) {
        console.warn("Could not load developer analytics tasks:", err?.message || err);
      }
    }

    fetchTasks();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Derive Capacity Hours
  const recurringHours =
    Number(userCapacity?.recurring_hours) ||
    Number(currentUser?.recurring_overhead_hours) ||
    6.0;
  const prePlanningHours = Number(userCapacity?.pre_planning_hours) || 26.0;
  const adhocHours = Number(userCapacity?.adhoc_hours) || 8.0;

  const prePlanTasks = tasks.filter(
    (t) => t.task_type === "PRE_PLANNING" || t.task_type === "PLANNED" || t.task_type === "PROJECT_SPRINT"
  );
  const adhocTasks = tasks.filter(
    (t) => t.task_type === "ADHOC" || t.task_type === "UNPLANNED" || t.task_type === "AD_HOC_EMERGENCY"
  );
  const recurringTasks = tasks.filter(
    (t) => t.task_type === "RECURRING_ROUTINE" || t.task_type === "RECURRING"
  );

  return (
    <div className="space-y-6 animate-fade-in text-[#201C17]">
      {/* Visual Analytics Charts Deck (Only Charts) */}
      <div id="dev-section-analytics" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch scroll-mt-24">
        {/* Left: Task Breakdown Donut Chart */}
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

        {/* Right: Hours Logged by Day Stacked Bar Chart */}
        <div className="lg:col-span-7 flex flex-col">
          <HoursLoggedBarChart
            prePlanningHours={prePlanningHours}
            adhocHours={adhocHours}
            recurringHours={recurringHours}
          />
        </div>
      </div>
    </div>
  );
}
