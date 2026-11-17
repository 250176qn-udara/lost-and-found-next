// The Lost & Found logo mark: a white luggage tag with a tick (a found item, tagged and on its way back to its owner)
// and a small sparkle, on the app's teal → indigo → violet → pink gradient tile. No hooks: works in Server Components.
// public/icon.svg is the same drawing for the browser tab and the installed app.

export function BrandMark({ size = 36, className = 'brand-mark' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="lf-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#06B6D4" />
          <stop offset=".45" stopColor="#6366F1" />
          <stop offset=".75" stopColor="#A855F7" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="lf-mark-tick" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4F46E5" />
          <stop offset="1" stopColor="#C026D3" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#lf-mark-bg)" />
      {/* soft light on the top-left corner */}
      <path d="M13 0h22a13 13 0 0 1 0 .1C24 4 10 10 0 22V13A13 13 0 0 1 13 0z" fill="#fff" opacity=".16" />
      <g transform="translate(24 24.5) scale(1.13) rotate(-24) translate(-24 -25)">
        {/* string from the tag's hole */}
        <path d="M15.5 23C11 19.5 9.5 14 13 10.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".9" />
        {/* tag */}
        <path d="M18 15h16.5a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H18l-8.5-10z" fill="#fff" />
        <circle cx="16.4" cy="25" r="2.5" fill="#7C3AED" />
        <path d="M22.5 25.4l3.7 3.7 7.3-7.6" stroke="url(#lf-mark-tick)" strokeWidth="3.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      {/* sparkle: "found!" */}
      <path d="M38.5 5.5l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3z" fill="#fff" />
    </svg>
  );
}
