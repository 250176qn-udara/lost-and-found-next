import { runFinderReminders } from '@/lib/reminders';

/**
 * Sends the finder reminders that are due. For a scheduler (Windows Task Scheduler, cron), e.g. every hour:
 *   curl "http://localhost:3000/api/cron/reminders?key=YOUR_CRON_SECRET"
 * Needs CRON_SECRET in .env.local. Without a scheduler the app still sends them after pages load.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET ?? '';
  const key = new URL(req.url).searchParams.get('key') ?? req.headers.get('x-cron-key') ?? '';
  if (secret.length < 16 || key !== secret) return Response.json({ ok: false, error: 'Not allowed.' }, { status: 403 });
  const sent = await runFinderReminders();
  return Response.json({ ok: true, sent });
}
