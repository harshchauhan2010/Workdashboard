import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually if DATABASE_URL is not set
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

const MIGRATIONS_DIR = path.resolve(process.cwd(), 'database', 'migrations');

async function runMigrations() {
  console.log('===============================================================');
  console.log('  🚀 WORKDASHBOARD PRODUCTION DATABASE MIGRATION RUNNER');
  console.log('===============================================================\n');

  const client = await pool.connect();

  try {
    // 1. Ensure Schema and Tracking Table exist
    await client.query('CREATE SCHEMA IF NOT EXISTS workdash;');
    await client.query(`
      CREATE TABLE IF NOT EXISTS workdash.schema_migrations (
        version VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Fetch already applied migrations
    const appliedRes = await client.query('SELECT version FROM workdash.schema_migrations');
    const appliedVersions = new Set(appliedRes.rows.map(r => r.version));

    // 3. Read migration files from database/migrations/
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      throw new Error(`Migrations directory not found at: ${MIGRATIONS_DIR}`);
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📁 Found ${files.length} migration files in database/migrations/\n`);

    let appliedCount = 0;

    for (const file of files) {
      const version = file.split('_')[0];
      const name = file;

      if (appliedVersions.has(version)) {
        console.log(`  ⏩ [SKIPPED] ${file} (already applied)`);
        continue;
      }

      console.log(`  ⏳ [APPLYING] ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Execute in isolated database transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO workdash.schema_migrations (version, name) VALUES ($1, $2)',
          [version, name]
        );
        await client.query('COMMIT');
        console.log(`  ✅ [SUCCESS]  ${file}`);
        appliedCount++;
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        console.error(`\n❌ [FAILED] Migration ${file} failed with error:\n`, migrationErr.message);
        throw migrationErr;
      }
    }

    console.log('\n===============================================================');
    if (appliedCount > 0) {
      console.log(`  🎉 Successfully applied ${appliedCount} new migration(s)!`);
    } else {
      console.log('  ✨ All migrations are already up to date. Zero pending changes.');
    }
    console.log('===============================================================\n');

  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('[FATAL] Migration process terminated with error:', err);
  process.exit(1);
});
