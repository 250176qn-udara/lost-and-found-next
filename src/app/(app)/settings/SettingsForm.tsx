'use client';

import { useState } from 'react';
import { CATEGORIES, ID_TYPES, PLACES, SHELVES } from '@/lib/constants';
import { useT, useToast } from '@/components/Providers';
import { Head } from '@/components/ui';

// MOCK: settings are not saved yet; the controls only show a message.
const TABS = ['General', 'Categories', 'Places & shelves', 'ID types'];

export function SettingsForm() {
  const t = useT();
  const toast = useToast();
  const [tab, setTab] = useState(TABS[0]);
  const saved = () => toast('Setting saved');
  const Switch = ({ label, sub, on = true }: { label: string; sub?: string; on?: boolean }) => (
    <label className="sw">
      <span>{t(label)}{sub && <div className="meta">{t(sub)}</div>}</span>
      <input type="checkbox" defaultChecked={on} onChange={saved} />
    </label>
  );

  return (
    <>
      <Head title={t('Settings')} sub={t('Rules for your organization.')} />
      <div className="seg tabrow">{TABS.map(x => <button key={x} className={tab === x ? 'on' : ''} onClick={() => setTab(x)}>{t(x)}</button>)}</div>
      {tab === 'General' && (
        <div className="box" style={{ maxWidth: 640 }}>
          <div className="sw">
            <span>{t('Storage period')}<div className="meta">{t('Days before unclaimed items expire')}</div></span>
            <select defaultValue="90" onChange={saved}><option>30</option><option>90</option><option>180</option></select>
          </div>
          <Switch label="Thank-you points" sub="Owners can thank finders after a return" />
          <Switch label="Hide sensitive items from browsing" sub="Wallets, IDs, phones" />
          <Switch label="Require ID at handover" />
          <Switch label="Warn owners before items expire" sub="Sent 7 days before the end" />
          <p><button className="btn" onClick={() => toast('Settings saved')}>{t('Save changes')}</button></p>
        </div>
      )}
      {tab === 'Categories' && <ListEditor key="cat" title="Item categories" initial={CATEGORIES} placeholder="New category" />}
      {tab === 'Places & shelves' && (
        <>
          <ListEditor key="place" title="Places on the map" initial={PLACES} placeholder="New place" />
          <div style={{ height: 14 }} />
          <ListEditor key="shelf" title="Shelves" initial={SHELVES} placeholder="New shelf" />
        </>
      )}
      {tab === 'ID types' && <ListEditor key="id" title="Accepted ID types" initial={ID_TYPES} placeholder="New ID type" />}
    </>
  );
}

function ListEditor({ title, initial, placeholder }: { title: string; initial: string[]; placeholder: string }) {
  const t = useT();
  const toast = useToast();
  const [list, setList] = useState(initial);
  const [v, setV] = useState('');
  const add = () => {
    const x = v.trim();
    if (!x || list.includes(x)) return;
    setList([...list, x]);
    setV('');
    toast('Setting saved');
  };
  return (
    <div className="box" style={{ maxWidth: 640 }}>
      <h2 style={{ marginTop: 0 }}>{t(title)}</h2>
      <div className="pillrow">
        {list.map(x => (
          <span className="pill" key={x}>
            {t(x)}{' '}
            <button aria-label={t('Remove')} onClick={() => { setList(list.filter(y => y !== x)); toast('Setting saved'); }}
              style={{ border: 0, background: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>✕</button>
          </span>
        ))}
      </div>
      <div className="toolbar">
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={t(placeholder)} />
        <button className="btn" onClick={add}>{t('Add')}</button>
      </div>
    </div>
  );
}
