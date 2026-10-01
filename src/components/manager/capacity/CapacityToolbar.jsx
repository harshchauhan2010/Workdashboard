'use client';

export default function CapacityToolbar({
  searchQuery = "",
  setSearchQuery,
  selectedSquad = "all",
  setSelectedSquad,
  squads = [],
  capacityFilter = "all",
  setCapacityFilter,
  viewMode = "table",
  setViewMode,
  onOpenAddDeveloper,
  onOpenCreateSquad,
  onOpenAssignTask,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
      {/* Left side: Search, Squad selector, Filter Pills */}
      <div className="flex items-center gap-3 flex-wrap flex-1 min-w-[300px]">
        {/* Search input */}
        <div className="relative flex-1 max-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <i className="fa-solid fa-magnifying-glass text-xs"></i>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search developers..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
          />
        </div>

        {/* Squad select */}
        <select
          value={selectedSquad}
          onChange={(e) => setSelectedSquad(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 cursor-pointer"
        >
          <option value="all">All Squads ({squads.length})</option>
          {squads.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Filter pills: All, Over, Free */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-sm border border-slate-200/60">
          <button
            type="button"
            onClick={() => setCapacityFilter("all")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              capacityFilter === "all"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setCapacityFilter("over")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              capacityFilter === "over"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-rose-600/80 hover:text-rose-700 hover:bg-white/50"
            }`}
          >
            Over
          </button>
          <button
            type="button"
            onClick={() => setCapacityFilter("avail")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              capacityFilter === "avail"
                ? "bg-white text-emerald-600 shadow-xs"
                : "text-emerald-600/80 hover:text-emerald-700 hover:bg-white/50"
            }`}
          >
            Free
          </button>
        </div>
      </div>

      {/* Right side: View mode toggle & Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* View toggle (Table vs Cards) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/60">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`p-1.5 px-3 rounded-md text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-blue-600 font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <i className="fa-solid fa-list text-xs"></i>
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 px-3 rounded-md text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white text-blue-600 font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <i className="fa-solid fa-grip text-xs"></i>
            <span>Cards</span>
          </button>
        </div>

        {/* Action: Add Developer */}
        <button
          type="button"
          onClick={onOpenAddDeveloper}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-user-plus text-xs"></i>
          <span>+ Add Developer</span>
        </button>

        {/* Action: Create Team */}
        <button
          type="button"
          onClick={onOpenCreateSquad}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-users-gear text-xs text-indigo-300"></i>
          <span>+ Create Team</span>
        </button>

        {/* Action: Assign Task */}
        <button
          type="button"
          onClick={() => onOpenAssignTask(null)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-sm font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span>Assign Task</span>
        </button>
      </div>
    </div>
  );
}
