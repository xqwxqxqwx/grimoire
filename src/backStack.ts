import { useEffect, useRef } from 'react';

/*
 * Системная кнопка «назад» (Android, жест в iOS) закрывает верхний слой —
 * шторку, быстрый ввод, открытый день, — а не выходит из приложения.
 */
interface Layer {
  close: () => void;
  popped: boolean;
}

const stack: Layer[] = [];
let ignore = 0;

window.addEventListener('popstate', () => {
  if (ignore > 0) {
    ignore--;
    return;
  }
  const top = stack.pop();
  if (top) {
    top.popped = true;
    top.close();
  }
});

export function useBackClose(open: boolean, onClose: () => void): void {
  const cb = useRef(onClose);
  cb.current = onClose;
  useEffect(() => {
    if (!open) return;
    const layer: Layer = { close: () => cb.current(), popped: false };
    stack.push(layer);
    history.pushState({ layer: stack.length }, '');
    return () => {
      const i = stack.indexOf(layer);
      if (i >= 0) stack.splice(i, 1);
      // закрыли кнопкой в интерфейсе — убираем нашу запись из истории
      if (!layer.popped) {
        ignore++;
        history.back();
      }
    };
  }, [open]);
}
