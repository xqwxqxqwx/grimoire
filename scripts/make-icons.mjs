// Генерирует иконки блокнота: закрытый гримуар с острым крестом и колючими уголками.
// Запуск: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const out = 'public/icons';
mkdirSync(out, { recursive: true });

/** Острый крест с заточенными концами, по центру обложки. */
const cross = 'M53 33 54.6 39v6.4h6.2L66 48l-5.2 2.4h-6.2V63L53 69l-1.6-6V50.4h-6.2L40 48l5.2-2.6h6.2V39Z';

/** Колючий уголок обложки; рисуется в левом верхнем углу и отражается в остальные. */
const corner = 'M0 0h11C8 1.2 5 2 3.4 3.4 2 5 1.2 8 0 11Z M3 3l7 1.4-5 .8Z M3 3l1.4 7 .8-5Z';

function mark({ bg, pad = 0, mono = false }) {
  const s = (100 - pad * 2) / 100;
  const ink = mono ? '#ffffff' : '#e8e6e3';
  // обложка: x 30…76, y 18…82; корешок слева
  const corners = [
    [33, 21, 1, 1],
    [73, 21, -1, 1],
    [33, 79, 1, -1],
    [73, 79, -1, -1],
  ]
    .map(([x, y, sx, sy]) => `<path d="${corner}" transform="translate(${x} ${y}) scale(${sx} ${sy})" fill="${ink}" opacity=".85"/>`)
    .join('');
  const g = `
    <g transform="translate(${pad} ${pad}) scale(${s})">
      ${mono ? '' : '<path d="M24 22q0-4 4-4h48v64H28q-4 0-4-4Z" fill="#141416"/>'}
      <path d="M24 22q0-4 4-4h48v64H28q-4 0-4-4Z" fill="none" stroke="${ink}" stroke-width="1.6" opacity=".9"/>
      <path d="M30 18v64" stroke="${ink}" stroke-width="1" opacity=".6"/>
      <path d="M26 30h4M26 70h4" stroke="${ink}" stroke-width="1.6" opacity=".7"/>
      <rect x="37" y="25" width="32" height="50" fill="none" stroke="${ink}" stroke-width=".6" opacity="${mono ? 0.6 : 0.4}"/>
      ${corners}
      <path d="M76 44h4q2 0 2 2v8q0 2-2 2h-4" fill="none" stroke="${ink}" stroke-width="1.4" opacity=".8"/>
      <path d="${cross}" fill="${ink}" ${mono ? '' : 'filter="url(#glow)"'}/>
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="light" cx="50%" cy="42%" r="60%">
      <stop offset="0" stop-color="#26262a"/>
      <stop offset="1" stop-color="#0b0b0c"/>
    </radialGradient>
  </defs>
  ${bg ? '<rect width="100" height="100" fill="url(#light)"/>' : ''}
  ${g}
</svg>`;
}

const icon = mark({ bg: true, pad: 6 });
const maskable = mark({ bg: true, pad: 16 }); // безопасная зона для Android
writeFileSync(`${out}/icon.svg`, icon);
writeFileSync(`${out}/icon-mark.svg`, mark({ bg: false }));

const png = (svg, size, name) => sharp(Buffer.from(svg), { density: 72 * (size / 100) }).resize(size, size).png().toFile(`${out}/${name}`);
await png(icon, 192, 'icon-192.png');
await png(icon, 512, 'icon-512.png');
await png(maskable, 512, 'icon-maskable-512.png');
await png(mark({ bg: false, pad: 16, mono: true }), 512, 'icon-mono-512.png'); // тематические иконки Android 13+
await png(mark({ bg: true, pad: 10 }), 180, 'apple-touch-icon.png');
console.log('icons ok');
