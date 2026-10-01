'use client';

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback((msg, duration) => addToast(msg, "success", duration), [addToast]);
  const showError = useCallback((msg, duration) => addToast(msg, "error", duration || 5000), [addToast]);
  const showWarning = useCallback((msg, duration) => addToast(msg, "warning", duration), [addToast]);
  const showInfo = useCallback((msg, duration) => addToast(msg, "info", duration), [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo, removeToast }}>
      {children}

      {/* Floating Modern Toast Notifications Container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          // Strip legacy emoji prefixes from messages if present
          const cleanMessage =
            typeof toast.message === "string"
              ? toast.message.replace(/^[\u2705\u2713\u26A0\u2139\uFE0F\u274C\u26A1\u2705\s]+/, "").trim()
              : toast.message;

          let icon = <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />;
          let iconBg = "bg-blue-50 text-blue-600 border border-blue-100";
          let borderAccent = "border-slate-200/90";

          if (toast.type === "success") {
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
            iconBg = "bg-emerald-50 text-emerald-600 border border-emerald-100";
            borderAccent = "border-emerald-200/80";
          } else if (toast.type === "error") {
            icon = <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
            iconBg = "bg-rose-50 text-rose-600 border border-rose-100";
            borderAccent = "border-rose-200/80";
          } else if (toast.type === "warning") {
            icon = <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
            iconBg = "bg-amber-50 text-amber-600 border border-amber-100";
            borderAccent = "border-amber-200/80";
          }

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto w-full bg-white/95 backdrop-blur-md border ${borderAccent} rounded-2xl p-3.5 shadow-xl shadow-slate-900/5 flex items-start gap-3 transition-all animate-fade-in hover:shadow-2xl`}
            >
              {/* Lucide Icon Badge */}
              <div className={`p-1.5 rounded-xl ${iconBg} flex-shrink-0 mt-0.5`}>
                {icon}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="text-xs font-semibold text-slate-900 leading-snug break-words">
                  {cleanMessage}
                </div>
              </div>

              {/* Lucide Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                type="button"
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 -mr-1 -mt-1"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
