import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const sql = postgres(connectionString);

  try {
    console.log('Running migrations...');

    const migrationFile = join(process.cwd(), 'migrations', '001_init.sql');
    const migrationSQL = readFileSync(migrationFile, 'utf-8');

    await sql.unsafe(migrationSQL);

    console.log('✅ Migrations completed successfully!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

runMigrations();
