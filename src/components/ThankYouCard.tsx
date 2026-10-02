// A thank-you letter drawn as a card. No hooks: used by the form preview and by the finder's inbox.
import type { ReactNode } from 'react';

const ART: Record<string, ReactNode> = {
  classic: <path d="M20 34c-6-9-20-7-18 2 2 6 18 14 18 14s16-8 18-14c2-9-12-11-18-2z" fill="currentColor" />,
  sakura: <g fill="currentColor">{[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="20" cy="12" rx="6" ry="10" transform={`rotate(${a} 20 24)`} />)}<circle cx="20" cy="24" r="4" fill="#fff" /></g>,
  sunny: <g fill="currentColor"><circle cx="20" cy="24" r="9" />{[0, 45, 90, 135, 180, 225, 270, 315].map(a => <rect key={a} x="19" y="4" width="2" height="7" rx="1" transform={`rotate(${a} 20 24)`} />)}</g>,
  mint: <g fill="currentColor"><path d="M20 44C6 32 8 12 20 4c12 8 14 28 0 40z" /><path d="M20 10v32" stroke="#fff" strokeWidth="2" /></g>,
};

export function ThankYouCard({ design, message, from, children }: { design: string; message: string; from: string; children?: ReactNode }) {
  return (
    <div className={'letter ' + design}>
      <svg className="letter-art" viewBox="0 0 40 48" width="44" height="52" aria-hidden="true">{ART[design] ?? ART.classic}</svg>
      <div className="letter-title">Thank you</div>
      <p className="letter-body">{message || '…'}</p>
      <div className="letter-from">— {from}</div>
      {children}
    </div>
  );
}
