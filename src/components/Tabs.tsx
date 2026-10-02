// Tabs as links (?tab=...), so every section has its own URL and works without JavaScript.
import Link from 'next/link';
import type { T } from '@/lib/i18n';
import { Icon } from './Icon';

export type TabDef = { key: string; label: string; icon?: string; count?: number };

export function Tabs({ tabs, current, base, t, extra = {} }: { tabs: TabDef[]; current: string; base: string; t: T; extra?: Record<string, string> }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((tab, i) => {
        const q = new URLSearchParams({ ...extra, ...(i === 0 ? {} : { tab: tab.key }) }).toString();
        return (
          <Link key={tab.key} href={q ? `${base}?${q}` : base} role="tab" aria-selected={current === tab.key} className={current === tab.key ? 'on' : ''}>
            {tab.icon && <Icon name={tab.icon} size={16} />}
            {t(tab.label)}
            {tab.count !== undefined && tab.count > 0 && <span className="count">{tab.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

/** Picks the current tab from ?tab=, falling back to the first one. */
export const pickTab = (tabs: TabDef[], v: string | undefined) => (tabs.some(x => x.key === v) ? v! : tabs[0].key);
