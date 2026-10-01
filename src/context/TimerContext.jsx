'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "@/lib/api-client";
import { useToast } from "./ToastContext";
import { useApp } from "./AppContext";

const TimerContext = createContext(null);

function formatSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function TimerProvider({ children }) {
  const { currentUser } = useApp();
  const { showSuccess, showError, showInfo } = useToast();

  const [activeTimer, setActiveTimer] = useState(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef(null);

  // Resume active timer from backend (Developers only)
  const fetchActiveTimer = useCallback(async () => {
    if (!currentUser || currentUser.system_role !== "DEVELOPER") {
      setActiveTimer(null);
      setSecondsElapsed(0);
      setIsRunning(false);
      return;
    }

    try {
      const res = await api.get("/api/timers/me");
      const timer = res.data?.data || res.data?.timer || res.data;
      if (timer && timer.id) {
        setActiveTimer({
          ...timer,
          taskId: timer.task_id,
          task_id: timer.task_id,
          taskTitle: timer.task_title,
          task_title: timer.task_title,
        });
        setSecondsElapsed(Number(timer.seconds_elapsed) || 0);
        setIsRunning(timer.is_running ?? true);
      } else {
        setActiveTimer(null);
        setSecondsElapsed(0);
        setIsRunning(false);
      }
    } catch (err) {
      // If 404 or no active timer, gracefully clear active timer without throw
      setActiveTimer(null);
      setSecondsElapsed(0);
      setIsRunning(false);
    }
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    const initTimer = async () => {
      if (!isMounted) return;
      await fetchActiveTimer();
    };
    initTimer();
    return () => {
      isMounted = false;
    };
  }, [fetchActiveTimer]);

  // Live Stopwatch Ticking Engine (1000ms Interval)
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Start new timer on a task
  const startTimer = useCallback(
    async (taskId, taskTitle = "Sprint Task") => {
      try {
        const UUID_REGEX =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (taskId && UUID_REGEX.test(taskId)) {
          const res = await api.post("/api/timers/start", { task_id: taskId });
          const timer = res.data?.data || res.data?.timer || res.data;
          setActiveTimer({
            ...timer,
            id: timer?.id,
            taskId,
            task_id: taskId,
            taskTitle: timer?.task_title || taskTitle,
            task_title: timer?.task_title || taskTitle,
          });
          setSecondsElapsed(Number(timer?.seconds_elapsed) || 0);
        } else {
          // Local stopwatch mode
          setActiveTimer({
            taskId: taskId || null,
            task_id: taskId || null,
            taskTitle,
            task_title: taskTitle,
          });
          setSecondsElapsed(0);
        }

        setIsRunning(true);
        showSuccess(`⏱️ Stopwatch started: ${taskTitle}`);
      } catch (err) {
        console.error("[TimerContext] Failed to start timer:", err);
        showError(err.message || "Failed to start stopwatch");
      }
    },
    [showSuccess, showError]
  );

  // Pause / Resume with database persistence
  const pauseTimer = useCallback(async () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    showInfo("⏸️ Timer paused");
    try {
      if (activeTimer && activeTimer.id) {
        await api.patch("/api/timers/pause", { seconds_elapsed: secondsElapsed });
      }
    } catch (err) {
      console.error("[TimerContext] Failed to sync pause to backend:", err);
    }
  }, [activeTimer, secondsElapsed, showInfo]);

  const resumeTimer = useCallback(async () => {
    setIsRunning(true);
    showInfo("▶️ Timer resumed");
    try {
      if (activeTimer && activeTimer.id) {
        await api.patch("/api/timers/resume", { seconds_elapsed: secondsElapsed });
      }
    } catch (err) {
      console.error("[TimerContext] Failed to sync resume to backend:", err);
    }
  }, [activeTimer, secondsElapsed, showInfo]);

  const togglePause = useCallback(() => {
    if (isRunning) {
      pauseTimer();
    } else {
      resumeTimer();
    }
  }, [isRunning, pauseTimer, resumeTimer]);

  // Stop Timer and Log Work directly into PostgreSQL workdash.work_logs
  const stopAndLog = useCallback(
    async (notes = "Work completed via active stopwatch") => {
      if (!activeTimer) return;

      // Stop interval immediately
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      try {
        const hoursLogged = Math.max(0.01, Number((secondsElapsed / 3600).toFixed(2)));
        const targetTaskId = activeTimer.task_id || activeTimer.taskId;
        const targetTitle = activeTimer.task_title || activeTimer.taskTitle || "Sprint Task";

        const res = await api.post("/api/timers/stop", {
          seconds_elapsed: secondsElapsed,
          task_id: targetTaskId,
          notes: notes || `Stopwatch session on task: ${targetTitle}`,
        });

        const loggedValue = res.data?.hours_logged || hoursLogged;
        showSuccess(`✅ Logged ${loggedValue}h to sprint work logs in database!`);
        setActiveTimer(null);
        setSecondsElapsed(0);
      } catch (err) {
        console.error("[TimerContext] Failed to stop and log timer:", err);
        showError(err.message || "Failed to save work log");
        throw err;
      }
    },
    [activeTimer, secondsElapsed, showSuccess, showError]
  );

  // Discard Timer
  const discardTimer = useCallback(async () => {
    if (!activeTimer) return;

    // Stop interval immediately
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      await api.delete("/api/timers/me");
    } catch (err) {
      // Ignore if already deleted
    }

    setActiveTimer(null);
    setSecondsElapsed(0);
    showInfo("🗑️ Stopwatch discarded without saving logs");
  }, [activeTimer, showInfo]);

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        secondsElapsed,
        elapsedTime: secondsElapsed,
        formattedTime: formatSeconds(secondsElapsed),
        isRunning,
        startTimer,
        pauseTimer,
        resumeTimer,
        togglePause,
        stopAndLog,
        discardTimer,
        refreshTimer: fetchActiveTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
