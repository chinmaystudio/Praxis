import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRef = 'jymjioriurcirvktkjjx';
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
const tables = [
  'events', 'registrations', 'payments', 'payment_audit_logs',
  'registrations_bgmi', 'registrations_infinity_trials',
  'registrations_research_x', 'registrations_storyverse',
  'registrations_tech_roulette',
];

const token = process.env.SUPABASE_ACCESS_TOKEN || (process.env.SUPABASE_ACCESS_TOKEN_FILE ? readFileSync(process.env.SUPABASE_ACCESS_TOKEN_FILE, 'utf8').trim() : '');
const snapshotPath = process.env.NEON_SNAPSHOT_FILE;
if (!token || !snapshotPath) throw new Error('SUPABASE_ACCESS_TOKEN(_FILE) and NEON_SNAPSHOT_FILE are required.');
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));

async function sql(query, parameters = []) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, parameters }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`Supabase SQL request failed (${response.status}): ${JSON.stringify(body).slice(0, 1000)}`);
  return body;
}

const existing = await sql("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name = ANY(ARRAY['events','registrations','payments','payment_audit_logs','registrations_bgmi','registrations_infinity_trials','registrations_research_x','registrations_storyverse','registrations_tech_roulette'])");
if (existing.length === 0) {
  const migration = resolve(import.meta.dirname, '../../supabase/migrations/20260920191132_neon_snapshot.sql');
  await sql(readFileSync(migration, 'utf8'));
  console.log('Created Supabase schema.');
} else if (existing.length !== tables.length) {
  throw new Error(`Destination has ${existing.length} of ${tables.length} expected tables; inspect before retrying.`);
}

for (const table of tables) {
  if (!Array.isArray(snapshot[table])) throw new Error(`Missing snapshot for ${table}`);
  const rows = snapshot[table];
  if (rows.length) {
    await sql(`INSERT INTO public."${table}" SELECT * FROM jsonb_populate_recordset(NULL::public."${table}", $1::jsonb) ON CONFLICT DO NOTHING`, [JSON.stringify(rows)]);
  }
  const countResult = await sql(`SELECT count(*)::int AS count FROM public."${table}"`);
  const count = Number(countResult[0]?.count);
  if (count !== rows.length) throw new Error(`${table}: expected ${rows.length}, found ${count}`);
  console.log(`${table}: ${count} rows verified`);
}
await sql("SELECT setval('public.payment_audit_logs_id_seq', COALESCE((SELECT max(id) FROM public.payment_audit_logs), 1), true)");
console.log('Snapshot copied. Verify source counts again before cutover.');
