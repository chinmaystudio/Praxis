import { readFileSync } from 'node:fs';

const token = readFileSync(process.env.SUPABASE_ACCESS_TOKEN_FILE, 'utf8').trim();
const expected = JSON.parse(readFileSync(process.env.NEON_VERIFICATION_FILE, 'utf8'));
for (const [table, source] of Object.entries(expected)) {
  const query = `SELECT count(*)::int AS count, md5(COALESCE(string_agg(to_jsonb(t)::text,'|' ORDER BY to_jsonb(t)::text),'')) AS digest FROM public."${table}" t`;
  const response = await fetch('https://api.supabase.com/v1/projects/jymjioriurcirvktkjjx/database/query', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`${table}: HTTP ${response.status}`);
  const [destination] = await response.json();
  if (Number(source.count) !== Number(destination.count) || source.digest !== destination.digest) {
    throw new Error(`${table}: source and destination differ`);
  }
  console.log(`${table}: ${destination.count} rows and digest match`);
}
