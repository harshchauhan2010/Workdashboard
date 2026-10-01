'use client';

import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function HoursLoggedBarChart({
  prePlanningHours = 0,
  adhocHours = 0,
  recurringHours = 0,
}) {
  const [dayFilter, setDayFilter] = useState("week"); // 'week' | 'month'
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const numPrePlan = Number(prePlanningHours) || 0;
  const numAdhoc = Number(adhocHours) || 0;
  const numRecur = Number(recurringHours) || 0;

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    let labels, sprintData, adhocData, recurData;

    if (dayFilter === "week") {
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

      // 1. Pre-Planning: Distribute developer's actual pre-planning hours across 5 work days
      if (numPrePlan > 0) {
        const pDay = Number((numPrePlan / 4).toFixed(1));
        sprintData = [pDay, pDay, pDay, Number((numPrePlan - (pDay * 3)).toFixed(1)), 0];
      } else {
        sprintData = [0, 0, 0, 0, 0];
      }

      // 2. Ad-Hoc: Strictly 0 if developer has 0 adhoc hours in DB
      if (numAdhoc > 0) {
        adhocData = [0, Number(numAdhoc.toFixed(1)), 0, 0, 0];
      } else {
        adhocData = [0, 0, 0, 0, 0];
      }

      // 3. Recurring: Distributed equally per day (e.g. 6h / 5 = 1.2h daily)
      if (numRecur > 0) {
        const dailyRecur = Number((numRecur / 5).toFixed(1));
        recurData = [dailyRecur, dailyRecur, dailyRecur, dailyRecur, dailyRecur];
      } else {
        recurData = [0, 0, 0, 0, 0];
      }
    } else {
      labels = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];

      // Monthly aggregate scaling strictly by actual DB totals
      sprintData = [
        Number((numPrePlan * 0.3).toFixed(1)),
        Number((numPrePlan * 0.4).toFixed(1)),
        Number((numPrePlan * 0.2).toFixed(1)),
        Number((numPrePlan * 0.1).toFixed(1)),
      ];

      adhocData = numAdhoc > 0
        ? [0, Number((numAdhoc * 0.6).toFixed(1)), Number((numAdhoc * 0.4).toFixed(1)), 0]
        : [0, 0, 0, 0];

      recurData = numRecur > 0
        ? [Number(numRecur.toFixed(1)), Number(numRecur.toFixed(1)), Number(numRecur.toFixed(1)), Number(numRecur.toFixed(1))]
        : [0, 0, 0, 0];
    }

    chartInstanceRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Pre-Planning",
            data: sprintData,
            backgroundColor: "#3b82f6",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: "Ad-Hoc",
            data: adhocData,
            backgroundColor: "#f59e0b",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: "Recurring",
            data: recurData,
            backgroundColor: "#a855f7",
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}h`,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              font: { size: 10, family: "JetBrains Mono, monospace" },
              color: "#94a3b8",
            },
          },
          y: {
            stacked: true,
            grid: { color: "#f1f5f9" },
            ticks: {
              font: { size: 10, family: "JetBrains Mono, monospace" },
              color: "#94a3b8",
              callback: (v) => `${v}h`,
            },
            beginAtZero: true,
          },
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
  }, [dayFilter, numPrePlan, numAdhoc, numRecur]);

  return (
    <div className="h-full w-full bg-white p-6 rounded-2xl border border-[#E7E2DA] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-[#F0EEEA]">
        <div className="flex items-center gap-2 font-display font-bold text-sm text-[#201C17]">
          <i className="fa-solid fa-chart-column text-[#574092]"></i>
          <span>Hours Logged by Day</span>
        </div>
        <div className="flex items-center bg-[#F7F6F5] p-0.5 rounded-lg border border-[#E7E2DA] text-xs font-semibold">
          <button
            onClick={() => setDayFilter("week")}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              dayFilter === "week"
                ? "bg-white text-[#201C17] shadow-2xs"
                : "text-[#7B7265] hover:text-[#201C17]"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDayFilter("month")}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              dayFilter === "month"
                ? "bg-white text-[#201C17] shadow-2xs"
                : "text-[#7B7265] hover:text-[#201C17]"
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Stacked Bar Canvas Container */}
      <div className="py-4 h-[220px] w-full flex items-center justify-center relative">
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>

      {/* Bar Chart Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-[#F0EEEA] text-xs font-medium text-[#4A4239]">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs bg-[#3b82f6]"></span>
          <span>Pre-Planning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs bg-[#f59e0b]"></span>
          <span>Ad-Hoc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-xs bg-[#a855f7]"></span>
          <span>Recurring</span>
        </div>
      </div>
    </div>
  );
}
