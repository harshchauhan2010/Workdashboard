'use client';

import { ToastProvider } from "@/context/ToastContext";
import { AppProvider } from "@/context/AppContext";
import { TimerProvider } from "@/context/TimerContext";

export function Providers({ children }) {
  return (
    <ToastProvider>
      <AppProvider>
        <TimerProvider>
          {children}
        </TimerProvider>
      </AppProvider>
    </ToastProvider>
  );
}

export default Providers;
