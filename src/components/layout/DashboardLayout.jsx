'use client';

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Navbar from "./Navbar";
import ManagerSidebar from "./ManagerSidebar";
import DeveloperSidebar from "./DeveloperSidebar";
import CommandPaletteModal from "../search/CommandPaletteModal";

function pathToTab(pathname, isMgr) {
  const clean = (pathname || "").replace(/^\/+/, "").toLowerCase();
  if (!clean || clean === "overview") return isMgr ? "capacity" : "overview";
  if (clean === "tasks" || clean === "task") return "tasks";
  if (clean === "analytics") return "analytics";
  if (clean === "logs" || clean === "work-logs" || clean === "deadlines") return "logs";
  if (clean === "capacity") return "capacity";
  if (clean === "squads" || clean === "teams") return "squads";
  if (clean === "engineer-360" || clean === "engineer_360") return "engineer_360";
  if (clean === "schedule") return "schedule";
  if (clean === "projects") return "projects";
  if (clean === "blockers") return "blockers";
  if (clean === "templates") return "templates";
  return isMgr ? "capacity" : "overview";
}

function tabToPath(tab) {
  if (tab === "overview") return "/overview";
  if (tab === "tasks") return "/tasks";
  if (tab === "analytics") return "/analytics";
  if (tab === "logs") return "/logs";
  if (tab === "capacity") return "/capacity";
  if (tab === "squads") return "/squads";
  if (tab === "engineer_360") return "/engineer-360";
  if (tab === "schedule") return "/schedule";
  if (tab === "projects") return "/projects";
  if (tab === "blockers") return "/blockers";
  if (tab === "templates") return "/templates";
  return `/${tab}`;
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isManager, isLoading } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeTab = pathToTab(pathname, isManager);

  const handleTabChange = useCallback((newTab) => {
    const targetPath = tabToPath(newTab);
    router.push(targetPath);
  }, [router]);

  // Enforce role-based views:
  // Managers never see the developer overview page; redirect to /capacity.
  // Developers never see manager capacity heatmap; redirect to /overview.
  useEffect(() => {
    if (isLoading) return;
    if (isManager && (pathname === "/" || pathname === "/overview")) {
      router.replace("/capacity");
    } else if (!isManager && (pathname === "/" || pathname === "/capacity")) {
      router.replace("/overview");
    }
  }, [isLoading, isManager, pathname, router]);

  // Global Ctrl+K / ⌘K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-blue-700 flex items-center justify-center text-white text-lg animate-pulse shadow-md">
            <i className="fa-solid fa-layer-group"></i>
          </div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase animate-pulse">
            Synchronizing WorkDashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Navbar */}
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Main Container: Dynamic Sidebar + Content Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dynamic Sidebar based on role */}
        {isManager ? (
          <ManagerSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onSearchClick={() => setIsSearchOpen(true)}
          />
        ) : (
          <DeveloperSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onSearchClick={() => setIsSearchOpen(true)}
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="w-full max-w-[1400px] mx-auto p-6 space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Live Backend-Integrated Command Palette & Search Modal */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab) => handleTabChange(tab)}
      />
    </div>
  );
}
