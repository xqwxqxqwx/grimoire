import { createRoot } from 'react-dom/client';

// шрифты лежат в сборке — работают офлайн; подключаем только латиницу и кириллицу
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/cyrillic-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/cyrillic-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/cyrillic-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/cyrillic-400.css';
import '@fontsource/pirata-one/latin-400.css';
import '@fontsource/ruslan-display/latin-400.css';
import '@fontsource/ruslan-display/cyrillic-400.css';
import './styles/global.css';

import { App } from './App';
import { purgeExpired, requestPersistence } from './db/db';

createRoot(document.getElementById('root')!).render(<App />);

void requestPersistence();
void purgeExpired();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* без SW блокнот всё равно работает, просто не офлайн */
    });
  });
}
