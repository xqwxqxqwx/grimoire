import Dexie, { type EntityTable } from 'dexie';
import { expired, type Note } from '../domain/notes';

class NotesDB extends Dexie {
  notes!: EntityTable<Note, 'id'>;

  constructor() {
    super('grimoire');
    this.version(1).stores({
      notes: 'id, state, updatedAt, *tags',
    });
  }
}

export const db = new NotesDB();

export const saveNote = (n: Note) => db.notes.put(n);

export async function patchNote(id: string, patch: Partial<Note>, touch = true): Promise<void> {
  await db.notes.update(id, touch ? { ...patch, updatedAt: Date.now() } : patch);
}

export const toTrash = (id: string) => patchNote(id, { state: 'trashed', trashedAt: Date.now(), pinned: false }, false);
export const toArchive = (id: string) => patchNote(id, { state: 'archived', pinned: false }, false);
export const restore = (id: string) => patchNote(id, { state: 'active', trashedAt: 0 }, false);
export const destroy = (id: string) => db.notes.delete(id);

export async function emptyTrash(): Promise<number> {
  return db.notes.where('state').equals('trashed').delete();
}

/** Чистит корзину от записей старше срока. Запускается при старте. */
export async function purgeExpired(): Promise<void> {
  const trashed = await db.notes.where('state').equals('trashed').toArray();
  const old = expired(trashed);
  if (old.length) await db.notes.bulkDelete(old.map((n) => n.id));
}

/** Просим браузер не чистить хранилище, даже если место на телефоне кончается. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
