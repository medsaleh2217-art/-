import { useId } from 'react';

/** رسم قارورة عطر أنيقة (ذهبي/أزرق) تُستخدم كبديل للصورة وفي شاشة البداية */
export default function Bottle({ className, label }: { className?: string; label?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      className={className}
      viewBox="0 0 120 160"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3c677" />
          <stop offset="0.5" stopColor="#c9a24a" />
          <stop offset="1" stopColor="#a8822f" />
        </linearGradient>
        <linearGradient id={`b${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a5aa8" />
          <stop offset="1" stopColor="#0b2a5b" />
        </linearGradient>
      </defs>
      <rect x="46" y="8" width="28" height="22" rx="4" fill={`url(#g${uid})`} />
      <rect x="52" y="30" width="16" height="10" fill={`url(#g${uid})`} />
      <rect x="22" y="40" width="76" height="106" rx="18" fill={`url(#b${uid})`} />
      <rect x="22" y="40" width="76" height="106" rx="18" fill="none" stroke={`url(#g${uid})`} strokeWidth="3" />
      <path d="M34 56c0-6 4-10 10-10" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="38" y="82" width="44" height="34" rx="6" fill="none" stroke={`url(#g${uid})`} strokeWidth="2" />
      <circle cx="60" cy="99" r="6" fill={`url(#g${uid})`} />
    </svg>
  );
}
