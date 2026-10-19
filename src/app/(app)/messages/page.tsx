import Link from 'next/link';
import { requirePage } from '@/lib/auth';
import { getMemberRows, getOfficeMessages, getOfficeThreads } from '@/lib/data';
import { getT } from '@/lib/i18n-server';
import { SelectNav } from '@/components/ClientBits';
import { Empty } from '@/components/Illustration';
import { Head, href, when } from '@/components/ui';
import { ChatWindow } from './ChatWindow';

/** Chat between members and their organization's office. Staff and admins share one inbox. */
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ with?: string; q?: string }> }) {
  const { user } = await requirePage({ membership: true });
  const orgId = user.organizationId!;
  const t = await getT();

  if (user.role === 'member') {
    const messages = await getOfficeMessages(orgId, user.id);
    return (
      <>
        <Head title={t('Messages')} sub={t('Chat with the lost and found office.')} />
        <ChatWindow memberId={null} messages={messages} viewer="member" title={t('Office')} meId={user.id} />
      </>
    );
  }

  const [{ with: w, q = '' }, threads, people] = await Promise.all([searchParams, getOfficeThreads(orgId), getMemberRows(orgId)]);
  const members = people.filter(p => p.role === 'member');
  const needle = q.trim().toLowerCase();
  const list = threads.filter(th => !needle || `${th.name} ${th.email}`.toLowerCase().includes(needle));
  const selId = Number(w) || list[0]?.memberId || 0;
  const sel = members.find(m => m.userId === selId) ?? people.find(m => m.userId === selId);
  const messages = sel ? await getOfficeMessages(orgId, sel.userId) : [];

  return (
    <>
      <Head title={t('Messages')} sub={t('Chat with members. Everyone at the front desk shares this inbox.')} />
      <div className="msgwrap">
        <div>
          <form className="toolbar" style={{ marginBottom: 10 }}>
            <input name="q" defaultValue={q} placeholder={t('Search')} style={{ maxWidth: 'none', flex: 1 }} />
          </form>
          <div className="field" style={{ marginBottom: 12 }}>
            <SelectNav value="" makeHref="/messages?with={v}"
              options={[['', t('New message to…')], ...members.map(m => [String(m.userId), m.name] as [string, string])]} />
          </div>
          {list.length ? list.map(th => (
            <Link key={th.memberId} href={href('/messages', { with: th.memberId, q })} className={'thread' + (th.memberId === sel?.userId ? ' on' : '')}>
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <b>{th.name}</b>
                {th.unread > 0 ? <span className="badge no">{th.unread}</span> : <span className="meta">{when(th.lastAt).slice(5)}</span>}
              </div>
              <div className="meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {th.lastFromStaff ? `${t('Office')}: ` : ''}{th.last}
              </div>
            </Link>
          )) : <p className="meta">{t('No conversations yet.')}</p>}
        </div>
        {sel
          ? <ChatWindow key={sel.userId} memberId={sel.userId} messages={messages} viewer="staff" title={sel.name} meId={user.id} />
          : <Empty art="empty" title={t('No conversation selected.')} text={t('Choose a member on the left, or start a new message.')} />}
      </div>
    </>
  );
}
