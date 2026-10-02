import { getMe } from '@/lib/auth';
import { one } from '@/lib/db';

/** Serves an item's photo to members of the same organization (was api/index.php?action=item_photo). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Get the logged-in user
  const me = await getMe();
  // Check if the user is logged in
  if (!me) return Response.json({ ok: false, error: 'Please log in.' }, { status: 401 });
  // Get the item ID from the request parameters
  const { id } = await params;
  // Fetch the item from the database
  const row = await one<{ photo: string | null; organization_id: number }>(
    'SELECT photo, organization_id FROM items WHERE id = ?', [Number(id) || 0]);
  if (!row || row.organization_id !== me.user.organizationId) return Response.json({ ok: false, error: 'Not found.' }, { status: 404 });
  // photo base64 data
  const m = row.photo?.match(/^data:(image\/[a-z]+);base64,(.+)$/s);
  if (!m) return Response.json({ ok: false, error: 'No photo.' }, { status: 404 });
  // Response
  return new Response(Buffer.from(m[2], 'base64'), {
    headers: { 'Content-Type': m[1], 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' },
  });
}
