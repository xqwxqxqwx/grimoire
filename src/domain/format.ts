const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

const pad = (n: number) => String(n).padStart(2, '0');
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function dayDiff(a: Date, b: Date): number {
  const x = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const y = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((y - x) / 86_400_000);
}

/** Коротко для карточки: «14:52», «вчера», «12 окт», «12.10.24». */
export function shortWhen(ts: number, now = Date.now()): string {
  const d = new Date(ts);
  const n = new Date(now);
  const diff = dayDiff(d, n);
  if (diff === 0) return hm(d);
  if (diff === 1) return 'вчера';
  if (d.getFullYear() === n.getFullYear()) return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
}

/** Подробно для редактора: «сегодня, 14:52», «вчера, 09:10», «12 октября, 18:00», «12 октября 2024». */
export function longWhen(ts: number, now = Date.now()): string {
  const d = new Date(ts);
  const n = new Date(now);
  const diff = dayDiff(d, n);
  if (diff === 0) return `сегодня, ${hm(d)}`;
  if (diff === 1) return `вчера, ${hm(d)}`;
  if (d.getFullYear() === n.getFullYear()) return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}, ${hm(d)}`;
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

export const notesWord = (n: number) => `${n} ${plural(n, 'запись', 'записи', 'записей')}`;
