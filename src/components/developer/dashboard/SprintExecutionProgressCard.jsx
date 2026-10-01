'use client';

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function SprintExecutionProgressCard({ tasks = [] }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const done = tasks.filter((t) => t.status === "COMPLETED").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const rem = Math.max(0, total - done);
  const hoursLeft = tasks
    .filter((t) => t.status !== "COMPLETED")
    .reduce(
      (s, t) =>
        s +
        Math.max(
          0,
          (Number(t.estimated_hours) || 0) - (Number(t.logged_hours) || 0)
        ),
      0
    );

  const sprintTasks = tasks.filter(
    (t) =>
      t.task_type === "PRE_PLANNING" ||
      t.task_type === "PLANNED" ||
      t.task_type === "PROJECT_SPRINT"
  );
  const sprintDone = sprintTasks.filter((t) => t.status === "COMPLETED").length;

  const adhocTasks = tasks.filter(
    (t) =>
      t.task_type === "ADHOC" ||
      t.task_type === "UNPLANNED" ||
      t.task_type === "AD_HOC_EMERGENCY"
  );
  const adhocDone = adhocTasks.filter((t) => t.status === "COMPLETED").length;

  const recurTasks = tasks.filter(
    (t) => t.task_type === "RECURRING_ROUTINE" || t.task_type === "RECURRING"
  );
  const recurDone = recurTasks.filter((t) => t.status === "COMPLETED").length;

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const hasData = total > 0;
    const dataVals = hasData ? [done, rem] : [0, 1];
    const bgColors = hasData ? ["#10b981", "#f1f5f9"] : ["#cbd5e1", "#f1f5f9"];

    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: dataVals,
            backgroundColor: bgColors,
            borderWidth: 0,
            hoverOffset: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "76%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: { duration: 600 },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [done, rem, total]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-chart-pie text-blue-600"></i> Sprint Execution Progress
        </h3>
        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          {pct}% Delivered
        </span>
      </div>

      {/* Middle Gauge & Numbers */}
      <div className="flex items-center gap-5 pt-1">
        <div className="relative w-24 h-24 flex-shrink-0">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-slate-900 font-mono">
              {pct}%
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs flex-1 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Total tasks</span>
            <span className="font-bold text-slate-900">{total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Completed</span>
            <span className="font-bold text-emerald-600">{done}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Remaining</span>
            <span className="font-bold text-rose-600">{rem}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Hours to deliver</span>
            <span className="font-bold text-slate-900">{hoursLeft.toFixed(1)}h</span>
          </div>
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Pre-Planning
          </span>
          <span className="font-bold text-slate-700">
            {sprintDone} / {sprintTasks.length} ({sprintTasks.length ? Math.round((sprintDone / sprintTasks.length) * 100) : 0}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Ad-Hoc
          </span>
          <span className="font-bold text-slate-700">
            {adhocDone} / {adhocTasks.length} ({adhocTasks.length ? Math.round((adhocDone / adhocTasks.length) * 100) : 0}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> Recurring
          </span>
          <span className="font-bold text-slate-700">
            {recurDone} / {recurTasks.length} ({recurTasks.length ? Math.round((recurDone / recurTasks.length) * 100) : 0}%)
          </span>
        </div>
      </div>
    </div>
  );
}
