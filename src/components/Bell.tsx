import Link from 'next/link';
import { Icon } from './Icon';

/** Top-bar bell with the number of unread notifications (read state is saved per user, see notice_reads). */
export function Bell({ unread, label }: { unread: number; label: string }) {
  return (
    <Link href="/notifications" className="bell" aria-label={label} title={label}>
      <Icon name="bell" size={20} />
      {unread > 0 && <span className="dotcount">{unread > 9 ? '9+' : unread}</span>}
    </Link>
  );
}
