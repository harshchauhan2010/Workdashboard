export default function Loading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F6F5] relative overflow-hidden bg-grid-pattern">
      {/* Top progress line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#EEF3FB] z-50 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#285691] to-[#3F8258] w-full animate-shimmer" />
      </div>

      {/* Brand Spinner */}
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#E7E2DA] card-shadow flex items-center justify-center shadow-md">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#285691] to-[#1F4373] flex items-center justify-center animate-pulse">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-[#285691]/30 animate-ping pointer-events-none" />
        </div>

        <div className="text-center space-y-1">
          <p className="font-display font-bold text-sm text-[#201C17] tracking-tight">WorkDashboard</p>
          <p className="text-xs text-[#7B7265] font-mono">Loading workspace...</p>
        </div>
      </div>
    </div>
  );
}
