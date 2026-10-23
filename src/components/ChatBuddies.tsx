// The two chat characters: Kuma (office bear with a headset) and Usa (student bunny with a bow). Pastel clay style, no hooks.
const OUT = '#9A6B55', BLUSH = '#F6A18C', EYE = '#5A4234', W = '#FFF9F1';

function Kuma() {
  return (
    <>
      {/* ears */}
      <circle cx="17" cy="20" r="8" fill="#E8C3A0" stroke={OUT} strokeWidth="2.5" /><circle cx="17" cy="20" r="4" fill={BLUSH} />
      <circle cx="47" cy="20" r="8" fill="#E8C3A0" stroke={OUT} strokeWidth="2.5" /><circle cx="47" cy="20" r="4" fill={BLUSH} />
      {/* head */}
      <circle cx="32" cy="36" r="21" fill="#E8C3A0" stroke={OUT} strokeWidth="2.5" />
      <path d="M20 26q5-4 10-3" stroke={W} strokeWidth="2.5" strokeLinecap="round" opacity=".7" fill="none" />
      <ellipse cx="32" cy="43" rx="10" ry="7.5" fill="#FFF1E2" />
      <circle cx="24.5" cy="34" r="2.6" fill={EYE} /><circle cx="39.5" cy="34" r="2.6" fill={EYE} />
      <circle cx="25.3" cy="33.2" r=".9" fill={W} /><circle cx="40.3" cy="33.2" r=".9" fill={W} />
      <ellipse cx="32" cy="40" rx="3" ry="2.2" fill={EYE} />
      <path d="M29 44q3 3 6 0" stroke={EYE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="19" cy="41" rx="3.5" ry="2.2" fill={BLUSH} opacity=".75" /><ellipse cx="45" cy="41" rx="3.5" ry="2.2" fill={BLUSH} opacity=".75" />
      {/* office headset */}
      <path d="M12 34q0-21 20-21t20 21" stroke="#7FA894" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="8" y="31" width="7" height="11" rx="3.5" fill="#A9C7B5" stroke={OUT} strokeWidth="2" />
      <path d="M12 42q2 7 10 7" stroke="#7FA894" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="23" cy="49" r="2.5" fill="#A9C7B5" stroke={OUT} strokeWidth="1.5" />
    </>
  );
}

function Usa() {
  return (
    <>
      {/* ears */}
      <path d="M22 26c-5-12-4-22 1-23s8 10 7 22z" fill={W} stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M23.5 23c-3-8-2.5-15 .5-15.5s4.5 7 4 14.5z" fill="#FFD8C7" />
      <path d="M42 26c5-12 4-22-1-23s-8 10-7 22z" fill={W} stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M40.5 23c3-8 2.5-15-.5-15.5s-4.5 7-4 14.5z" fill="#FFD8C7" />
      {/* head */}
      <circle cx="32" cy="40" r="20" fill={W} stroke={OUT} strokeWidth="2.5" />
      <path d="M20 31q5-4 10-3" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity=".9" fill="none" />
      <circle cx="25" cy="39" r="2.6" fill={EYE} /><circle cx="39" cy="39" r="2.6" fill={EYE} />
      <circle cx="25.8" cy="38.2" r=".9" fill={W} /><circle cx="39.8" cy="38.2" r=".9" fill={W} />
      <path d="M30 44.5l2 1.8 2-1.8" stroke={EYE} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28.5 48q3.5 2.5 7 0" stroke={EYE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="19.5" cy="46" rx="3.5" ry="2.2" fill={BLUSH} opacity=".75" /><ellipse cx="44.5" cy="46" rx="3.5" ry="2.2" fill={BLUSH} opacity=".75" />
      {/* student's bow */}
      <path d="M40 22l7-4v9zM40 22l-6-5v9z" fill="#F8D99B" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="40" cy="22" r="2.6" fill="#F6A18C" stroke={OUT} strokeWidth="1.5" />
    </>
  );
}

/** One character. `who`: 'office' (Kuma) or 'student' (Usa). */
export function Buddy({ who, size = 34, label }: { who: 'office' | 'student'; size?: number; label?: string }) {
  return (
    <svg className={'buddy ' + who} viewBox="0 0 64 64" width={size} height={size} role={label ? 'img' : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}>
      {who === 'office' ? <Kuma /> : <Usa />}
    </svg>
  );
}

/** Both characters side by side, waving (chat header and the empty chat). */
export function BuddyPair({ size = 46, speech }: { size?: number; speech?: string }) {
  return (
    <div className="buddypair">
      <span className="bp-one"><Buddy who="office" size={size} /></span>
      <span className="bp-two"><Buddy who="student" size={size} /></span>
      <span className="bp-wave" aria-hidden="true">👋</span>
      {speech && <span className="bp-speech">{speech}</span>}
    </div>
  );
}
