'use client';

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function TaskBreakdownChart({
  prePlanTasks = [],
  adhocTasks = [],
  recurringTasks = [],
  prePlanningHours = 0,
  adhocHours = 0,
  recurringHours = 0,
}) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const prePlanCount = prePlanTasks.length;
  const adhocCount = adhocTasks.length;
  const recurCount = recurringTasks.length;
  const totalCount = prePlanCount + adhocCount + recurCount;

  const prePlanHoursSum =
    prePlanTasks.reduce((s, t) => s + (Number(t.estimated_hours) || 0), 0) || prePlanningHours;
  const adhocHoursSum =
    adhocTasks.reduce((s, t) => s + (Number(t.estimated_hours) || 0), 0) || adhocHours;
  const recurringHoursSum =
    recurringTasks.reduce((s, t) => s + (Number(t.estimated_hours) || 0), 0) || recurringHours;

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const hasData = totalCount > 0;
    const dataVals = hasData ? [prePlanCount, adhocCount, recurCount] : [1, 0, 0];
    const bgColors = ["#3b82f6", "#f59e0b", "#a855f7"];

    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Pre-Planning", "Ad-Hoc Emergency", "Recurring"],
        datasets: [
          {
            data: dataVals,
            backgroundColor: bgColors,
            borderWidth: 0,
            hoverOffset: 4,
            spacing: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} task${ctx.raw !== 1 ? "s" : ""}`,
            },
          },
        },
        animation: { duration: 600, easing: "easeInOutQuart" },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [prePlanCount, adhocCount, recurCount, totalCount]);

  return (
    <div className="h-full w-full bg-white p-6 rounded-2xl border border-[#E7E2DA] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-[#F0EEEA]">
        <div className="flex items-center gap-2 font-display font-bold text-sm text-[#201C17]">
          <i className="fa-solid fa-chart-pie text-[#285691]"></i>
          <span>Task Breakdown</span>
        </div>
        <span className="text-xs font-semibold bg-[#F7F6F5] border border-[#E7E2DA] px-2.5 py-1 rounded-lg text-[#7B7265]">
          This Week
        </span>
      </div>

      {/* Donut Canvas Container with Absolute Center Label */}
      <div className="py-4 h-[220px] w-full flex items-center justify-center relative">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
          <div className="absolute text-center pointer-events-none">
            <div className="text-2xl font-display font-extrabold text-[#201C17] leading-none">
              {totalCount}
            </div>
            <div className="text-[10px] uppercase font-bold text-[#7B7265] tracking-widest mt-1">
              TASKS
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Legend */}
      <div className="space-y-2.5 pt-4 border-t border-[#F0EEEA] text-xs font-medium">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]"></span>
            <span className="text-[#4A4239]">Pre-Planning</span>
          </div>
          <span className="font-mono font-semibold text-[#201C17]">
            {prePlanCount} · {Number(prePlanHoursSum).toFixed(0)}h
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]"></span>
            <span className="text-[#4A4239]">Ad-Hoc Emergency</span>
          </div>
          <span className="font-mono font-semibold text-[#201C17]">
            {adhocCount} · {Number(adhocHoursSum).toFixed(0)}h
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#a855f7]"></span>
            <span className="text-[#4A4239]">Recurring</span>
          </div>
          <span className="font-mono font-semibold text-[#201C17]">
            {recurCount} · {Number(recurringHoursSum).toFixed(0)}h
          </span>
        </div>
      </div>
    </div>
  );
}
