'use client';

import { useState, useTransition } from 'react';
import { saveGeneralSettings, saveSettingList } from '@/app/actions';
import { SETTING_LIMITS } from '@/lib/constants';
import type { Place } from '@/lib/types';
import { PlacesEditor } from './PlacesEditor';
import { useT, useToast } from '@/components/Providers';
import { ErrorText, Head } from '@/components/ui';

const TABS = ['General', 'Categories', 'Places & shelves', 'ID types'];

export type SettingsValues = { storageDays: number; policeDays: number; keepDays: number; hideSensitive: boolean; categories: string[]; shelves: string[]; idTypes: string[] };

export function SettingsForm({ places, settings, initialTab }: { places: Place[]; settings: SettingsValues; initialTab?: string }) {
  const t = useT();
  const [tab, setTab] = useState(TABS.includes(initialTab ?? '') ? initialTab! : TABS[0]);

  return (
    <>
      <Head title={t('Settings')} sub={t('Rules for your organization.')} />
      <div className="seg tabrow">{TABS.map(x => <button key={x} className={tab === x ? 'on' : ''} onClick={() => setTab(x)}>{t(x)}</button>)}</div>
      {tab === 'General' && <General settings={settings} />}
      {tab === 'Categories' && <ListEditor key="cat" kind="categories" title="Item categories" initial={settings.categories} placeholder="New category"
        note="Items that already use a removed category keep it." />}
      {tab === 'Places & shelves' && (
        <>
          <PlacesEditor places={places} />
          <div style={{ height: 14 }} />
          <ListEditor key="shelf" kind="shelves" title="Shelves" initial={settings.shelves} placeholder="New shelf" max={SETTING_LIMITS.shelfMax}
            note="Items already on a removed shelf stay there until they are moved." />
        </>
      )}
      {tab === 'ID types' && <ListEditor key="id" kind="idTypes" title="Accepted ID types" initial={settings.idTypes} placeholder="New ID type"
        note="Staff choose one of these at every handover. Checking an ID is always required." />}
    </>
  );
}

function General({ settings }: { settings: SettingsValues }) {
  const t = useT();
  const toast = useToast();
  const [storageDays, setStorage] = useState(settings.storageDays);
  const [policeDays, setPolice] = useState(settings.policeDays);
  const [hideSensitive, setHide] = useState(settings.hideSensitive);
  const [keepDays, setKeep] = useState(settings.keepDays);
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const changed = storageDays !== settings.storageDays || policeDays !== settings.policeDays || keepDays !== settings.keepDays || hideSensitive !== settings.hideSensitive;
  const save = () => start(async () => {
    setErr('');
    const r = await saveGeneralSettings({ storageDays, policeDays, keepDays, hideSensitive });
    if (!r.ok) return setErr(r.error);
    toast('Settings saved');
  });
  const days = Array.from({ length: SETTING_LIMITS.policeDays.max }, (_, i) => i + 1);

  return (
    <div className="box" style={{ maxWidth: 640 }}>
      <div className="sw">
        <span>{t('Storage period')}<div className="meta">{t('Days before unclaimed items expire')}</div></span>
        <select value={storageDays} onChange={e => setStorage(Number(e.target.value))}>
          {SETTING_LIMITS.storageDays.map(d => <option key={d} value={d}>{t('{n} days', { n: d })}</option>)}
        </select>
      </div>
      <div className="sw">
        <span>{t('Police report deadline')}<div className="meta">{t('The Lost Property Act asks for a report within 1 week.')}</div></span>
        <select value={policeDays} onChange={e => setPolice(Number(e.target.value))}>
          {days.map(d => <option key={d} value={d}>{t('{n} days', { n: d })}</option>)}
        </select>
      </div>
      <div className="sw">
        <span>{t('Finder may keep a found item for')}<div className="meta">{t('Then it must go to the office, even if nobody claimed it. The finder gets a reminder the day before and when the time is up.')}</div></span>
        <select value={keepDays} onChange={e => setKeep(Number(e.target.value))}>
          {Array.from({ length: SETTING_LIMITS.keepDays.max }, (_, i) => i + 1).map(d => <option key={d} value={d}>{t('{n} days', { n: d })}</option>)}
        </select>
      </div>
      <label className="sw">
        <span>{t('Hide sensitive items from browsing')}<div className="meta">{t('Wallets, ID cards, IC cards and phones are not shown in Found items. Owners are still told through matching.')}</div></span>
        <input type="checkbox" checked={hideSensitive} onChange={e => setHide(e.target.checked)} />
      </label>
      <p className="meta">{t('A photo ID check and the pickup code are always required at handover.')}</p>
      <ErrorText msg={t(err)} />
      <p><button className="btn" disabled={busy || !changed} onClick={save}>{t('Save changes')}</button></p>
    </div>
  );
}

function ListEditor({ kind, title, initial, placeholder, note, max = SETTING_LIMITS.itemMax }:
  { kind: 'categories' | 'shelves' | 'idTypes'; title: string; initial: string[]; placeholder: string; note: string; max?: number }) {
  const t = useT();
  const toast = useToast();
  const [list, setList] = useState(initial);
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const [busy, start] = useTransition();
  const save = (next: string[], done: string) => start(async () => {
    setErr('');
    const r = await saveSettingList(kind, next);
    if (!r.ok) return setErr(r.error);
    setList(next);
    toast(done);
  });
  const add = () => {
    const x = v.trim();
    if (!x) return;
    if (list.some(y => y.toLowerCase() === x.toLowerCase())) return setErr('This name is already on the list.');
    save([...list, x], 'Added');
    setV('');
  };
  const remove = (x: string) => {
    if (list.length === 1) return setErr('Keep at least one entry.');
    save(list.filter(y => y !== x), 'Removed');
  };
  return (
    <div className="box" style={{ maxWidth: 640 }}>
      <h2 style={{ marginTop: 0 }}>{t(title)} <span className="meta">({list.length})</span></h2>
      <p className="meta" style={{ marginTop: 0 }}>{t(note)}</p>
      <div className="pillrow">
        {list.map(x => (
          <span className="pill" key={x}>
            {t(x)}{' '}
            <button aria-label={t('Remove')} disabled={busy} onClick={() => remove(x)}
              style={{ border: 0, background: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>✕</button>
          </span>
        ))}
      </div>
      <div className="toolbar">
        <input value={v} maxLength={max} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder={t(placeholder)} />
        <button className="btn" disabled={busy || !v.trim()} onClick={add}>{t('Add')}</button>
      </div>
      <ErrorText msg={t(err)} />
    </div>
  );
}
