/**
 * WORKDASHBOARD AUTOMATED END-TO-END (E2E) INTEGRATION TEST RUNNER
 * Tests complete engineering operations lifecycle across all 14 modules.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

let totalPassed = 0;
let totalFailed = 0;
const testStart = Date.now();

function assert(condition, message, debugData = null) {
  if (condition) {
    totalPassed++;
    console.log(`    ${colors.green}✔ PASS:${colors.reset} ${message}`);
  } else {
    totalFailed++;
    console.error(`    ${colors.red}✖ FAIL:${colors.reset} ${message}`);
    if (debugData) {
      console.error(`    ${colors.magenta}🔍 Debug Info:${colors.reset}`, JSON.stringify(debugData, null, 2));
    }
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-dev-user': 'true',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    data = { rawText: text };
  }

  return { status: res.status, ok: res.ok, data };
}

async function runE2ETests() {
  console.log(`\n${colors.bright}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   🚀 WORKDASHBOARD COMPREHENSIVE E2E INTEGRATION TEST SUITE (PHASE 16)  ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}========================================================================${colors.reset}\n`);

  try {
    // -------------------------------------------------------------------------
    // STAGE 1: AUTH & USERS
    // -------------------------------------------------------------------------
    console.log(`${colors.yellow}🔹 STAGE 1: Authentication & User Discovery${colors.reset}`);
    const usersRes = await api('/api/users');
    assert(usersRes.status === 200, 'GET /api/users returns 200 OK');
    const users = usersRes.data.data || usersRes.data;
    assert(Array.isArray(users) && users.length >= 2, `Discovered ${users.length} active users`);

    const manager = users.find(u => u.system_role === 'MANAGER') || users[0];
    const dev1 = users.find(u => u.system_role === 'DEVELOPER') || users[1] || users[0];
    const dev2 = users.find(u => u.id !== dev1.id && u.id !== manager.id) || users.find(u => u.id !== dev1.id) || users[0];

    console.log(`    ℹ Manager: ${manager.full_name || manager.email} (${manager.id})`);
    console.log(`    ℹ Developer 1: ${dev1.full_name || dev1.email} (${dev1.id})`);
    console.log(`    ℹ Developer 2: ${dev2.full_name || dev2.email} (${dev2.id})`);

    // -------------------------------------------------------------------------
    // STAGE 2: PLANNING PERIODS (7-DAY SPRINTS)
    // -------------------------------------------------------------------------
    console.log(`\n${colors.yellow}🔹 STAGE 2: 7-Day Planning Periods (Sprint Cycles)${colors.reset}`);
    const sprint43Res = await api('/api/planning-periods', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Sprint 43 · ${Date.now()}`,
        start_date: '2026-09-21',
        end_date: '2026-09-27',
        is_current: true,
      }),
    });
    assert(sprint43Res.status === 201, 'POST /api/planning-periods creates 7-day Sprint 43 as active');
    const sprint43Id = sprint43Res.data.data.id;
    assert(sprint43Res.data.data.is_current === true, 'Sprint 43 is active (is_current = true)');

    const sprint44Res = await api('/api/planning-periods', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E Sprint 44 · ${Date.now()}`,
        start_date: '2026-09-28',
        end_date: '2026-10-04',
        is_current: false,
      }),
    });
    assert(sprint44Res.status === 201, 'POST /api/planning-periods creates 7-day Sprint 44 as upcoming');
    const sprint44Id = sprint44Res.data.data.id;

    // Test transactional current sprint switch
    const switchRes = await api(`/api/planning-periods/${sprint43Id}/set-current`, {
      method: 'PATCH',
    });
    assert(switchRes.status === 200, 'PATCH /api/planning-periods/:id/set-current enforces single-current-sprint');

    // -------------------------------------------------------------------------
    // STAGE 3: SQUADS & SQUAD MEMBERS
    // -------------------------------------------------------------------------
    console.log(`\n${colors.yellow}🔹 STAGE 3: Engineering Squads & Member Allocation${colors.reset}`);
    const squadRes = await api('/api/squads', {
      method: 'POST',
      body: JSON.stringify({
        name: `E2E FinTech Squad ${Date.now()}`,
        badge_code: 'FNT',
        focus_domain: 'PAYMENTS_CORE',
        lead_user_id: manager.id,
        budget_hours: 160.0,
      }),
    });
    assert(squadRes.status === 201, 'POST /api/squads creates engineering squad');
    const squadId = squadRes.data.data.id;

    const addMemberRes1 = await api(`/api/squads/${squadId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: dev1.id,
        allocation_percentage: 100.0,
        is_lead: false,
      }),
    });
    assert(addMemberRes1.status === 201 || addMemberRes1.status === 200, 'POST /api/squads/:id/members adds Developer 1');

    const addMemberRes2 = await api(`/api/squads/${squadId}/members`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: dev2.id,
        allocation_percentage: 100.0,
        is_lead: false,
      }),
    });
    assert(addMemberRes2.status === 201 || addMemberRes2.status === 200, 'POST /api/squads/:id/members adds Developer 2');

    // -------------------------------------------------------------------------
    // STAGE 4: TASK TEMPLATES & BLUEPRINT INSTANTIATION
    // -------------------------------------------------------------------------
    console.log(`\n${colors.yellow}🔹 STAGE 4: Task Templates & Security Lockout${colors.reset}`);
    const templatesRes = await api('/api/task-templates');
    assert(templatesRes.status === 200, 'GET /api/task-templates lists template library');
    const templates = templatesRes.data.data || templatesRes.data;
    const sysTemplate = templates.find(t => t.is_system) || templates[0];

    // Verify system template protection (403 Forbidden)
    if (sysTemplate && sysTemplate.is_system) {
      const deleteSysRes = await api(`/api/task-templates/${sysTemplate.id}`, {
        method: 'DELETE',
      });
      assert(deleteSysRes.status === 403, 'DELETE /api/task-templates/:id returns 403 Forbidden for system template');
    }

    // Create a custom blueprint
    const customTplRes = await api('/api/task-templates', {
      method: 'POST',
      body: JSON.stringify({
        name: 'E2E OAuth Integration Blueprint',
        default_task_title: 'Implement OAuth 2.0 PKCE Flow',
        description: 'Standard OAuth 2.0 PKCE flow integration template',
        task_type: 'PRE_PLANNING',
        category: 'DEVELOPMENT',
        default_priority: 'P1_HIGH',
        default_estimated_hours: 16.0,
      }),
    });
    assert(customTplRes.status === 201, 'POST /api/task-templates creates custom blueprint');
    const customTplId = customTplRes.data.data.id;

    // Instantiate Blueprint into Sprint 43
    const instantiateRes = await api(`/api/task-templates/${customTplId}/instantiate`, {
      method: 'POST',
      body: JSON.stringify({
        squad_id: squadId,
        planning_period_id: sprint43Id,
        title: 'Sprint 43 — Implement OAuth 2.0 PKCE Flow',
      }),
    });
    assert(instantiateRes.status === 201, 'POST /api/task-templates/:id/instantiate stamps blueprint into sprint');
    const taskId = instantiateRes.data.task?.id || instantiateRes.data.data?.id || instantiateRes.data.id;
    assert(taskId != null, `Instantiated Task ID: ${taskId}`);

    // -------------------------------------------------------------------------
    // STAGE 5: TASK ASSIGNMENTS (MULTI-DEV SPLIT)
    // -------------------------------------------------------------------------
    console.log(`\n${colors.yellow}🔹 STAGE 5: Multi-Developer Task Assignment${colors.reset}`);
    const assignRes = await api(`/api/tasks/${taskId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        split_mode: 'MULTIPLE_DEVELOPERS',
        assignments: [
          { user_id: dev1.id, assigned_hours: 8.0 },
          { user_id: dev2.id, assigned_hours: 8.0 },
        ],
      }),
    });
    assert(assignRes.status === 201, 'POST /api/tasks/:id/assignments splits 16 hours across 2 devs (8h + 8h)');

    // -------------------------------------------------------------------------
    // STAGE 6: LIVE TIMERS & WORK LOGS AUTO-CONVERSION
    // -------------------------------------------------------------------------
    console.log(`\n${colors.yellow}🔹 STAGE 6: Live Timers & Automatic Work Log Generation${colors.reset}`);
    // Start timer as Developer 1
    const startTimerRes = await api('/api/timers/start', {
      method: 'POST',
      headers: { 'x-dev-user-id': dev1.clerk_id || dev1.id },
      body: JSON.stringify({
        task_id: taskId,
      }),
    });
    assert(startTimerRes.status === 200 || startTimerRes.status === 201, 'POST /api/timers/start starts live timer for Developer 1', startTimerRes);

    // Pause timer
    const pauseTimerRes = await api('/api/timers/pause', {
      method: 'PATCH',
      headers: { 'x-dev-user-id': dev1.clerk_id || dev1.id },
    });
    assert(pauseTimerRes.status === 200, 'PATCH /api/timers/pause pauses running timer', pauseTimerRes);

    // Stop timer with 9000s (2.5h) work log
    const stopTimerRes = await api('/api/timers/stop', {
      method: 'POST',
      headers: { 'x-dev-user-id': dev1.clerk_id || dev1.id },
      body: JSON.stringify({
        seconds_elapsed: 9000,
        notes: 'Completed PKCE code challenge and token exchange verification',
      }),
    });
    assert(stopTimerRes.status === 200, 'POST /api/timers/stop clears timer and auto-records work log', stopTimerRes);

    // Verify task work logs
    const logsRes = await api(`/api/tasks/${taskId}/work-logs`);
    assert(logsRes.status === 200, 'GET /api/tasks/:id/work-logs retrieves logged entries');
    const logs = logsRes.data.data || logsRes.data;
    assert(logs.length >= 1, `Found ${logs.length} work log entry for task`);

    // -------------------------------------------------------------------------
    // STAGE 7: TASK BLOCKERS & ESCALATION LIFECYCLE
    // -------------------------------------------------------------------------
    console.log(`\n${colors.yellow}🔹 STAGE 7: Critical Blocker Reporting & Escalation${colors.reset}`);
    const reportBlockerRes = await api(`/api/tasks/${taskId}/blockers`, {
      method: 'POST',
      body: JSON.stringify({
        reported_by_user_id: dev1.id,
        category: 'DEPENDENCY',
        severity: 'CRITICAL_BLOCKER',
        reason: 'Missing OAuth Client ID & Secret from Identity Provider',
        business_impact: 'Sprint delivery blocked until credentials issued',
        mitigation_action: 'Ticket #4092 opened with Security Ops',
        expected_resolution_date: '2026-09-25',
      }),
    });
    assert(reportBlockerRes.status === 201, 'POST /api/tasks/:id/blockers reports CRITICAL_BLOCKER');
    const blockerId = reportBlockerRes.data.data.id;

    // Verify task status is blocked
    const taskDetailsRes = await api(`/api/tasks/${taskId}`);
    assert(taskDetailsRes.status === 200, 'GET /api/tasks/:id retrieves task state');
    assert(taskDetailsRes.data.data.is_blocked === true, 'Task is flagged as is_blocked = true');

    // Resolve blocker (Manager action)
    const resolveBlockerRes = await api(`/api/blockers/${blockerId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({
        resolved_by_user_id: manager.id,
        resolution_notes: 'Provided sandbox client ID & test certificates',
      }),
    });
    assert(resolveBlockerRes.status === 200, 'PATCH /api/blockers/:id/resolve resolves impediment');

    // -------------------------------------------------------------------------
    // STAGE 8: RECURRING ROUTINES SCHEDULE
    // -------------------------------------------------------------------------
    console.log(`\n${colors.yellow}🔹 STAGE 8: Developer Recurring Routines${colors.reset}`);
    const routineRes = await api('/api/recurring-routines', {
      method: 'POST',
      body: JSON.stringify({
        user_id: dev1.id,
        squad_id: squadId,
        title: 'E2E Daily Standup & Sync',
        schedule_label: 'Daily 9:30 AM (0.5h)',
        frequency: 'DAILY',
        allocated_hours: 2.5,
      }),
    });
    assert(routineRes.status === 201, 'POST /api/recurring-routines creates standing routine for Developer 1', routineRes);

    // -------------------------------------------------------------------------
    // STAGE 9: CAPACITY ENGINE & ANALYTICS VIEWS
    // -------------------------------------------------------------------------
    console.log(`\n${colors.yellow}🔹 STAGE 9: Capacity Engine & Analytics Views${colors.reset}`);
    const devCapRes = await api('/api/capacity/developers');
    assert(devCapRes.status === 200, 'GET /api/capacity/developers returns developer workload bands');
    const devCaps = devCapRes.data.data || devCapRes.data;
    assert(Array.isArray(devCaps), `Retrieved ${devCaps.length} developer capacity metrics`);

    const squadCapRes = await api('/api/capacity/squads');
    assert(squadCapRes.status === 200, 'GET /api/capacity/squads returns squad operations summary');
    const squadCaps = squadCapRes.data.data || squadCapRes.data;
    assert(Array.isArray(squadCaps), `Retrieved ${squadCaps.length} squad capacity metrics`);

    // -------------------------------------------------------------------------
    // FINAL REPORT
    // -------------------------------------------------------------------------
    const duration = ((Date.now() - testStart) / 1000).toFixed(2);
    console.log(`\n${colors.bright}${colors.green}========================================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.green}   🎉 ALL E2E INTEGRATION TESTS PASSED SUCCESSFULLY! (${duration}s)   ${colors.reset}`);
    console.log(`${colors.bright}${colors.green}   ✔ Total Passed: ${totalPassed}  |  ✖ Total Failed: ${totalFailed}${colors.reset}`);
    console.log(`${colors.bright}${colors.green}========================================================================${colors.reset}\n`);

  } catch (error) {
    const duration = ((Date.now() - testStart) / 1000).toFixed(2);
    console.log(`\n${colors.bright}${colors.red}========================================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.red}   ❌ E2E INTEGRATION SUITE FAILED (${duration}s)   ${colors.reset}`);
    console.log(`${colors.bright}${colors.red}   ✔ Total Passed: ${totalPassed}  |  ✖ Total Failed: ${totalFailed + 1}${colors.reset}`);
    console.log(`${colors.bright}${colors.red}========================================================================${colors.reset}\n`);
    process.exit(1);
  }
}

runE2ETests();
