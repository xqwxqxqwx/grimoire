import { useState } from 'react';
import { destroy, patchNote, restore, saveNote, toArchive, toTrash } from '../db/db';
import { plainText, toggleTag, type Note, type TagStat } from '../domain/notes';
import { IconArchive, IconCopy, IconEdit, IconInvert, IconPin, IconRestore, IconTag, IconTrash } from './art';
import { TagSheet } from './TagSheet';
import { Sheet } from './ui';

export type Notify = (text: string, undo?: () => void) => void;

/** Быстрые действия по долгому нажатию на карточку. */
export function NoteMenu({ note, allTags, onOpen, onClose, notify }: { note: Note; allTags: TagStat[]; onOpen: (n: Note) => void; onClose: () => void; notify: Notify }) {
  const [tags, setTags] = useState(false);
  const [sure, setSure] = useState(false);
  const [cur, setCur] = useState(note);
  const title = note.title.trim() || plainText(note).split('\n')[0] || 'без названия';

  const act = (f: () => Promise<unknown>) => () => {
    onClose();
    void f();
  };

  if (tags)
    return (
      <TagSheet
        tags={cur.tags}
        all={allTags}
        onToggle={(t) => {
          const next = toggleTag(cur, t);
          setCur(next);
          void patchNote(note.id, { tags: next.tags });
        }}
        onClose={onClose}
      />
    );

  if (note.state === 'trashed')
    return (
      <Sheet onClose={onClose}>
        <div className="sheet-head">
          <div className="t">{title}</div>
          <div className="s">в корзине</div>
        </div>
        <button
          className="sheet-act"
          onClick={act(async () => {
            await restore(note.id);
            notify('запись возвращена');
          })}
        >
          <IconRestore />
          Восстановить
        </button>
        <button
          className={`sheet-act ${sure ? 'confirm' : ''}`}
          onClick={
            sure
              ? act(async () => {
                  await destroy(note.id);
                  notify('удалено навсегда');
                })
              : () => setSure(true)
          }
        >
          <IconTrash />
          {sure ? 'Точно удалить? Нажми ещё раз' : 'Удалить навсегда'}
        </button>
      </Sheet>
    );

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-head">
        <div className="t">{title}</div>
      </div>
      <button className="sheet-act" onClick={() => (onClose(), onOpen(note))}>
        <IconEdit />
        Открыть
      </button>
      {note.state === 'active' && (
        <button className="sheet-act" onClick={act(() => patchNote(note.id, { pinned: !note.pinned }, false))}>
          <IconPin on={note.pinned} />
          {note.pinned ? 'Открепить' : 'Закрепить'}
        </button>
      )}
      <button className="sheet-act" onClick={act(() => patchNote(note.id, { inverted: !note.inverted }, false))}>
        <IconInvert on={note.inverted} />
        {note.inverted ? 'Тёмная страница' : 'Светлая страница'}
      </button>
      <button className="sheet-act" onClick={() => setTags(true)}>
        <IconTag />
        Метки
      </button>
      <button
        className="sheet-act"
        onClick={act(async () => {
          try {
            await navigator.clipboard.writeText(plainText(note));
            notify('скопировано');
          } catch {
            notify('не удалось скопировать');
          }
        })}
      >
        <IconCopy />
        Копировать текст
      </button>
      {note.state === 'archived' ? (
        <button
          className="sheet-act"
          onClick={act(async () => {
            await restore(note.id);
            notify('вернулась к записям', () => void toArchive(note.id));
          })}
        >
          <IconRestore />
          Вернуть из архива
        </button>
      ) : (
        <button
          className="sheet-act"
          onClick={act(async () => {
            await toArchive(note.id);
            notify('в архиве', () => void saveNote(note));
          })}
        >
          <IconArchive />
          В архив
        </button>
      )}
      <button
        className="sheet-act"
        onClick={act(async () => {
          await toTrash(note.id);
          notify('в корзине', () => void saveNote(note));
        })}
      >
        <IconTrash />
        В корзину
      </button>
    </Sheet>
  );
}
