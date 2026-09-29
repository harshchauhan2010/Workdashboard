/**
 * Load Banding Thresholds:
 * 0% - 70%   -> UNDERLOADED
 * 71% - 90%  -> OPTIMAL
 * 91% - 100% -> HEAVY_LOAD
 * > 100%     -> OVERALLOCATED
 */
export function calculateLoadBand(utilizationPct) {
  const pct = Number(utilizationPct) || 0;
  if (pct <= 70.0) {
    return {
      band: "UNDERLOADED",
      color: "emerald",
      badge_class: "text-emerald-400 bg-emerald-950",
      description: "Has bandwidth for extra tasks",
    };
  }
  if (pct <= 90.0) {
    return {
      band: "OPTIMAL",
      color: "cyan",
      badge_class: "text-cyan-400 bg-cyan-950",
      description: "Safe operational sweet spot",
    };
  }
  if (pct <= 100.0) {
    return {
      band: "HEAVY_LOAD",
      color: "amber",
      badge_class: "text-amber-400 bg-amber-950",
      description: "Near capacity; risk of slip",
    };
  }
  return {
    band: "OVERALLOCATED",
    color: "rose",
    badge_class: "text-rose-400 bg-rose-950",
    description: "Immediate manager intervention needed",
  };
}

/**
 * Format developer capacity row with numeric conversions and banding
 */
export function formatDeveloperCapacity(row) {
  if (!row) return null;

  const weeklyCapacity = Number(row.weekly_capacity_hours) || 40.0;
  const recurringHours = Number(row.recurring_hours) || 0.0;
  const prePlanningHours = Number(row.pre_planning_hours) || 0.0;
  const adhocHours = Number(row.adhoc_hours) || 0.0;
  const pendingHours = Number(row.pending_hours) || 0.0;
  const totalLoadHours = Number(row.total_load_hours) || 0.0;
  const utilizationPct = Number(row.utilization_pct) || 0.0;
  const availableBufferHours = Number(row.available_buffer_hours) || 0.0;
  const overageHours = Number(row.overage_hours) || 0.0;
  const isOverallocated = Boolean(row.is_overallocated);

  const banding = calculateLoadBand(utilizationPct);

  return {
    user_id: row.user_id,
    developer_name: row.full_name || row.developer_name,
    email: row.email || row.developer_email,
    role_title: row.role_title,
    seniority: row.seniority,
    squad_id: row.squad_id,
    squad_name: row.squad_name,
    squad_badge: row.squad_badge_code,
    weekly_capacity_hours: weeklyCapacity,
    recurring_hours: recurringHours,
    pre_planning_hours: prePlanningHours,
    adhoc_hours: adhocHours,
    pending_hours: pendingHours,
    total_load_hours: totalLoadHours,
    utilization_pct: utilizationPct,
    available_buffer_hours: availableBufferHours,
    overage_hours: overageHours,
    is_overallocated: isOverallocated,
    load_band: banding.band,
    band_color: banding.color,
    band_description: banding.description,
  };
}

/**
 * Format squad capacity row with numeric conversions
 */
export function formatSquadCapacity(row) {
  if (!row) return null;

  return {
    squad_id: row.squad_id,
    squad_name: row.squad_name,
    badge_code: row.badge_code,
    focus_domain: row.focus_domain,
    health: row.health,
    tech_lead_id: row.tech_lead_id,
    tech_lead_name: row.tech_lead_name,
    tech_lead_email: row.tech_lead_email,
    budget_hours: Number(row.budget_hours) || 0,
    spent_hours: Number(row.spent_hours) || 0,
    total_engineers: Number(row.total_engineers) || 0,
    total_capacity_hours: Number(row.total_capacity_hours) || 0.0,
    allocated_load_hours: Number(row.allocated_load_hours) || 0.0,
    squad_utilization_pct: Number(row.squad_utilization_pct) || 0.0,
    overbooked_engineers_count: Number(row.overbooked_engineers_count) || 0,
    active_tasks_count: Number(row.active_tasks_count) || 0,
    blocked_tasks_count: Number(row.blocked_tasks_count) || 0,
  };
}
