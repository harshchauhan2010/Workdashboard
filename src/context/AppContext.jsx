'use client';

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import api from "@/lib/api-client";
import { useToast } from "./ToastContext";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const { showError } = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [allPeriods, setAllPeriods] = useState([]);
  const [userSquad, setUserSquad] = useState(null);
  const [userCapacity, setUserCapacity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Database Profile for authenticated user
  const fetchUserProfile = useCallback(async () => {
    if (!isSignedIn) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get("/api/auth/me");
      const userData = res.data?.data || res.data?.user || res.data;
      if (userData && typeof userData === "object") {
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error("[AppContext] Failed to fetch database profile:", err);
      showError("Could not synchronize user database profile");
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, showError]);

  // Fetch all planning periods (Sprints)
  const fetchPlanningPeriods = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const res = await api.get("/api/planning-periods");
      const rawData = res.data;
      const periods = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData?.periods)
        ? rawData.periods
        : [];

      if (Array.isArray(periods) && periods.length > 0) {
        setAllPeriods(periods);
        const active = periods.find((p) => p.is_current) || periods[0] || null;
        setCurrentPeriod(active);
      }
    } catch (err) {
      console.error("[AppContext] Failed to load planning periods:", err);
    }
  }, [isSignedIn]);

  // Fetch Developer Squad & Capacity info from database
  const fetchUserSquadAndCapacity = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const [squadsRes, capRes] = await Promise.allSettled([
        api.get("/api/squads"),
        api.get("/api/capacity/me"),
      ]);

      if (capRes.status === "fulfilled" && capRes.value?.data?.data) {
        setUserCapacity(capRes.value.data.data);
      } else if (capRes.status === "fulfilled" && capRes.value?.data) {
        setUserCapacity(capRes.value.data);
      }

      if (squadsRes.status === "fulfilled") {
        const raw = squadsRes.value?.data;
        const squadList = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : [];

        if (squadList.length > 0) {
          // Default to user's assigned squad or first active squad
          setUserSquad(squadList[0]);
        }
      }
    } catch (err) {
      console.error("[AppContext] Failed to load user squad/capacity:", err);
    }
  }, [isSignedIn]);

  useEffect(() => {
    let isMounted = true;
    if (isClerkLoaded) {
      const loadInitialData = async () => {
        if (!isMounted) return;
        await Promise.all([
          fetchUserProfile(),
          fetchPlanningPeriods(),
          fetchUserSquadAndCapacity(),
        ]);
      };
      loadInitialData();
    }
    return () => {
      isMounted = false;
    };
  }, [isClerkLoaded, fetchUserProfile, fetchPlanningPeriods, fetchUserSquadAndCapacity]);

  const isManager = currentUser?.system_role === "MANAGER";
  const isDeveloper = currentUser?.system_role === "DEVELOPER";

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentPeriod,
        allPeriods,
        userSquad,
        userCapacity,
        isManager,
        isDeveloper,
        isLoading: !isClerkLoaded || isLoading,
        setCurrentPeriod,
        refreshUser: fetchUserProfile,
        refreshPeriods: fetchPlanningPeriods,
        refreshSquad: fetchUserSquadAndCapacity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
