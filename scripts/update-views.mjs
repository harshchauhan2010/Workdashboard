import pool from '../src/lib/db.js';

async function updateViews() {
  const sql = `
    DROP VIEW IF EXISTS workdash.v_squad_capacity_summary CASCADE;
    DROP VIEW IF EXISTS workdash.v_developer_capacity_summary CASCADE;

    -- 6.1 Comprehensive Developer Capacity Summary View (DEVELOPER system_role only)
    CREATE VIEW workdash.v_developer_capacity_summary AS
    SELECT
        u.id AS user_id,
        u.clerk_id,
        u.full_name,
        u.email,
        u.role_title,
        u.seniority,
        u.weekly_capacity_hours,
        u.recurring_overhead_hours,
        u.skills,
        u.system_role,
        sm.squad_id,
        sq.name AS squad_name,
        sq.badge_code AS squad_badge_code,
        
        -- Capacity breakdowns
        COALESCE(u.recurring_overhead_hours, 6.0) AS recurring_hours,
        COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) AS pre_planning_hours,
        COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) AS adhoc_hours,
        COALESCE(SUM(CASE WHEN t.status = 'PENDING_REVIEW' THEN ta.assigned_hours ELSE 0 END), 0.0) AS pending_hours,
        
        -- Total load
        (
            COALESCE(u.recurring_overhead_hours, 6.0) +
            COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
            COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
        ) AS total_load_hours,
        
        -- Computed utilization metrics
        ROUND(
            (
                (
                    COALESCE(u.recurring_overhead_hours, 6.0) +
                    COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
                    COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
                ) / u.weekly_capacity_hours
            ) * 100, 1
        ) AS utilization_pct,
        
        GREATEST(0.0, u.weekly_capacity_hours - (
            COALESCE(u.recurring_overhead_hours, 6.0) +
            COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
            COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
        )) AS available_buffer_hours,

        GREATEST(0.0, (
            COALESCE(u.recurring_overhead_hours, 6.0) +
            COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
            COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
        ) - u.weekly_capacity_hours) AS overage_hours,

        (
            (
                COALESCE(u.recurring_overhead_hours, 6.0) +
                COALESCE(SUM(CASE WHEN t.task_type = 'PRE_PLANNING' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) +
                COALESCE(SUM(CASE WHEN t.task_type = 'AD_HOC_EMERGENCY' AND t.status != 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)
            ) > u.weekly_capacity_hours
        ) AS is_overallocated

    FROM workdash.users u
    LEFT JOIN workdash.squad_members sm ON sm.user_id = u.id AND sm.left_at IS NULL
    LEFT JOIN workdash.squads sq ON sq.id = sm.squad_id
    LEFT JOIN workdash.task_assignments ta ON ta.user_id = u.id
    LEFT JOIN workdash.tasks t ON t.id = ta.task_id
    WHERE u.is_active = true AND u.system_role = 'DEVELOPER'
    GROUP BY u.id, u.clerk_id, u.full_name, u.email, u.role_title, u.seniority, u.weekly_capacity_hours, u.recurring_overhead_hours, u.skills, u.system_role, sm.squad_id, sq.name, sq.badge_code;

    -- 6.2 Squad Operations & Burn Summary View (Powers Teams & Squads Hub)
    CREATE VIEW workdash.v_squad_capacity_summary AS
    SELECT
        s.id AS squad_id,
        s.name AS squad_name,
        s.badge_code,
        s.focus_domain,
        s.health,
        u_lead.id AS tech_lead_id,
        u_lead.full_name AS tech_lead_name,
        u_lead.email AS tech_lead_email,
        s.budget_hours,
        s.spent_hours,
        COUNT(DISTINCT sm.user_id) AS total_engineers,
        COUNT(DISTINCT sm.user_id) * 40.0 AS total_capacity_hours,
        COALESCE(SUM(v_dev.total_load_hours), 0.0) AS allocated_load_hours,
        CASE 
            WHEN (COUNT(DISTINCT sm.user_id) * 40.0) > 0 THEN
                ROUND((COALESCE(SUM(v_dev.total_load_hours), 0.0) / (COUNT(DISTINCT sm.user_id) * 40.0)) * 100, 1)
            ELSE 0.0
        END AS squad_utilization_pct,
        COUNT(DISTINCT CASE WHEN v_dev.is_overallocated THEN v_dev.user_id END) AS overbooked_engineers_count,
        COUNT(DISTINCT t.id) AS active_tasks_count,
        COUNT(DISTINCT CASE WHEN t.is_blocked THEN t.id END) AS blocked_tasks_count
    FROM workdash.squads s
    LEFT JOIN workdash.users u_lead ON u_lead.id = s.lead_user_id
    LEFT JOIN workdash.squad_members sm ON sm.squad_id = s.id AND sm.left_at IS NULL
    LEFT JOIN workdash.v_developer_capacity_summary v_dev ON v_dev.user_id = sm.user_id
    LEFT JOIN workdash.tasks t ON t.squad_id = s.id AND t.status != 'COMPLETED'
    GROUP BY s.id, s.name, s.badge_code, s.focus_domain, s.health, u_lead.id, u_lead.full_name, u_lead.email, s.budget_hours, s.spent_hours;
  `;

  await pool.query(sql);
  console.log('Successfully recreated workdash views with DEVELOPER filter!');

  const check = await pool.query('SELECT user_id, full_name, role_title, system_role FROM workdash.v_developer_capacity_summary');
  console.log('New view rows (count: ' + check.rows.length + '):');
  console.log(JSON.stringify(check.rows, null, 2));
  process.exit(0);
}

updateViews().catch((err) => {
  console.error('Error updating views:', err);
  process.exit(1);
});
