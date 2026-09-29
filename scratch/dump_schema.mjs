import pool from '../src/lib/db.js';

async function dump() {
  const tables = [
    'planning_periods',
    'tasks',
    'task_assignments',
    'work_logs',
    'task_blockers',
    'blocker_presets',
    'task_templates',
    'recurring_routines',
    'active_timers'
  ];

  for (const t of tables) {
    const cols = await pool.query(
      "SELECT column_name, data_type, udt_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'workdash' AND table_name = $1 ORDER BY ordinal_position",
      [t]
    );
    console.log(`\n=== TABLE: ${t} ===`);
    cols.rows.forEach(r => {
      console.log(`  ${r.column_name}: ${r.udt_name || r.data_type} (nullable: ${r.is_nullable}, default: ${r.column_default})`);
    });
  }
  pool.end();
}

dump();
