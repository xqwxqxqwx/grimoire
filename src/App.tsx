import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackClose } from './backStack';
import { db, patchNote, restore, saveNote, toArchive, toTrash } from './db/db';
import { collectTags, newNote, type Note, type NoteKind } from './domain/notes';
import { useSettings } from './store';
import { IconList, IconPlus } from './components/art';
import { Editor, type EditorExit } from './components/Editor';
import { Nav, type Tab } from './components/Nav';
import { NoteMenu, type Notify } from './components/NoteMenu';
import { MoreScreen, type Bin } from './screens/MoreScreen';
import { NotesScreen } from './screens/NotesScreen';
import { TagsScreen } from './screens/TagsScreen';

interface Toast {
  id: number;
  text: string;
  undo?: () => void;
}

export function App() {
  const notes = useLiveQuery(() => db.notes.toArray(), []);
  const { view } = useSettings();

  const [tab, setTab] = useState<Tab>('notes');
  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [bin, setBin] = useState<Bin | null>(null);
  const [editing, setEditing] = useState<{ note: Note; isNew: boolean } | null>(null);
  const [menu, setMenu] = useState<Note | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef(0);

  const tags = useMemo(() => collectTags(notes ?? []), [notes]);

  const closeBin = useCallback(() => setBin(null), []);
  useBackClose(bin !== null, closeBin);

  const notify: Notify = useCallback((text, undo) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 6000 : 2600);
  }, []);

  // убрать сплэш после первой загрузки записей
  useEffect(() => {
    if (!notes) return;
    const s = document.getElementById('splash');
    s?.classList.add('gone');
    const t = setTimeout(() => s?.remove(), 500);
    return () => clearTimeout(t);
  }, [notes]);

  // метку, которой больше нет, снимаем с фильтра
  useEffect(() => {
    if (filter && notes && !tags.some((t) => t.key === filter)) setFilter(null);
  }, [filter, tags, notes]);

  const openNote = useCallback((n: Note) => setEditing({ note: n, isNew: false }), []);
  const newOne = (kind: NoteKind) => {
    const tag = filter ? tags.find((t) => t.key === filter)?.name : undefined;
    setEditing({ note: newNote(kind, Date.now(), tag ? [tag] : []), isNew: true });
  };

  const onExit = useCallback(
    async (how: EditorExit, note: Note, kept: boolean) => {
      setEditing(null);
      if (!kept) {
        if (how !== 'close') notify('пустая запись не сохранена');
        return;
      }
      if (how === 'trash') {
        await toTrash(note.id);
        notify('в корзине', () => void saveNote(note));
      } else if (how === 'archive') {
        await toArchive(note.id);
        notify('в архиве', () => void saveNote(note));
      } else if (how === 'unarchive') {
        await restore(note.id);
        notify('вернулась к записям', () => void patchNote(note.id, { state: 'archived' }, false));
      }
    },
    [notify],
  );

  const goTab = (t: Tab) => {
    setBin(null);
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  const pickTag = (key: string) => {
    setFilter(key);
    setQuery('');
    goTab('notes');
  };

  let screen = null;
  if (notes) {
    if (tab === 'tags') screen = <TagsScreen notes={notes} tags={tags} onPick={pickTag} notify={notify} />;
    else if (tab === 'more')
      screen = (
        <MoreScreen
          notes={notes}
          bin={bin}
          onBin={(b) => {
            setBin(b);
            window.scrollTo({ top: 0 });
          }}
          onOpen={openNote}
          onMenu={setMenu}
          notify={notify}
        />
      );
    else
      screen = (
        <NotesScreen
          notes={notes}
          tags={tags}
          filter={filter}
          onFilter={setFilter}
          query={query}
          onQuery={setQuery}
          view={view}
          onOpen={openNote}
          onMenu={setMenu}
          onNew={newOne}
        />
      );
  }

  const hasNotes = !!notes?.some((n) => n.state === 'active');

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <main className="app">{screen}</main>

      {tab === 'notes' && hasNotes && !editing && (
        <>
          <button className="fab fab-mini" onClick={() => newOne('list')} aria-label="Новый список">
            <IconList />
          </button>
          <button className="fab" onClick={() => newOne('text')} aria-label="Новая запись">
            <IconPlus />
          </button>
        </>
      )}
      <Nav tab={tab} onTab={goTab} />

      {editing && <Editor key={editing.note.id} initial={editing.note} isNew={editing.isNew} allTags={tags} onExit={onExit} notify={notify} />}
      {menu && <NoteMenu note={menu} allTags={tags} onOpen={openNote} onClose={() => setMenu(null)} notify={notify} />}

      {toast && (
        <div className={`toast ${toast.undo ? '' : 'solo'} ${editing ? 'high' : ''}`} key={toast.id} role="status">
          <span className="toast-text">{toast.text}</span>
          {toast.undo && (
            <button
              className="toast-act"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
            >
              отменить
            </button>
          )}
        </div>
      )}
    </>
  );
}
