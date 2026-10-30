/* Вся графика блокнота — собственные SVG, в одной семье с «Ноктюрном» и «Реквиемом». Строгий монохром. */
import { useId, type ReactNode } from 'react';

/** Острый крест с заточенными концами. */
export function Cross({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 20" aria-hidden="true">
      <path fill="currentColor" d="M7 0 8.2 4v2.8H11L14 8l-3 1.2H8.2V16L7 20l-1.2-4V9.2H3L0 8l3-1.2h2.8V4Z" />
    </svg>
  );
}

/** Разделитель: терновая лоза с крестом посередине. */
export function ThornDivider({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const line = (flip: boolean) => (
    <svg className="line" preserveAspectRatio="none" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        <pattern id={`${id}${flip ? 'b' : 'a'}`} width="16" height="10" patternUnits="userSpaceOnUse">
          <rect y="4.6" width="16" height="0.8" fill="currentColor" />
          <path fill="currentColor" d="M2 5Q5 4.3 6.6 .6 6.4 4 8.6 5Z" />
          <path fill="currentColor" d="M9.5 5q3 .7 4.6 4.4-.2-3.4 1.9-4.4Z" />
        </pattern>
      </defs>
      <rect width="100%" height="10" fill={`url(#${id}${flip ? 'b' : 'a'})`} />
    </svg>
  );
  return (
    <div className={`thorns ${className}`} role="separator">
      {line(false)}
      <Cross className="mid" />
      {line(true)}
    </div>
  );
}

/** «Tribal»-завиток в духе Y2K-принтов: острые лезвия, расходящиеся от центра. */
export function Flourish({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 92 40" aria-hidden="true" fill="currentColor">
      <path d="M92 20C72 17 52 7 24 1c16 8 34 15 46 19.5C56 23 38 30 12 39c28-4 54-11 80-19Z" />
      <path d="M84 20C62 19.4 34 19 0 20c34 1 62 .6 84 0Z" />
      <path d="M60 14.5C56 9 50 6 42 6.5c7 2 11 5.5 13 10Z" />
      <path d="M60 25.5c-4 5.5-10 8.5-18 8 7-2 11-5.5 13-10Z" />
      <path d="M36 9.5c-3-1-6-1-9 .5 3 0 5.5 1 7.5 3Z" opacity=".7" />
    </svg>
  );
}

/** Колючий уголок страницы. */
export function CornerThorn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" fill="currentColor">
      <path d="M0 0h40C26 2 12 4 4 12 2 18 1 28 0 40Z" opacity=".9" />
      <path d="M6 6c10 1 18 4 24 12-8-5-15-7-24-6Z" />
      <path d="M6 6c1 10 4 18 12 24-5-8-7-15-6-24Z" />
      <path d="M14 14l12 2-10 1Z" />
      <path d="M14 14l2 12 1-10Z" />
    </svg>
  );
}

/** Знак приложения — закрытый гримуар с крестом. */
export function Grimoire({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="currentColor">
      <path d="M24 22q0-4 4-4h48v64H28q-4 0-4-4Z" strokeWidth="2" />
      <path d="M30 18v64" strokeWidth="1.2" opacity=".6" />
      <rect x="37" y="25" width="32" height="50" strokeWidth=".8" opacity=".45" />
      <path d="M76 44h4q2 0 2 2v8q0 2-2 2h-4" strokeWidth="1.6" opacity=".8" />
      <path
        fill="currentColor"
        stroke="none"
        d="M53 33 54.6 39v6.4h6.2L66 48l-5.2 2.4h-6.2V63L53 69l-1.6-6V50.4h-6.2L40 48l5.2-2.6h6.2V39Z"
        style={{ filter: 'drop-shadow(0 0 4px rgba(232,230,227,.6))' }}
      />
    </svg>
  );
}

/** Котик за окном под дождём — для пустого блокнота. Капли медленно стекают. */
export function CatRain() {
  const id = useId().replace(/:/g, '');
  const drops: [number, number, number][] = [
    [22, 18, 1.6], [38, 40, 1.1], [57, 14, 1.3], [80, 30, 1.8], [104, 20, 1.2], [122, 44, 1.5],
    [30, 70, 1.3], [92, 62, 1.1], [116, 80, 1.7], [48, 92, 1.2], [70, 100, 1.4], [128, 104, 1.1],
  ];
  return (
    <svg viewBox="0 0 150 130" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}g`} cx="50%" cy="35%">
          <stop offset="0" stopColor="#e8e6e3" stopOpacity=".12" />
          <stop offset="1" stopColor="#e8e6e3" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}c`}>
          <path d="M15 124V48a60 46 0 0 1 120 0v76Z" />
        </clipPath>
      </defs>
      {/* стрельчатое окно */}
      <path d="M15 124V48a60 46 0 0 1 120 0v76Z" fill="#0e0e10" />
      <g clipPath={`url(#${id}c)`}>
        <rect width="150" height="130" fill={`url(#${id}g)`} />
        <g className="rain" fill="#8a8a8f">
          {drops.map(([x, y, r], i) => (
            <g key={i} style={{ animationDelay: `${(i * 0.73) % 5}s` }}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 1.25} opacity=".55" />
              <path d={`M${x - r * 0.3} ${y - r} q${r * 0.3} -${r * 3} ${r * 0.6} 0`} opacity=".18" />
            </g>
          ))}
        </g>
        {/* котик снаружи, смотрит сквозь стекло */}
        <g fill="#050505">
          <path d="M44 124c-2-18 6-34 31-34s33 16 31 34Z" />
          <circle cx="75" cy="86" r="19" />
          <path d="M58.5 78 56 58l14 14Z" />
          <path d="M80 72l14-14-2.5 20Z" />
        </g>
        <g fill="#e8e6e3" style={{ filter: 'drop-shadow(0 0 3px #e8e6e3)' }}>
          <ellipse cx="67.5" cy="86" rx="2.6" ry="3" />
          <ellipse cx="82.5" cy="86" rx="2.6" ry="3" />
        </g>
        <path d="M72.5 93q2.5 2 5 0" stroke="#55555a" strokeWidth=".8" fill="none" />
      </g>
      {/* переплёт и рама */}
      <g stroke="#2a2a2e" fill="none">
        <path d="M15 124V48a60 46 0 0 1 120 0v76Z" strokeWidth="1.6" />
        <path d="M75 2v122" strokeWidth="1" />
        <path d="M15 62h120" strokeWidth="1" />
      </g>
      <path d="M6 124h138" stroke="#2a2a2e" strokeWidth="1.2" />
      <path fill="#2a2a2e" d="M24 124l3-4 1 4ZM118 124l2 3.5 1.5-3.5ZM132 124l3-4 1 4Z" />
    </svg>
  );
}

/** Свеча — для пустой корзины и архива. */
export function Candle() {
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true">
      <defs>
        <radialGradient id="candle-glow">
          <stop offset="0" stopColor="#e8e6e3" stopOpacity=".28" />
          <stop offset=".5" stopColor="#e8e6e3" stopOpacity=".06" />
          <stop offset="1" stopColor="#e8e6e3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="34" r="34" fill="url(#candle-glow)" />
      <path className="flame" d="M60 20c5 7 6 12 0 18-6-6-5-11 0-18Z" fill="#e8e6e3" style={{ filter: 'drop-shadow(0 0 6px #e8e6e3)' }} />
      <path d="M60 38v6" stroke="#55555a" strokeWidth="1" />
      <path d="M50 44h20v50H50Z" fill="#141416" stroke="#2a2a2e" />
      <path d="M50 44q4 6 6 1 2 10 5 2 3 6 9-3" fill="none" stroke="#55555a" strokeWidth=".8" />
      <path d="M36 94h48l-6 8H42Z" fill="#141416" stroke="#2a2a2e" />
      <path d="M14 102h92" stroke="#2a2a2e" />
    </svg>
  );
}

/* ── иконки интерфейса ── */
type IP = { className?: string };
const S = (p: { children: ReactNode; className?: string }) => (
  <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {p.children}
  </svg>
);

export const IconBook = (p: IP) => (
  <S {...p}>
    <path d="M5 5.5Q5 4 6.5 4H19v16H6.5Q5 20 5 18.5Z" />
    <path d="M7.5 4v16" opacity=".6" />
    <path d="M13 8.5v7M10.5 11h5" />
  </S>
);
export const IconTag = (p: IP) => (
  <S {...p}>
    <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3-8.7 8.7Z" />
    <path d="m8 6.5.9 1.6L8 9.6 7.1 8.1Z" fill="currentColor" />
  </S>
);
export const IconMore = (p: IP) => (
  <S {...p}>
    <path d="m12 4 1 2-1 2-1-2Z M12 10l1 2-1 2-1-2Z M12 16l1 2-1 2-1-2Z" fill="currentColor" />
  </S>
);
export const IconDots = (p: IP) => (
  <S {...p}>
    <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth="2.6" />
  </S>
);
export const IconBack = (p: IP) => (
  <S {...p}>
    <path d="M15 5 8 12l7 7" />
  </S>
);
export const IconChevron = (p: IP) => (
  <S {...p}>
    <path d="m9 5 7 7-7 7" />
  </S>
);
export const IconPlus = (p: IP) => (
  <S {...p}>
    <path d="M12 3.5 13 9v2h2l5.5 1-5.5 1h-2v2l-1 5.5-1-5.5v-2H9l-5.5-1L9 11h2V9Z" fill="currentColor" strokeWidth="1" />
  </S>
);
export const IconSearch = (p: IP) => (
  <S {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5 5" />
  </S>
);
export const IconClose = (p: IP) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </S>
);
/** Закрепить — крест; залитый, когда закреплено. */
export const IconPin = ({ className, on }: IP & { on?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2.5 13.3 7v3h3.4l3.3 1.5-3.3 1.4h-3.4v6.8L12 22l-1.3-2.3v-6.8H7.3L4 11.5 7.3 10h3.4V7Z"
      fill={on ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);
/** Светлая страница — полукруг инверсии. */
export const IconInvert = ({ className, on }: IP & { on?: boolean }) => (
  <S className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" opacity={on ? 1 : 0.35} />
  </S>
);
export const IconList = (p: IP) => (
  <S {...p}>
    <path d="M4 5.5h4v4H4ZM4 14.5h4v4H4Z" />
    <path d="m4.8 16.6 1.2 1.2 2.6-3" />
    <path d="M11 7.5h9M11 16.5h9" />
  </S>
);
export const IconText = (p: IP) => (
  <S {...p}>
    <path d="M4 6h16M4 10h16M4 14h16M4 18h10" />
  </S>
);
export const IconGrid = (p: IP) => (
  <S {...p}>
    <path d="M4 4h7v9H4ZM13 4h7v5h-7ZM13 11h7v9h-7ZM4 15h7v5H4Z" />
  </S>
);
export const IconRows = (p: IP) => (
  <S {...p}>
    <path d="M4 4h16v7H4ZM4 13h16v7H4Z" />
  </S>
);
export const IconArchive = (p: IP) => (
  <S {...p}>
    <path d="M3.5 4.5h17v4h-17ZM5 8.5V19.5h14V8.5" />
    <path d="M10 12h4" />
  </S>
);
export const IconTrash = (p: IP) => (
  <S {...p}>
    <path d="M4 6.5h16M9.5 6.5V4h5v2.5M6 6.5l1 13.5h10l1-13.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </S>
);
export const IconRestore = (p: IP) => (
  <S {...p}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" />
    <path d="M4 4v4h4" />
  </S>
);
export const IconCopy = (p: IP) => (
  <S {...p}>
    <path d="M8 8h11v12H8Z" />
    <path d="M5 16V4h11" />
  </S>
);
export const IconShare = (p: IP) => (
  <S {...p}>
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" />
    <path d="M5 12v8h14v-8" />
  </S>
);
export const IconDownload = (p: IP) => (
  <S {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M5 19h14" />
  </S>
);
export const IconUpload = (p: IP) => (
  <S {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
    <path d="M5 19h14" />
  </S>
);
export const IconEdit = (p: IP) => (
  <S {...p}>
    <path d="m15 5 4 4L9 19H5v-4Z" />
  </S>
);
export const IconCheck = (p: IP) => (
  <S {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </S>
);
