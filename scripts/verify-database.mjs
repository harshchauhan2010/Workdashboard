import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually if DATABASE_URL is not already set
if (!process.env.DATABASE_URL && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2010@localhost:5432/workdashboard',
});

async function runAudit() {
  const client = await pool.connect();
  console.log('===============================================================');
  console.log('  🔍 WORKDASHBOARD DATABASE INTEGRITY & SCHEMA AUDIT (PHASE 15)');
  console.log('===============================================================\n');

  try {
    // 1. Check schema
    const schemaRes = await client.query(`
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'workdash'
    `);
    const schemaExists = schemaRes.rows.length > 0;
    console.log(`[1] Schema 'workdash': ${schemaExists ? '✅ EXISTS' : '❌ MISSING'}`);

    await client.query('SET search_path TO workdash, public');

    // 2. Check ENUMs
    console.log('\n[2] Checking Custom ENUM Types:');
    const expectedEnums = [
      'user_system_role',
      'seniority_level',
      'squad_health_status',
      'task_workload_type',
      'task_workflow_status',
      'task_category_type',
      'task_priority_level',
      'assignment_distribution_mode',
      'blocker_severity_level',
      'blocker_category_type',
      'recurrence_freq',
      'timer_action_type',
      'capacity_load_band'
    ];

    const enumRes = await client.query(`
      SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'workdash'
      GROUP BY t.typname
    `);

    const foundEnums = new Map(enumRes.rows.map(r => [r.enum_name, r.enum_values]));

    for (const enumName of expectedEnums) {
      if (foundEnums.has(enumName)) {
        const val = foundEnums.get(enumName);
        const str = Array.isArray(val) ? val.join(', ') : String(val);
        console.log(`  ✅ ${enumName.padEnd(30)}: [${str}]`);
      } else {
        console.log(`  ❌ ${enumName.padEnd(30)}: MISSING`);
      }
    }

    // 3. Check Tables & Row Counts
    console.log('\n[3] Checking Core Tables & Record Counts:');
    const expectedTables = [
      'users',
      'planning_periods',
      'squads',
      'squad_members',
      'tasks',
      'task_assignments',
      'work_logs',
      'task_blockers',
      'blocker_presets',
      'task_templates',
      'recurring_routines',
      'active_timers'
    ];

    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'workdash' AND table_type = 'BASE TABLE'
    `);
    const foundTables = new Set(tableRes.rows.map(r => r.table_name));

    for (const tbl of expectedTables) {
      if (foundTables.has(tbl)) {
        const countRes = await client.query(`SELECT COUNT(*)::int as cnt FROM workdash."${tbl}"`);
        console.log(`  ✅ Table '${tbl.padEnd(22)}': ${countRes.rows[0].cnt} records`);
      } else {
        console.log(`  ❌ Table '${tbl.padEnd(22)}': MISSING`);
      }
    }

    // 4. Check Foreign Keys & Cascade Actions
    console.log('\n[4] Checking Foreign Keys & Cascade Constraints:');
    const fkRes = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'workdash'
      ORDER BY tc.table_name, kcu.column_name;
    `);

    console.log(`  Total Active Foreign Keys: ${fkRes.rows.length}`);
    for (const fk of fkRes.rows) {
      console.log(`  🔗 ${fk.table_name}.${fk.column_name} ➔ ${fk.foreign_table_name}.${fk.foreign_column_name} (ON DELETE ${fk.delete_rule})`);
    }

    // 5. Check Indexes
    console.log('\n[5] Checking Database Performance Indexes:');
    const idxRes = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'workdash'
      ORDER BY tablename, indexname;
    `);
    console.log(`  Total Indexes: ${idxRes.rows.length}`);
    for (const idx of idxRes.rows) {
      console.log(`  ⚡ ${idx.tablename.padEnd(22)} : ${idx.indexname}`);
    }

    // 6. Check Views & Query Test
    console.log('\n[6] Checking Analytical Views & Mathematical Integrity:');
    const viewRes = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'workdash'
    `);
    const foundViews = new Set(viewRes.rows.map(r => r.table_name));

    const expectedViews = ['v_developer_capacity_summary', 'v_squad_capacity_summary', 'v_active_blockers_registry'];
    for (const v of expectedViews) {
      if (foundViews.has(v)) {
        console.log(`  ✅ View '${v.padEnd(30)}': EXISTS`);
      } else {
        console.log(`  ❌ View '${v.padEnd(30)}': MISSING`);
      }
    }

    // Test query against v_developer_capacity_summary
    if (foundViews.has('v_developer_capacity_summary')) {
      console.log('\n  [6a] Testing v_developer_capacity_summary:');
      const devCapRes = await client.query(`
        SELECT 
          user_id,
          full_name,
          squad_name,
          weekly_capacity_hours,
          recurring_hours,
          total_load_hours,
          utilization_pct,
          available_buffer_hours,
          is_overallocated
        FROM workdash.v_developer_capacity_summary
        LIMIT 5;
      `);
      console.table(devCapRes.rows);
    }

    // Test query against v_squad_capacity_summary
    if (foundViews.has('v_squad_capacity_summary')) {
      console.log('\n  [6b] Testing v_squad_capacity_summary:');
      const squadCapRes = await client.query(`
        SELECT 
          squad_id,
          squad_name,
          tech_lead_name,
          total_engineers,
          total_capacity_hours,
          allocated_load_hours,
          squad_utilization_pct,
          overbooked_engineers_count,
          active_tasks_count,
          blocked_tasks_count
        FROM workdash.v_squad_capacity_summary
        LIMIT 5;
      `);
      console.table(squadCapRes.rows);
    }

    // Test query against v_active_blockers_registry
    if (foundViews.has('v_active_blockers_registry')) {
      console.log('\n  [6c] Testing v_active_blockers_registry:');
      const blockRes = await client.query(`
        SELECT 
          blocker_id,
          task_title,
          category,
          severity,
          reason,
          reported_by_name,
          squad_name
        FROM workdash.v_active_blockers_registry
        LIMIT 5;
      `);
      console.table(blockRes.rows);
    }

    console.log('\n===============================================================');
    console.log('  🎉 DATABASE INTEGRITY VERIFICATION COMPLETE');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('❌ Audit Failed with Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runAudit();
