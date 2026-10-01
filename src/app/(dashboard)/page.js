'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function DashboardRootPage() {
  const router = useRouter();
  const { isManager, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (isManager) {
        router.replace("/capacity");
      } else {
        router.replace("/overview");
      }
    }
  }, [isManager, isLoading, router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-blue-700 flex items-center justify-center text-white text-sm animate-pulse">
          <i className="fa-solid fa-layer-group"></i>
        </div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Redirecting to workspace...
        </p>
      </div>
    </div>
  );
}
