-- ============================================================================
-- Migration 008: Create Analytical Views for Capacity & Blockers
-- ============================================================================

-- 1. View: Developer Capacity Summary
CREATE OR REPLACE VIEW workdash.v_developer_capacity_summary AS
SELECT 
    u.id AS user_id,
    u.clerk_id,
    u.full_name,
    u.email,
    u.role_title,
    u.seniority,
    u.weekly_capacity_hours,
    u.recurring_overhead_hours,
    sm.squad_id,
    sq.name AS squad_name,
    COALESCE(u.recurring_overhead_hours, 6.0) AS recurring_hours,
    COALESCE(SUM(CASE WHEN t.task_type = 'PLANNED' AND t.status <> 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) AS pre_planning_hours,
    COALESCE(SUM(CASE WHEN t.task_type = 'UNPLANNED' AND t.status <> 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) AS adhoc_hours,
    COALESCE(SUM(CASE WHEN t.status = 'IN_PROGRESS' THEN ta.assigned_hours ELSE 0 END), 0.0) AS pending_hours,
    COALESCE(u.recurring_overhead_hours, 6.0) + 
    COALESCE(SUM(CASE WHEN t.status <> 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0) AS total_load_hours,
    ROUND(
        (COALESCE(u.recurring_overhead_hours, 6.0) + COALESCE(SUM(CASE WHEN t.status <> 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)) 
        / u.weekly_capacity_hours * 100.0, 1
    ) AS utilization_pct,
    GREATEST(0.0, u.weekly_capacity_hours - (COALESCE(u.recurring_overhead_hours, 6.0) + COALESCE(SUM(CASE WHEN t.status <> 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0))) AS available_buffer_hours,
    GREATEST(0.0, (COALESCE(u.recurring_overhead_hours, 6.0) + COALESCE(SUM(CASE WHEN t.status <> 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)) - u.weekly_capacity_hours) AS overage_hours,
    (COALESCE(u.recurring_overhead_hours, 6.0) + COALESCE(SUM(CASE WHEN t.status <> 'COMPLETED' THEN ta.assigned_hours ELSE 0 END), 0.0)) > u.weekly_capacity_hours AS is_overallocated
FROM workdash.users u
LEFT JOIN workdash.squad_members sm ON sm.user_id = u.id AND sm.left_at IS NULL
LEFT JOIN workdash.squads sq ON sq.id = sm.squad_id
LEFT JOIN workdash.task_assignments ta ON ta.user_id = u.id
LEFT JOIN workdash.tasks t ON t.id = ta.task_id
WHERE u.is_active = true
GROUP BY u.id, u.clerk_id, u.full_name, u.email, u.role_title, u.seniority, u.weekly_capacity_hours, u.recurring_overhead_hours, sm.squad_id, sq.name;

-- 2. View: Squad Capacity Summary
CREATE OR REPLACE VIEW workdash.v_squad_capacity_summary AS
SELECT 
    s.id AS squad_id,
    s.name AS squad_name,
    s.health_status,
    u_lead.id AS tech_lead_id,
    u_lead.full_name AS tech_lead_name,
    u_lead.email AS tech_lead_email,
    COUNT(DISTINCT sm.user_id) AS total_engineers,
    COUNT(DISTINCT sm.user_id)::numeric * 40.0 AS total_capacity_hours,
    COALESCE(SUM(v_dev.total_load_hours), 0.0) AS allocated_load_hours,
    CASE 
        WHEN (COUNT(DISTINCT sm.user_id)::numeric * 40.0) > 0 THEN
            ROUND(COALESCE(SUM(v_dev.total_load_hours), 0.0) / (COUNT(DISTINCT sm.user_id)::numeric * 40.0) * 100.0, 1)
        ELSE 0.0
    END AS squad_utilization_pct,
    COUNT(DISTINCT CASE WHEN v_dev.is_overallocated THEN v_dev.user_id ELSE NULL END) AS overbooked_engineers_count,
    COUNT(DISTINCT t.id) AS active_tasks_count,
    COUNT(DISTINCT CASE WHEN t.is_blocked THEN t.id ELSE NULL END) AS blocked_tasks_count
FROM workdash.squads s
LEFT JOIN workdash.users u_lead ON u_lead.id = s.lead_user_id
LEFT JOIN workdash.squad_members sm ON sm.squad_id = s.id AND sm.left_at IS NULL
LEFT JOIN workdash.v_developer_capacity_summary v_dev ON v_dev.user_id = sm.user_id
LEFT JOIN workdash.tasks t ON t.squad_id = s.id AND t.status <> 'COMPLETED'
GROUP BY s.id, s.name, s.health_status, u_lead.id, u_lead.full_name, u_lead.email;

-- 3. View: Active Blockers Registry
CREATE OR REPLACE VIEW workdash.v_active_blockers_registry AS
SELECT 
    b.id AS blocker_id,
    b.category,
    b.severity,
    b.reason,
    b.business_impact,
    b.mitigation_action,
    b.expected_resolution_date,
    b.created_at AS reported_at,
    t.id AS task_id,
    t.title AS task_title,
    t.estimated_hours,
    t.logged_hours,
    t.due_date,
    u_rep.full_name AS reported_by_name,
    u_ass.id AS assigned_user_id,
    u_ass.full_name AS assigned_user_name,
    u_ass.role_title AS assigned_user_role,
    sq.id AS squad_id,
    sq.name AS squad_name
FROM workdash.task_blockers b
JOIN workdash.tasks t ON t.id = b.task_id
JOIN workdash.users u_rep ON u_rep.id = b.reported_by_user_id
LEFT JOIN workdash.task_assignments ta ON ta.task_id = t.id
LEFT JOIN workdash.users u_ass ON u_ass.id = ta.user_id
LEFT JOIN workdash.squads sq ON sq.id = t.squad_id
WHERE b.is_resolved = false
ORDER BY (b.severity = 'CRITICAL') DESC, b.created_at DESC;
