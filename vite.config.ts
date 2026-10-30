import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

/**
 * Собирает service worker: берёт sw/sw.js и подставляет список всех файлов
 * сборки (и public/), чтобы блокнот целиком работал офлайн после первого визита.
 */
function serviceWorker(): Plugin {
  return {
    name: 'grimoire-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = new Set<string>(Object.keys(bundle));
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.add(relative('public', full).replace(/\\/g, '/'));
        }
      };
      walk('public');
      files.delete('sw.js');
      const list = ['./', ...[...files].sort().map((f) => './' + f)];
      const version = createHash('sha1').update(list.join('|')).digest('hex').slice(0, 10);
      const source = readFileSync('sw/sw.js', 'utf8')
        .replace('__PRECACHE__', JSON.stringify(list))
        .replace('__VERSION__', version);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  // относительные пути — работает и в корне домена, и в подпапке GitHub Pages
  base: './',
  plugins: [react(), serviceWorker()],
  server: { host: true },
  preview: { host: true },
  test: { environment: 'node' },
});
