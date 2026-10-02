'use client';

// Small interactive pieces used by Server Component pages.
import { useRouter } from 'next/navigation';
import { useT, useToast } from './Providers';

/** Downloads rows as a CSV file (with a BOM so Excel opens Japanese text correctly). */
export function CsvButton({ filename, rows, label = 'Export CSV' }: { filename: string; rows: (string | number)[][]; label?: string }) {
  const t = useT();
  const toast = useToast();
  function download() {
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    toast('CSV downloaded');
  }
  return <button className="btn sec" onClick={download}>{t(label)}</button>;
}

export function PrintButton({ label = 'Print / PDF' }: { label?: string }) {
  const t = useT();
  return <button className="btn sec" onClick={() => window.print()}>{t(label)}</button>;
}

/** A select that opens a new URL when changed. `makeHref` contains "{v}" where the chosen value goes. */
export function SelectNav({ value, options, makeHref }: { value: string; options: [value: string, label: string][]; makeHref: string }) {
  const router = useRouter();
  return (
    <select value={value} onChange={e => router.push(makeHref.replace('{v}', encodeURIComponent(e.target.value)))}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

/** MOCK: a button that only shows a message, for features that are not built yet. */
export function MockButton({ label, msg, className = 'btn sec' }: { label: string; msg: string; className?: string }) {
  const t = useT();
  const toast = useToast();
  return <button className={className} onClick={() => toast(msg)}>{t(label)}</button>;
}
