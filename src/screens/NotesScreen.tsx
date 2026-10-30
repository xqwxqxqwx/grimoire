import { useMemo } from 'react';
import { notesWord } from '../domain/format';
import { hasTag, matches, sortNotes, type Note, type NoteKind, type TagStat } from '../domain/notes';
import { CatRain, IconClose, IconList, IconSearch, IconText } from '../components/art';
import { NoteGrid } from '../components/NoteCard';
import { TitleHead } from '../components/ui';

interface Props {
  notes: Note[];
  tags: TagStat[];
  filter: string | null;
  onFilter: (t: string | null) => void;
  query: string;
  onQuery: (q: string) => void;
  view: 'grid' | 'rows';
  onOpen: (n: Note) => void;
  onMenu: (n: Note) => void;
  onNew: (kind: NoteKind) => void;
}

export function NotesScreen({ notes, tags, filter, onFilter, query, onQuery, view, onOpen, onMenu, onNew }: Props) {
  const active = useMemo(() => notes.filter((n) => n.state === 'active'), [notes]);
  const shown = useMemo(
    () => sortNotes(active.filter((n) => (!filter || hasTag(n, filter)) && matches(n, query))),
    [active, filter, query],
  );
  const pinned = shown.filter((n) => n.pinned);
  const rest = shown.filter((n) => !n.pinned);

  return (
    <section className="screen">
      <TitleHead title="Гримуар" sub={notesWord(active.length)} />

      {active.length === 0 ? (
        <div className="empty">
          <CatRain />
          <div className="phrase">страницы пусты.</div>
          <div className="sub">только дождь за окном. запиши первую мысль, пока она не ушла.</div>
          <div className="empty-actions">
            <button className="btn primary" onClick={() => onNew('text')}>
              <IconText />
              Запись
            </button>
            <button className="btn" onClick={() => onNew('list')}>
              <IconList />
              Список
            </button>
          </div>
        </div>
      ) : (
        <>
          <label className="search">
            <IconSearch />
            <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="искать в записях" enterKeyHint="search" type="search" />
            {query && (
              <button className="icon-btn" onClick={() => onQuery('')} aria-label="Очистить поиск">
                <IconClose />
              </button>
            )}
          </label>

          {tags.length > 0 && (
            <div className="chips" role="tablist">
              <button className={`chip ${!filter ? 'on' : ''}`} onClick={() => onFilter(null)} role="tab" aria-selected={!filter}>
                все
              </button>
              {tags.map((t) => {
                const on = filter?.toLowerCase() === t.key;
                return (
                  <button key={t.key} className={`chip ${on ? 'on' : ''}`} onClick={() => onFilter(on ? null : t.key)} role="tab" aria-selected={on}>
                    #{t.name} <span className="n">{t.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {shown.length === 0 ? (
            <div className="empty small">
              <div className="phrase">ничего не нашлось.</div>
              <div className="sub">тишина. попробуй другое слово.</div>
            </div>
          ) : pinned.length && rest.length ? (
            <>
              <div className="section-title">закреплено</div>
              <NoteGrid notes={pinned} view={view} onOpen={onOpen} onMenu={onMenu} />
              <div className="section-title">остальное</div>
              <NoteGrid notes={rest} view={view} onOpen={onOpen} onMenu={onMenu} />
            </>
          ) : (
            <>
              <div style={{ height: 16 }} />
              <NoteGrid notes={shown} view={view} onOpen={onOpen} onMenu={onMenu} />
            </>
          )}
        </>
      )}
    </section>
  );
}
