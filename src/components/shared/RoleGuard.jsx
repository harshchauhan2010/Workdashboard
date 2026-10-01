'use client';

import { useApp } from "@/context/AppContext";

/**
 * RoleGuard Component
 * Conditionally renders children strictly matching the user's system_role ('MANAGER' or 'DEVELOPER').
 */
export function RoleGuard({ allowedRoles = ["MANAGER"], fallback = null, children }) {
  const { currentUser, isLoading } = useApp();

  if (isLoading) {
    return null;
  }

  if (!currentUser || !allowedRoles.includes(currentUser.system_role)) {
    return fallback;
  }

  return <>{children}</>;
}

export default RoleGuard;
