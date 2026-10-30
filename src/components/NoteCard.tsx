import { useMemo } from 'react';
import { shortWhen } from '../domain/format';
import { daysLeft, type Note } from '../domain/notes';
import { Cross } from './art';
import { usePress } from './ui';

const MAX_ITEMS = 6;

export function NoteCard({ note, onOpen, onMenu }: { note: Note; onOpen: (n: Note) => void; onMenu: (n: Note) => void }) {
  const press = usePress(
    () => onOpen(note),
    () => onMenu(note),
  );
  const items = useMemo(() => {
    const list = note.items.filter((i) => i.text.trim());
    return [...list.filter((i) => !i.done), ...list.filter((i) => i.done)];
  }, [note.items]);

  const body = note.kind === 'text' ? note.body.trim().slice(0, 600) : '';
  const blank = !note.title.trim() && !body && !items.length;

  return (
    <button className={`note-card ${note.pinned ? 'pinned' : ''} ${note.inverted ? 'inv' : ''}`} {...press}>
      {note.pinned && <Cross className="nc-pin" />}
      {note.title.trim() && <h3 className="nc-title">{note.title}</h3>}
      {body && <div className="nc-body">{body}</div>}
      {note.kind === 'list' && items.length > 0 && (
        <ul className="nc-items">
          {items.slice(0, MAX_ITEMS).map((i) => (
            <li key={i.id} className={`nc-item ${i.done ? 'done' : ''}`}>
              <span className="box" />
              <span>{i.text}</span>
            </li>
          ))}
        </ul>
      )}
      {items.length > MAX_ITEMS && <div className="nc-more">+ ещё {items.length - MAX_ITEMS}</div>}
      {blank && <div className="nc-body">…</div>}
      {note.state === 'trashed' && <div className="nc-note">удалится через {daysLeft(note)} дн.</div>}
      <div className="nc-meta">
        <div className="nc-tags">
          {note.tags.slice(0, 3).map((t) => (
            <span key={t} className="nc-tag">
              #{t}
            </span>
          ))}
        </div>
        <span className="nc-date">{shortWhen(note.updatedAt)}</span>
      </div>
    </button>
  );
}

/** Примерная высота карточки — чтобы разложить сетку в две колонки без дыр. */
function weight(n: Note): number {
  let w = 2 + (n.title ? Math.ceil(n.title.length / 18) : 0) + (n.tags.length ? 1 : 0);
  if (n.kind === 'text') {
    const lines = n.body.split('\n').reduce((s, l) => s + Math.max(1, Math.ceil(l.length / 22)), 0);
    w += Math.min(9, n.body.trim() ? lines : 1);
  } else w += Math.min(MAX_ITEMS + 1, n.items.filter((i) => i.text.trim()).length);
  return w;
}

export function NoteGrid({ notes, view, onOpen, onMenu }: { notes: Note[]; view: 'grid' | 'rows'; onOpen: (n: Note) => void; onMenu: (n: Note) => void }) {
  const cols = useMemo(() => {
    if (view === 'rows') return [notes];
    const c: [Note[], Note[]] = [[], []];
    const h = [0, 0];
    for (const n of notes) {
      const i = h[0] <= h[1] ? 0 : 1;
      c[i].push(n);
      h[i] += weight(n);
    }
    return c;
  }, [notes, view]);

  if (view === 'rows')
    return (
      <div className="rows">
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} onOpen={onOpen} onMenu={onMenu} />
        ))}
      </div>
    );
  return (
    <div className="masonry">
      {cols.map((col, i) => (
        <div className="col" key={i}>
          {col.map((n) => (
            <NoteCard key={n.id} note={n} onOpen={onOpen} onMenu={onMenu} />
          ))}
        </div>
      ))}
    </div>
  );
}
