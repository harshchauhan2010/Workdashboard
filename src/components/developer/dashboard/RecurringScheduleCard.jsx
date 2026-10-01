'use client';

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api-client";
import { useApp } from "@/context/AppContext";

export default function RecurringScheduleCard({
  recurringHours = 8.0,
  onOpenTaskDetails,
  refreshTrigger = 0,
}) {
  const { currentUser } = useApp();

  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFrequency, setActiveFrequency] = useState("daily"); // 'daily' | 'weekly' | 'monthly'

  const fetchRoutines = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const endpoint = currentUser?.id
        ? `/api/recurring-routines?userId=${currentUser.id}`
        : "/api/recurring-routines/me";
      const res = await api.get(endpoint);

      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      const valid = list.filter((r) => r && r.title && r.title.trim().length > 0);
      const seen = new Set();
      const unique = [];
      for (const r of valid) {
        const key = (r.title || "").trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(r);
        }
      }
      setRoutines(unique);
    } catch (err) {
      console.error("Error fetching recurring routines from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const endpoint = currentUser?.id
          ? `/api/recurring-routines?userId=${currentUser.id}`
          : "/api/recurring-routines/me";
        const res = await api.get(endpoint);
        if (!ignore) {
          const list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
          const valid = list.filter((r) => r && r.title && r.title.trim().length > 0);
          const seen = new Set();
          const unique = [];
          for (const r of valid) {
            const key = (r.title || "").trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(r);
            }
          }
          setRoutines(unique);
        }
      } catch (err) {
        console.error("Error fetching recurring routines from DB:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [currentUser, refreshTrigger]);

  // Filter routines strictly by active frequency tab
  const filteredRoutines = routines.filter((r) => {
    const freqUpper = (r.frequency || "").toUpperCase();
    return freqUpper === activeFrequency.toUpperCase();
  });

  // Calculate dynamic weekly allocated hours sum
  const totalAllocatedRecurringHours =
    routines.reduce((sum, r) => sum + (Number(r.allocated_hours) || 0), 0) || recurringHours;

  const getRoutineIcon = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("standup") || t.includes("daily") || t.includes("sync")) return "🌅";
    if (t.includes("pr review") || t.includes("review") || t.includes("mentor")) return "👁️";
    if (t.includes("planning") || t.includes("backlog")) return "📅";
    if (t.includes("architecture") || t.includes("api") || t.includes("system")) return "🏗️";
    if (t.includes("all-hands") || t.includes("meeting")) return "📊";
    if (t.includes("okr") || t.includes("review") || t.includes("retro")) return "🎯";
    return "⚡";
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <i className="fa-solid fa-repeat text-purple-500"></i> Recurring Schedule
        </h3>
        <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-mono">
          {Number(totalAllocatedRecurringHours).toFixed(1)}h/wk
        </span>
      </div>

      {/* Frequency Switcher Tabs */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setActiveFrequency("daily")}
          className={`flex-1 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
            activeFrequency === "daily"
              ? "font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
              : "font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setActiveFrequency("weekly")}
          className={`flex-1 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
            activeFrequency === "weekly"
              ? "font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
              : "font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setActiveFrequency("monthly")}
          className={`flex-1 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
            activeFrequency === "monthly"
              ? "font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
              : "font-medium text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Database Schedule Items List */}
      <div className="space-y-2 pt-0.5 max-h-[250px] overflow-y-auto pr-1">
        {loading && routines.length === 0 ? (
          <div className="text-sm text-slate-400 font-mono text-center py-6">
            Loading recurring schedule...
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="text-sm text-slate-400 font-mono text-center py-6">
            No recurring routines scheduled for this cadence.
          </div>
        ) : (
          filteredRoutines.map((item) => {
            const alloc = Number(item.allocated_hours) || 0.5;
            const icon = getRoutineIcon(item.title);

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl flex items-center justify-between gap-3 bg-slate-50/80 border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer group shadow-2xs"
                onClick={() => onOpenTaskDetails && onOpenTaskDetails(item)}
              >
                {/* Left: Routine Icon, Title, and Cadence Label */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xl flex-shrink-0 group-hover:scale-105 transition-transform">
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <i className="fa-regular fa-clock text-[9.5px] text-purple-400"></i>
                      <span>{item.schedule_label || "Scheduled"}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Allocation Badge */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-purple-700 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs">
                    {alloc}h
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
