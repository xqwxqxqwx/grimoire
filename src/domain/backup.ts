import type { ListItem, Note } from './notes';
import { uid } from './notes';

export interface Backup {
  app: 'grimoire';
  version: 1;
  exportedAt: number;
  notes: Note[];
}

export function makeBackup(notes: Note[], now = Date.now()): Backup {
  return { app: 'grimoire', version: 1, exportedAt: now, notes };
}

const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** Разбирает файл бэкапа и чинит всё, что можно починить. Бросает ошибку, если это не наш файл. */
export function parseBackup(text: string, now = Date.now()): Note[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('это не JSON');
  }
  const raw = (data as { notes?: unknown })?.notes ?? data;
  if ((data as { app?: unknown })?.app !== 'grimoire' && !Array.isArray(data)) throw new Error('это не бэкап гримуара');
  if (!Array.isArray(raw)) throw new Error('в файле нет записей');

  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => {
      const kind = r.kind === 'list' ? 'list' : 'text';
      const items: ListItem[] = Array.isArray(r.items)
        ? r.items
            .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
            .map((i) => ({ id: str(i.id) || uid(), text: str(i.text), done: i.done === true }))
        : [];
      const state = r.state === 'archived' || r.state === 'trashed' ? r.state : 'active';
      const createdAt = num(r.createdAt, now);
      return {
        id: str(r.id) || uid(),
        kind,
        title: str(r.title),
        body: str(r.body),
        items: kind === 'list' && !items.length ? [{ id: uid(), text: '', done: false }] : items,
        tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string' && !!t.trim()) : [],
        pinned: r.pinned === true,
        inverted: r.inverted === true,
        state,
        createdAt,
        updatedAt: num(r.updatedAt, createdAt),
        trashedAt: state === 'trashed' ? num(r.trashedAt, now) : 0,
      } satisfies Note;
    });
}

/** Слияние: новые записи добавляются, у совпавших по id остаётся более свежая версия. */
export function mergeNotes(existing: Note[], incoming: Note[]): { put: Note[]; added: number; updated: number } {
  const byId = new Map(existing.map((n) => [n.id, n]));
  const put: Note[] = [];
  let added = 0;
  let updated = 0;
  for (const n of incoming) {
    const old = byId.get(n.id);
    if (!old) {
      added++;
      put.push(n);
    } else if (n.updatedAt > old.updatedAt) {
      updated++;
      put.push(n);
    }
  }
  return { put, added, updated };
}
