import { useLayoutEffect, useRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { useBackClose } from '../backStack';
import { Flourish } from './art';

/** Заголовок экрана: готика между завитками. */
export function TitleHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <header className="title-head">
      <Flourish className="flourish l" />
      <h1 className="gothic-title">{title}</h1>
      <Flourish className="flourish r" />
      {sub !== undefined && <div className="title-sub">{sub}</div>}
    </header>
  );
}

/** Нижняя шторка; системная «назад» её закрывает. */
export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useBackClose(true, onClose);
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {children}
      </div>
    </div>
  );
}

/** Многострочное поле, которое растёт вместе с текстом. */
export function AutoText({ elRef, value, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { elRef?: (el: HTMLTextAreaElement | null) => void; value: string }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        elRef?.(el);
      }}
      rows={1}
      value={value}
      {...rest}
    />
  );
}

/** Долгое нажатие (450 мс) отдельно от обычного тапа; сдвиг пальца отменяет. */
export function usePress(onTap: () => void, onLong: () => void) {
  const timer = useRef(0);
  const start = useRef<[number, number] | null>(null);
  const fired = useRef(false);
  const cancel = () => {
    window.clearTimeout(timer.current);
    start.current = null;
  };
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      fired.current = false;
      start.current = [e.clientX, e.clientY];
      timer.current = window.setTimeout(() => {
        fired.current = true;
        start.current = null;
        navigator.vibrate?.(12);
        onLong();
      }, 450);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (start.current && Math.hypot(e.clientX - start.current[0], e.clientY - start.current[1]) > 8) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onClick: () => {
      if (fired.current) return;
      onTap();
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      if (!fired.current) {
        cancel();
        fired.current = true;
        onLong();
      }
    },
  };
}
