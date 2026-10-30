import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useBackClose } from '../backStack';
import { destroy, saveNote } from '../db/db';
import { longWhen } from '../domain/format';
import { convert, isEmpty, plainText, toggleTag, uid, type ListItem, type Note, type TagStat } from '../domain/notes';
import {
  IconArchive,
  IconBack,
  IconChevron,
  IconClose,
  IconCopy,
  IconDots,
  IconInvert,
  IconList,
  IconPin,
  IconPlus,
  IconRestore,
  IconShare,
  IconTag,
  IconText,
  IconTrash,
  IconCheck,
  ThornDivider,
} from './art';
import { TagSheet } from './TagSheet';
import { AutoText, Sheet } from './ui';

export type EditorExit = 'close' | 'trash' | 'archive' | 'unarchive';

interface Props {
  initial: Note;
  isNew: boolean;
  allTags: TagStat[];
  /** вызывается, когда запись уже сохранена (или выброшена, если пустая) */
  onExit: (how: EditorExit, note: Note, kept: boolean) => void;
  notify: (text: string) => void;
}

const THEME_DARK = '#0b0b0c';
const THEME_PAPER = '#e6e4e0';

export function Editor({ initial, isNew, allTags, onExit, notify }: Props) {
  const [n, setN] = useState(initial);
  const [menu, setMenu] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [showDone, setShowDone] = useState(true);
  const [focused, setFocused] = useState<string | null>(null);

  const latest = useRef(n);
  latest.current = n;
  /** что сейчас лежит в базе; null — запись ещё не сохранялась */
  const persisted = useRef<Note | null>(isNew ? null : initial);
  const timer = useRef(0);
  const exited = useRef(false);

  const itemRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const focusReq = useRef<{ id: string; pos: number } | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  /** Сохранить сейчас. Пустую запись не храним: при выходе она удаляется. */
  const flush = useCallback(async (final: boolean): Promise<boolean> => {
    window.clearTimeout(timer.current);
    const note = latest.current;
    if (isEmpty(note)) {
      if (final && persisted.current) {
        await destroy(note.id);
        persisted.current = null;
      }
      return false;
    }
    if (persisted.current !== note) {
      await saveNote(note);
      persisted.current = note;
    }
    return true;
  }, []);

  const exit = useCallback(
    async (how: EditorExit) => {
      if (exited.current) return;
      exited.current = true;
      const kept = await flush(true);
      onExit(how, latest.current, kept);
    },
    [flush, onExit],
  );

  // системная «назад» — тоже выход с сохранением
  const back = useCallback(() => void exit('close'), [exit]);
  useBackClose(true, back);

  // автосохранение через полсекунды тишины
  useEffect(() => {
    if (n === persisted.current || isEmpty(n)) return;
    timer.current = window.setTimeout(() => void flush(false), 500);
    return () => window.clearTimeout(timer.current);
  }, [n, flush]);

  // свернули приложение — сохраняем сразу; закрыли редактор любым путём — тоже
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && void flush(false);
    document.addEventListener('visibilitychange', onHide);
    document.body.classList.add('locked');
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      document.body.classList.remove('locked');
      if (!exited.current) void flush(true);
    };
  }, [flush]);

  // цвет системной полосы под «светлую страницу»
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', n.inverted ? THEME_PAPER : THEME_DARK);
    document.body.classList.toggle('paper', n.inverted);
    return () => {
      meta?.setAttribute('content', THEME_DARK);
      document.body.classList.remove('paper');
    };
  }, [n.inverted]);

  // первый фокус: в новой записи — сразу писать
  useEffect(() => {
    if (!isNew) return;
    if (initial.kind === 'text') bodyRef.current?.focus();
    else if (initial.items[0]) itemRefs.current.get(initial.items[0].id)?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- только при открытии

  useLayoutEffect(() => {
    const req = focusReq.current;
    if (!req) return;
    focusReq.current = null;
    const el = itemRefs.current.get(req.id);
    if (el) {
      el.focus();
      el.setSelectionRange(req.pos, req.pos);
    }
  });

  /** Правка содержимого обновляет «изменено»; закрепление и вид — нет. */
  const edit = (f: (n: Note) => Note, touch = true) =>
    setN((prev) => {
      const next = f(prev);
      if (next === prev) return prev;
      return touch ? { ...next, updatedAt: Date.now() } : next;
    });

  const setItems = (f: (items: ListItem[]) => ListItem[]) => edit((p) => ({ ...p, items: f(p.items) }));

  const onItemText = (id: string, value: string) => {
    if (!value.includes('\n')) return setItems((items) => items.map((i) => (i.id === id ? { ...i, text: value } : i)));
    // Enter или вставка нескольких строк — делим на пункты
    const [first, ...rest] = value.split('\n');
    const added = rest.map((text) => ({ id: uid(), text, done: false }));
    setItems((items) => {
      const idx = items.findIndex((i) => i.id === id);
      if (idx < 0) return items;
      return [...items.slice(0, idx), { ...items[idx], text: first }, ...added, ...items.slice(idx + 1)];
    });
    const last = added[added.length - 1];
    focusReq.current = { id: last.id, pos: added.length === 1 ? 0 : last.text.length };
  };

  const removeItem = (id: string) => {
    const open = n.items.filter((i) => !i.done);
    const idx = open.findIndex((i) => i.id === id);
    const prev = open[idx - 1] ?? open[idx + 1];
    setItems((items) => {
      const next = items.filter((i) => i.id !== id);
      return next.length ? next : [{ id: uid(), text: '', done: false }];
    });
    if (prev) focusReq.current = { id: prev.id, pos: prev.text.length };
  };

  const addItem = () => {
    const item = { id: uid(), text: '', done: false };
    setItems((items) => {
      // новый пункт — после последнего невыполненного
      let at = -1;
      items.forEach((i, k) => !i.done && (at = k));
      return [...items.slice(0, at + 1), item, ...items.slice(at + 1)];
    });
    focusReq.current = { id: item.id, pos: 0 };
  };

  const toggleItem = (id: string) => setItems((items) => items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  const copy = async () => {
    setMenu(false);
    try {
      await navigator.clipboard.writeText(plainText(latest.current));
      notify('скопировано');
    } catch {
      notify('не удалось скопировать');
    }
  };

  const share = async () => {
    setMenu(false);
    try {
      await navigator.share({ title: n.title || undefined, text: plainText(n) });
    } catch {
      /* передумали */
    }
  };

  const open = n.items.filter((i) => !i.done);
  const done = n.items.filter((i) => i.done);
  const chars = n.kind === 'text' ? n.body.length : 0;

  const renderItem = (i: ListItem) => (
    <div key={i.id} className={`ed-item ${i.done ? 'done' : ''}`}>
      <button className={`check ${i.done ? 'on' : ''}`} onClick={() => toggleItem(i.id)} aria-label={i.done ? 'Снять отметку' : 'Отметить выполненным'} aria-pressed={i.done}>
        <i>
          <IconCheck />
        </i>
      </button>
      <AutoText
        elRef={(el) => (el ? itemRefs.current.set(i.id, el) : itemRefs.current.delete(i.id))}
        value={i.text}
        placeholder="пункт"
        enterKeyHint="next"
        onChange={(e) => onItemText(i.id, e.target.value)}
        onFocus={() => setFocused(i.id)}
        onBlur={() => setFocused((f) => (f === i.id ? null : f))}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && !i.text && n.items.length > 1) {
            e.preventDefault();
            removeItem(i.id);
          }
        }}
      />
      {focused === i.id && (
        <button className="icon-btn" onPointerDown={(e) => e.preventDefault()} onClick={() => removeItem(i.id)} aria-label="Удалить пункт">
          <IconClose />
        </button>
      )}
    </div>
  );

  return (
    <div className={`editor ${n.inverted ? 'inv' : ''}`}>
      <div className="editor-inner">
        <div className="ed-bar">
          <button className="icon-btn" onClick={back} aria-label="Назад">
            <IconBack />
          </button>
          <span className="grow" />
          <button className={`icon-btn ${n.pinned ? 'on' : ''}`} onClick={() => edit((p) => ({ ...p, pinned: !p.pinned }), false)} aria-label={n.pinned ? 'Открепить' : 'Закрепить'} aria-pressed={n.pinned}>
            <IconPin on={n.pinned} />
          </button>
          <button className={`icon-btn ${n.inverted ? 'on' : ''}`} onClick={() => edit((p) => ({ ...p, inverted: !p.inverted }), false)} aria-label="Светлая страница" aria-pressed={n.inverted}>
            <IconInvert on={n.inverted} />
          </button>
          <button className="icon-btn" onClick={() => setTagsOpen(true)} aria-label="Метки">
            <IconTag />
          </button>
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Ещё">
            <IconDots />
          </button>
        </div>

        <AutoText
          className="ed-title"
          value={n.title}
          placeholder="Заголовок"
          enterKeyHint="next"
          maxLength={200}
          onChange={(e) => {
            const v = e.target.value;
            edit((p) => ({ ...p, title: v.replace(/\n/g, ' ') }));
            if (v.includes('\n')) (n.kind === 'text' ? bodyRef.current : itemRefs.current.get(open[0]?.id ?? ''))?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (n.kind === 'text' ? bodyRef.current : itemRefs.current.get(open[0]?.id ?? ''))?.focus();
            }
          }}
        />
        <div className="ed-sep">
          <ThornDivider />
        </div>

        {n.kind === 'text' ? (
          <AutoText
            className="ed-body"
            elRef={(el) => (bodyRef.current = el)}
            value={n.body}
            placeholder="запиши, пока не ушло…"
            onChange={(e) => {
              const v = e.target.value;
              edit((p) => ({ ...p, body: v }));
            }}
          />
        ) : (
          <div className="ed-items">
            {open.map(renderItem)}
            <button className="ed-add" onClick={addItem}>
              <IconPlus />
              пункт
            </button>
            {done.length > 0 && (
              <>
                <button className={`ed-done-head ${showDone ? 'open' : ''}`} onClick={() => setShowDone((s) => !s)} aria-expanded={showDone}>
                  <span>выполнено · {done.length}</span>
                  <IconChevron />
                </button>
                {showDone && done.map(renderItem)}
              </>
            )}
          </div>
        )}

        {n.tags.length > 0 && (
          <div className="ed-tags">
            {n.tags.map((t) => (
              <button key={t} className="chip" onClick={() => setTagsOpen(true)}>
                #{t}
              </button>
            ))}
          </div>
        )}

        <div className="ed-foot">
          <span>{isEmpty(n) ? 'новая запись' : `изменено ${longWhen(n.updatedAt)}`}</span>
          <span>{n.kind === 'text' ? `${chars} зн.` : `${done.length}/${n.items.filter((i) => i.text.trim()).length}`}</span>
        </div>
      </div>

      {tagsOpen && <TagSheet tags={n.tags} all={allTags} onToggle={(t) => edit((p) => toggleTag(p, t))} onClose={() => setTagsOpen(false)} />}

      {menu && (
        <Sheet onClose={() => setMenu(false)}>
          <button
            className="sheet-act"
            onClick={() => {
              setMenu(false);
              edit((p) => convert(p, p.kind === 'text' ? 'list' : 'text'));
            }}
          >
            {n.kind === 'text' ? <IconList /> : <IconText />}
            {n.kind === 'text' ? 'Сделать списком' : 'Сделать текстом'}
          </button>
          <button className="sheet-act" onClick={copy}>
            <IconCopy />
            Копировать текст
          </button>
          {'share' in navigator && (
            <button className="sheet-act" onClick={share}>
              <IconShare />
              Поделиться
            </button>
          )}
          {n.state === 'archived' ? (
            <button className="sheet-act" onClick={() => void exit('unarchive')}>
              <IconRestore />
              Вернуть из архива
            </button>
          ) : (
            <button className="sheet-act" onClick={() => void exit('archive')}>
              <IconArchive />
              В архив
            </button>
          )}
          <button className="sheet-act" onClick={() => void exit('trash')}>
            <IconTrash />
            В корзину
          </button>
        </Sheet>
      )}
    </div>
  );
}
