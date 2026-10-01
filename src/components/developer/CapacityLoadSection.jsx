'use client';

export default function CapacityLoadSection({
  weeklyCapacity = 40,
  recurringHours = 6,
  prePlanningHours = 0,
  adhocHours = 0,
}) {
  const totalLoadHours = Number(recurringHours) + Number(prePlanningHours) + Number(adhocHours);
  const freeHours = Math.max(0, Number(weeklyCapacity) - totalLoadHours);
  const utilizationPct = Math.round((totalLoadHours / Number(weeklyCapacity)) * 100);

  const recurringPct = Math.min(100, (Number(recurringHours) / Number(weeklyCapacity)) * 100);
  const prePlanningPct = Math.min(100, (Number(prePlanningHours) / Number(weeklyCapacity)) * 100);
  const adhocPct = Math.min(100, (Number(adhocHours) / Number(weeklyCapacity)) * 100);
  const freePct = Math.max(0, 100 - (recurringPct + prePlanningPct + adhocPct));

  return (
    <div className="pt-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase font-bold text-[#7B7265] tracking-wider">
          WEEKLY CAPACITY LOAD
        </div>
        <div className="text-xs font-mono font-semibold text-[#326A47] bg-[#EEF6F0] px-2.5 py-0.5 rounded-md border border-[#B3D7BE]">
          {freeHours.toFixed(1)}h free
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <div className="text-2xl font-display font-extrabold text-[#201C17] tracking-tight">
          {totalLoadHours.toFixed(1)}{' '}
          <span className="text-base font-normal text-[#7B7265]">/ {Number(weeklyCapacity).toFixed(1)}h</span>
        </div>
        <span className="text-xs font-mono font-bold bg-[#FBF3E7] text-[#97621C] border border-[#EBC988] px-2 py-0.5 rounded-md">
          {utilizationPct}%
        </span>
      </div>

      {/* Multi-segmented Colored Capacity Bar */}
      <div className="w-full bg-[#E7E2DA] rounded-full h-3.5 overflow-hidden flex shadow-inner">
        <div
          className="bg-[#6E54AF] h-full transition-all duration-500"
          style={{ width: `${recurringPct}%` }}
          title={`Recurring: ${Number(recurringHours).toFixed(1)}h`}
        ></div>
        <div
          className="bg-[#3A6FB0] h-full transition-all duration-500"
          style={{ width: `${prePlanningPct}%` }}
          title={`Pre-Planning: ${Number(prePlanningHours).toFixed(1)}h`}
        ></div>
        <div
          className="bg-[#CE9339] h-full transition-all duration-500"
          style={{ width: `${adhocPct}%` }}
          title={`Ad-Hoc: ${Number(adhocHours).toFixed(1)}h`}
        ></div>
        <div
          className="bg-[#F0EEEA] h-full transition-all duration-500"
          style={{ width: `${freePct}%` }}
          title={`Free Buffer: ${freeHours.toFixed(1)}h`}
        ></div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-[#4A4239] font-medium">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#6E54AF]"></span>
          <span>{Number(recurringHours).toFixed(1)}h Recurring</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3A6FB0]"></span>
          <span>{Number(prePlanningHours).toFixed(1)}h Pre-Planning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#CE9339]"></span>
          <span>{Number(adhocHours).toFixed(1)}h Ad-Hoc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-[#7B7265] bg-transparent"></span>
          <span>{freeHours.toFixed(1)}h Free</span>
        </div>
      </div>
    </div>
  );
}
