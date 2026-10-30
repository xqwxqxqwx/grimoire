import { useEffect, useMemo, useRef, useState } from 'react';
import { db, emptyTrash } from '../db/db';
import { makeBackup, mergeNotes, parseBackup } from '../domain/backup';
import { notesWord } from '../domain/format';
import { TRASH_DAYS, type Note } from '../domain/notes';
import { setSettings, useSettings } from '../store';
import {
  Candle,
  Grimoire,
  IconArchive,
  IconBack,
  IconChevron,
  IconDownload,
  IconGrid,
  IconRows,
  IconTrash,
  IconUpload,
} from '../components/art';
import { NoteGrid } from '../components/NoteCard';
import type { Notify } from '../components/NoteMenu';
import { TitleHead } from '../components/ui';

export type Bin = 'archived' | 'trashed';

interface Props {
  notes: Note[];
  bin: Bin | null;
  onBin: (b: Bin | null) => void;
  onOpen: (n: Note) => void;
  onMenu: (n: Note) => void;
  notify: Notify;
}

export function MoreScreen({ notes, bin, onBin, onOpen, onMenu, notify }: Props) {
  if (bin) return <BinScreen notes={notes} bin={bin} onBack={() => onBin(null)} onOpen={onOpen} onMenu={onMenu} notify={notify} />;
  return <Settings notes={notes} onBin={onBin} notify={notify} />;
}

function Settings({ notes, onBin, notify }: { notes: Note[]; onBin: (b: Bin) => void; notify: Notify }) {
  const { view } = useSettings();
  const file = useRef<HTMLInputElement>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const count = (s: Note['state']) => notes.filter((n) => n.state === s).length;

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null));
  }, []);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(makeBackup(notes), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = `grimoire-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    notify(`сохранено: ${notesWord(notes.length)}`);
  };

  const importFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const incoming = parseBackup(await f.text());
      const { put, added, updated } = mergeNotes(notes, incoming);
      await db.notes.bulkPut(put);
      notify(put.length ? `добавлено ${added} · обновлено ${updated}` : 'всё это уже есть');
    } catch (e) {
      notify(`не получилось: ${(e as Error).message}`);
    }
  };

  return (
    <section className="screen">
      <TitleHead title="Ещё" sub="хранилище и вид" />

      <div className="section-title">вид</div>
      <div className="card">
        <div className="setting static">
          <span>
            <span className="setting-label">Карточки</span>
            <span className="setting-hint">{view === 'grid' ? 'две колонки, как доска' : 'одна колонка, крупнее'}</span>
          </span>
          <div className="seg" role="radiogroup" aria-label="Вид карточек">
            <button className={view === 'grid' ? 'on' : ''} onClick={() => setSettings({ view: 'grid' })} role="radio" aria-checked={view === 'grid'} aria-label="Сетка">
              <IconGrid />
            </button>
            <button className={view === 'rows' ? 'on' : ''} onClick={() => setSettings({ view: 'rows' })} role="radio" aria-checked={view === 'rows'} aria-label="Список">
              <IconRows />
            </button>
          </div>
        </div>
      </div>

      <div className="section-title">хранилище</div>
      <div className="card">
        <button className="setting" onClick={() => onBin('archived')}>
          <span>
            <span className="setting-label">Архив</span>
            <span className="setting-hint">убрано с глаз, но не забыто</span>
          </span>
          <span className="val">
            {count('archived')}
            <IconChevron />
          </span>
        </button>
        <button className="setting" onClick={() => onBin('trashed')}>
          <span>
            <span className="setting-label">Корзина</span>
            <span className="setting-hint">хранится {TRASH_DAYS} дней</span>
          </span>
          <span className="val">
            {count('trashed')}
            <IconChevron />
          </span>
        </button>
      </div>

      <div className="section-title">копия</div>
      <div className="card">
        <button className="setting" onClick={exportAll} disabled={!notes.length}>
          <span>
            <span className="setting-label">Сохранить копию</span>
            <span className="setting-hint">все записи в один файл JSON</span>
          </span>
          <span className="val">
            <IconDownload />
          </span>
        </button>
        <button className="setting" onClick={() => file.current?.click()}>
          <span>
            <span className="setting-label">Восстановить из копии</span>
            <span className="setting-hint">новое добавится, свежее заменит старое</span>
          </span>
          <span className="val">
            <IconUpload />
          </span>
        </button>
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <div className="about">
        <Grimoire className="mark" />
        <div>Гримуар · 1.0</div>
        <div>записи живут только на этом устройстве{persisted ? ' · хранилище защищено' : ''}.</div>
        <div>время от времени сохраняй копию.</div>
      </div>
    </section>
  );
}

function BinScreen({ notes, bin, onBack, onOpen, onMenu, notify }: { notes: Note[]; bin: Bin; onBack: () => void; onOpen: (n: Note) => void; onMenu: (n: Note) => void; notify: Notify }) {
  const { view } = useSettings();
  const [sure, setSure] = useState(false);
  const list = useMemo(
    () =>
      notes
        .filter((n) => n.state === bin)
        .sort((a, b) => (bin === 'trashed' ? b.trashedAt - a.trashedAt : b.updatedAt - a.updatedAt)),
    [notes, bin],
  );
  const trash = bin === 'trashed';

  return (
    <section className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Назад">
          <IconBack />
        </button>
        <span className="topbar-title grow">{trash ? 'Корзина' : 'Архив'}</span>
        {trash ? <IconTrash className="topbar-ico" /> : <IconArchive className="topbar-ico" />}
        <span style={{ width: 12 }} />
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <Candle />
          <div className="phrase">{trash ? 'корзина пуста.' : 'архив пуст.'}</div>
          <div className="sub">{trash ? 'ничто не потеряно.' : 'здесь будет то, что отложено на потом.'}</div>
        </div>
      ) : (
        <>
          <div className="section-title">
            <span>{trash ? `удаляются через ${TRASH_DAYS} дней` : notesWord(list.length)}</span>
            {trash && (
              <button
                className="act"
                onClick={async () => {
                  if (!sure) return setSure(true);
                  const n = await emptyTrash();
                  setSure(false);
                  notify(`удалено навсегда: ${notesWord(n)}`);
                }}
              >
                {sure ? 'точно? ещё раз' : 'очистить'}
              </button>
            )}
          </div>
          <NoteGrid notes={list} view={view} onOpen={trash ? onMenu : onOpen} onMenu={onMenu} />
        </>
      )}
    </section>
  );
}
