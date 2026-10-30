/* Чистая логика записей: без базы и без React, чтобы легко тестировать. */

export type NoteKind = 'text' | 'list';
export type NoteState = 'active' | 'archived' | 'trashed';

export interface ListItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  /** текст для kind = 'text' */
  body: string;
  /** пункты для kind = 'list' */
  items: ListItem[];
  /** метки в том виде, как их ввели; сравниваются без учёта регистра */
  tags: string[];
  pinned: boolean;
  /** «светлая страница» — инверсия вместо цветного акцента */
  inverted: boolean;
  state: NoteState;
  createdAt: number;
  updatedAt: number;
  /** когда попала в корзину; 0 — не в корзине */
  trashedAt: number;
}

/** Сколько дней запись лежит в корзине до окончательного удаления. */
export const TRASH_DAYS = 30;

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

export function newNote(kind: NoteKind = 'text', now = Date.now(), tags: string[] = []): Note {
  return {
    id: uid(),
    kind,
    title: '',
    body: '',
    items: kind === 'list' ? [{ id: uid(), text: '', done: false }] : [],
    tags,
    pinned: false,
    inverted: false,
    state: 'active',
    createdAt: now,
    updatedAt: now,
    trashedAt: 0,
  };
}

export function isEmpty(n: Note): boolean {
  if (n.title.trim()) return false;
  if (n.kind === 'text') return !n.body.trim();
  return n.items.every((i) => !i.text.trim());
}

/** Текст пунктов для превью, поиска и копирования: «☐ хлеб» / «☒ молоко». */
export function itemsToText(items: ListItem[], marks = true): string {
  return items
    .filter((i) => i.text.trim())
    .map((i) => (marks ? (i.done ? '☒ ' : '☐ ') : '') + i.text)
    .join('\n');
}

/** Текст → пункты: каждая непустая строка — пункт; «- [x]», «☒», «- » в начале понимаются. */
export function textToItems(text: string): ListItem[] {
  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = /^(?:[-*•]\s*)?(?:\[([ xXхХ])\]|([☐☒✓✔]))?\s*(.*)$/.exec(line)!;
      const done = (m[1] !== undefined && m[1] !== ' ') || m[2] === '☒' || m[2] === '✓' || m[2] === '✔';
      return { id: uid(), text: m[3], done };
    })
    .filter((i) => i.text);
  return items.length ? items : [{ id: uid(), text: '', done: false }];
}

/** Переключить вид записи без потери содержимого. */
export function convert(n: Note, kind: NoteKind): Note {
  if (n.kind === kind) return n;
  if (kind === 'list') return { ...n, kind, items: textToItems(n.body), body: '' };
  return { ...n, kind, body: itemsToText(n.items, false), items: [] };
}

export function plainText(n: Note): string {
  const body = n.kind === 'text' ? n.body : itemsToText(n.items);
  return [n.title.trim(), body.trim()].filter(Boolean).join('\n\n');
}

export const tagKey = (t: string): string => t.trim().toLowerCase().replace(/^#+/, '');

export function cleanTag(t: string): string {
  return t.trim().replace(/^#+/, '').replace(/\s+/g, ' ').slice(0, 32);
}

export function hasTag(n: Note, tag: string): boolean {
  const k = tagKey(tag);
  return n.tags.some((t) => tagKey(t) === k);
}

export function toggleTag(n: Note, tag: string): Note {
  const k = tagKey(tag);
  if (!k) return n;
  const tags = hasTag(n, tag) ? n.tags.filter((t) => tagKey(t) !== k) : [...n.tags, cleanTag(tag)];
  return { ...n, tags };
}

export function matches(n: Note, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [n.title, n.body, ...n.items.map((i) => i.text), ...n.tags].join('\n').toLowerCase();
  return s.split(/\s+/).every((w) => hay.includes(w.replace(/^#/, '')));
}

/** Закреплённые сверху, внутри — по свежести правки. */
export function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

export interface TagStat {
  /** как показывать — самое частое написание */
  name: string;
  key: string;
  count: number;
}

/** Все метки активных записей с количеством, по алфавиту. */
export function collectTags(notes: Note[]): TagStat[] {
  const map = new Map<string, { count: number; spell: Map<string, number> }>();
  for (const n of notes) {
    if (n.state !== 'active') continue;
    const seen = new Set<string>();
    for (const t of n.tags) {
      const k = tagKey(t);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      let e = map.get(k);
      if (!e) map.set(k, (e = { count: 0, spell: new Map() }));
      e.count++;
      e.spell.set(t, (e.spell.get(t) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([key, e]) => ({ key, count: e.count, name: [...e.spell.entries()].sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
}

export function renameTag(n: Note, from: string, to: string): Note {
  if (!hasTag(n, from)) return n;
  const k = tagKey(from);
  const name = cleanTag(to);
  const rest = n.tags.filter((t) => tagKey(t) !== k && tagKey(t) !== tagKey(name));
  return { ...n, tags: name ? [...rest, name] : rest };
}

/** Записи из корзины, срок которых вышел. */
export function expired(notes: Note[], now = Date.now()): Note[] {
  const limit = now - TRASH_DAYS * 86_400_000;
  return notes.filter((n) => n.state === 'trashed' && n.trashedAt > 0 && n.trashedAt < limit);
}

export function daysLeft(n: Note, now = Date.now()): number {
  return Math.max(0, Math.ceil((n.trashedAt + TRASH_DAYS * 86_400_000 - now) / 86_400_000));
}
