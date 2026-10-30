import { useMemo, useState } from 'react';
import { cleanTag, tagKey, type TagStat } from '../domain/notes';
import { IconCheck, IconPlus } from './art';
import { Sheet } from './ui';

/** Выбор меток записи: отметить существующие или завести новую. */
export function TagSheet({
  tags,
  all,
  onToggle,
  onClose,
}: {
  tags: string[];
  all: TagStat[];
  onToggle: (tag: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState('');
  const own = useMemo(() => new Set(tags.map(tagKey)), [tags]);

  // метки записи, которых ещё нет в общем списке (только что созданные), тоже показываем
  const list = useMemo(() => {
    const known = new Set(all.map((t) => t.key));
    return [...all.map((t) => t.name), ...tags.filter((t) => !known.has(tagKey(t)))];
  }, [all, tags]);

  const add = () => {
    const t = cleanTag(draft);
    if (!t) return;
    if (!own.has(tagKey(t))) onToggle(t);
    setDraft('');
  };

  return (
    <Sheet onClose={onClose}>
      <div className="sheet-head">
        <div className="t">Метки</div>
        <div className="s">отметь нужные или создай новую</div>
      </div>
      <form
        className="tag-input"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="новая метка" enterKeyHint="done" maxLength={32} />
        <button className="btn" type="submit" aria-label="Добавить метку" disabled={!cleanTag(draft)}>
          <IconPlus />
        </button>
      </form>
      {list.length === 0 && <div className="sheet-note">меток пока нет. первая появится здесь.</div>}
      {list.map((t) => {
        const on = own.has(tagKey(t));
        return (
          <button key={tagKey(t)} className={`sheet-act tag-opt ${on ? 'on' : ''}`} onClick={() => onToggle(t)} aria-pressed={on}>
            <span className="tick">
              <IconCheck />
            </span>
            <span className="grow">
              <span className="tag-mark">#</span>
              {t}
            </span>
          </button>
        );
      })}
    </Sheet>
  );
}
