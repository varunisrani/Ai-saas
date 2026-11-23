/** Own logo (D-UI-2): a compass rose in deep teal with a lagoon inner ring, crossed by a coral palm leaf. */
export function CompassRose({ size = 36, title }: { size?: number; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title ? <title>{title}</title> : null}
      <g fill="#0E4D4F" stroke="#F6EEDF" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M32 2 L37 27 L32 32 L27 27 Z" />
        <path d="M62 32 L37 37 L32 32 L37 27 Z" />
        <path d="M32 62 L27 37 L32 32 L37 37 Z" />
        <path d="M2 32 L27 27 L32 32 L27 37 Z" />
        <path d="M52 12 L36 30 L32 32 L34 28 Z" opacity="0.85" />
        <path d="M52 52 L34 36 L32 32 L36 34 Z" opacity="0.85" />
        <path d="M12 52 L28 34 L32 32 L30 36 Z" opacity="0.85" />
        <path d="M12 12 L30 28 L32 32 L28 30 Z" opacity="0.85" />
      </g>
      <circle cx="32" cy="32" r="9" fill="none" stroke="#1F8A8A" strokeWidth="3" />
      <circle cx="32" cy="32" r="2.6" fill="#F6EEDF" />
      <path d="M22 16 C 28 6, 40 4, 46 10 C 40 9, 33 11, 29 15 C 35 13, 41 14, 44 18 C 37 16, 30 17, 25 20 Z" fill="#FF6A4D" />
      <path d="M24 19 C 29 13, 36 9, 45 10" fill="none" stroke="#14161B" strokeWidth="0.9" opacity="0.5" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="atlas-wordmark" aria-hidden="true">
      Leonida <span>Atlas</span>
    </span>
  );
}
