import { useState } from 'react';
import { db } from '../db/db';
import { plural } from '../domain/format';
import { cleanTag, hasTag, renameTag, type Note, type TagStat } from '../domain/notes';
import { IconDots, IconEdit, IconTrash, ThornDivider } from '../components/art';
import type { Notify } from '../components/NoteMenu';
import { Sheet, TitleHead } from '../components/ui';

async function retag(notes: Note[], from: string, to: string) {
  // переименование не считается правкой записи — дату не трогаем
  const changed = notes.filter((n) => hasTag(n, from)).map((n) => renameTag(n, from, to));
  await db.notes.bulkPut(changed);
}

export function TagsScreen({ notes, tags, onPick, notify }: { notes: Note[]; tags: TagStat[]; onPick: (key: string) => void; notify: Notify }) {
  const [menu, setMenu] = useState<TagStat | null>(null);
  const [draft, setDraft] = useState('');
  const [sure, setSure] = useState(false);
  const untagged = notes.filter((n) => n.state === 'active' && !n.tags.length).length;

  const open = (t: TagStat) => {
    setMenu(t);
    setDraft(t.name);
    setSure(false);
  };

  return (
    <section className="screen">
      <TitleHead title="Метки" sub={`${tags.length} ${plural(tags.length, 'метка', 'метки', 'меток')}`} />
      <ThornDivider />

      {tags.length === 0 ? (
        <div className="empty small">
          <div className="phrase">меток пока нет.</div>
          <div className="sub">открой запись и нажми на ярлык сверху — так записи найдут друг друга.</div>
        </div>
      ) : (
        <div className="card">
          {tags.map((t) => (
            <div key={t.key} className="setting" style={{ padding: '0 4px 0 16px' }}>
              <button style={{ flex: 1, minWidth: 0, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }} onClick={() => onPick(t.key)}>
                <span className="setting-label">
                  <span className="tag-mark">#</span>
                  {t.name}
                </span>
                <span className="val">{t.count}</span>
              </button>
              <button className="icon-btn" onClick={() => open(t)} aria-label={`Действия с меткой ${t.name}`}>
                <IconDots />
              </button>
            </div>
          ))}
        </div>
      )}
      {tags.length > 0 && untagged > 0 && (
        <div className="section-title">
          <span>без меток</span>
          <span>{untagged}</span>
        </div>
      )}

      {menu && (
        <Sheet onClose={() => setMenu(null)}>
          <div className="sheet-head">
            <div className="t">#{menu.name}</div>
            <div className="s">{`${menu.count} ${plural(menu.count, 'запись', 'записи', 'записей')}`}</div>
          </div>
          <form
            className="tag-input"
            onSubmit={async (e) => {
              e.preventDefault();
              const to = cleanTag(draft);
              if (!to || to === menu.name) return setMenu(null);
              await retag(notes, menu.name, to);
              setMenu(null);
              notify(`теперь #${to}`);
            }}
          >
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="новое имя" maxLength={32} enterKeyHint="done" />
            <button className="btn" type="submit" aria-label="Переименовать">
              <IconEdit />
            </button>
          </form>
          <button
            className={`sheet-act ${sure ? 'confirm' : ''}`}
            onClick={async () => {
              if (!sure) return setSure(true);
              const before = notes.filter((n) => hasTag(n, menu.name));
              await retag(notes, menu.name, '');
              setMenu(null);
              notify('метка снята', () => void db.notes.bulkPut(before));
            }}
          >
            <IconTrash />
            {sure ? 'Снять со всех записей? Нажми ещё раз' : 'Удалить метку'}
          </button>
          <div className="sheet-note">сами записи останутся на месте.</div>
        </Sheet>
      )}
    </section>
  );
}
