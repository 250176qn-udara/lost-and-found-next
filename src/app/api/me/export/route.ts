import { getMe } from '@/lib/auth';
import { all } from '@/lib/db';

/** "Download my data": everything stored about the logged-in user, as a JSON file. Photos are left out. */
export async function GET() {
  const me = await getMe();
  if (!me) return Response.json({ ok: false, error: 'Please log in.' }, { status: 401 });
  const uid = me.user.id;
  const [account, memberships, items, claims] = await Promise.all([
    all('SELECT id, name, email, created_at FROM users WHERE id = ?', [uid]),
    all(`SELECT o.name AS organization, m.status, m.role, m.requested_at, m.approved_at
         FROM organization_members m JOIN organizations o ON o.id = m.organization_id WHERE m.user_id = ? ORDER BY m.id`, [uid]),
    all(`SELECT id, kind, title, category, place, item_date, description, status, item_code, created_at
         FROM items WHERE reporter_id = ? ORDER BY id`, [uid]),
    all(`SELECT c.id, i.title AS item, c.answers, c.status, c.created_at, c.decided_at, c.returned_at
         FROM claims c JOIN items i ON i.id = c.found_item_id WHERE c.claimant_id = ? ORDER BY c.id`, [uid]),
  ]);
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), account: account[0] ?? null, memberships, items, claims }, null, 2);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="my-lost-and-found-data.json"',
      'Cache-Control': 'no-store',
    },
  });
}
