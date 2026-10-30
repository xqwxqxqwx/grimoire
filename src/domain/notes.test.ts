import { describe, expect, it } from 'vitest';
import { makeBackup, mergeNotes, parseBackup } from './backup';
import { longWhen, notesWord, shortWhen } from './format';
import {
  collectTags,
  convert,
  daysLeft,
  expired,
  isEmpty,
  matches,
  newNote,
  renameTag,
  sortNotes,
  textToItems,
  toggleTag,
} from './notes';

const NOW = new Date(2026, 9, 30, 15, 0).getTime();

describe('записи', () => {
  it('пустая запись распознаётся, в том числе пустой список', () => {
    expect(isEmpty(newNote())).toBe(true);
    expect(isEmpty(newNote('list'))).toBe(true);
    expect(isEmpty({ ...newNote(), title: '  мысль ' })).toBe(false);
  });

  it('текст превращается в список и обратно', () => {
    const n = { ...newNote(), body: 'хлеб\n- [x] молоко\n☒ яйца\n\n• соль' };
    const list = convert(n, 'list');
    expect(list.items.map((i) => [i.text, i.done])).toEqual([
      ['хлеб', false],
      ['молоко', true],
      ['яйца', true],
      ['соль', false],
    ]);
    expect(convert(list, 'text').body).toBe('хлеб\nмолоко\nяйца\nсоль');
  });

  it('пустой текст даёт один пустой пункт', () => {
    expect(textToItems('  \n ')).toHaveLength(1);
  });

  it('поиск по словам, меткам и пунктам', () => {
    const n = { ...newNote('list'), title: 'Покупки', tags: ['Дом'], items: textToItems('чёрный чай') };
    expect(matches(n, 'чай')).toBe(true);
    expect(matches(n, '#дом покупки')).toBe(true);
    expect(matches(n, 'кофе')).toBe(false);
  });

  it('закреплённые сверху, дальше свежие', () => {
    const a = { ...newNote(), id: 'a', updatedAt: 1 };
    const b = { ...newNote(), id: 'b', updatedAt: 3 };
    const c = { ...newNote(), id: 'c', updatedAt: 2, pinned: true };
    expect(sortNotes([a, b, c]).map((n) => n.id)).toEqual(['c', 'b', 'a']);
  });

  it('метки без учёта регистра и решётки', () => {
    let n = toggleTag(newNote(), '#Работа');
    expect(n.tags).toEqual(['Работа']);
    n = toggleTag(n, 'работа');
    expect(n.tags).toEqual([]);
  });

  it('подсчёт и переименование меток', () => {
    const a = { ...newNote(), tags: ['сны', 'Идеи'] };
    const b = { ...newNote(), tags: ['идеи'] };
    const c = { ...newNote(), tags: ['идеи'], state: 'trashed' as const };
    expect(collectTags([a, b, c])).toEqual([
      { key: 'идеи', name: 'Идеи', count: 2 },
      { key: 'сны', name: 'сны', count: 1 },
    ]);
    expect(renameTag(a, 'ИДЕИ', 'сны').tags).toEqual(['сны']);
  });

  it('корзина хранит 30 дней', () => {
    const day = 86_400_000;
    const fresh = { ...newNote(), state: 'trashed' as const, trashedAt: NOW - 29 * day };
    const old = { ...newNote(), state: 'trashed' as const, trashedAt: NOW - 31 * day };
    expect(expired([fresh, old], NOW)).toEqual([old]);
    expect(daysLeft(fresh, NOW)).toBe(1);
  });
});

describe('даты и слова', () => {
  it('короткая дата', () => {
    expect(shortWhen(new Date(2026, 9, 30, 9, 5).getTime(), NOW)).toBe('09:05');
    expect(shortWhen(new Date(2026, 9, 29, 23, 0).getTime(), NOW)).toBe('вчера');
    expect(shortWhen(new Date(2026, 1, 3).getTime(), NOW)).toBe('3 фев');
    expect(shortWhen(new Date(2024, 9, 12).getTime(), NOW)).toBe('12.10.24');
  });

  it('длинная дата', () => {
    expect(longWhen(new Date(2026, 9, 30, 14, 52).getTime(), NOW)).toBe('сегодня, 14:52');
    expect(longWhen(new Date(2026, 4, 1, 8, 0).getTime(), NOW)).toBe('1 мая, 08:00');
  });

  it('склонение', () => {
    expect([1, 2, 5, 11, 21, 104].map(notesWord)).toEqual(['1 запись', '2 записи', '5 записей', '11 записей', '21 запись', '104 записи']);
  });
});

describe('бэкап', () => {
  it('экспорт читается обратно без потерь', () => {
    const n = { ...newNote('list', NOW, ['сны']), title: 'x', items: textToItems('a\n[x] b') };
    const json = JSON.stringify(makeBackup([n], NOW));
    expect(parseBackup(json, NOW)).toEqual([n]);
  });

  it('чужой файл отклоняется, битые поля чинятся', () => {
    expect(() => parseBackup('{"foo":1}')).toThrow();
    expect(() => parseBackup('не json')).toThrow();
    const [n] = parseBackup('{"app":"grimoire","notes":[{"title":5,"kind":"list","tags":["a",3]}]}', NOW);
    expect(n.title).toBe('');
    expect(n.items).toHaveLength(1);
    expect(n.tags).toEqual(['a']);
    expect(n.createdAt).toBe(NOW);
  });

  it('слияние оставляет более свежую версию', () => {
    const old = { ...newNote(), id: '1', updatedAt: 5, title: 'старая' };
    const res = mergeNotes([old], [{ ...old, updatedAt: 9, title: 'новая' }, { ...old, id: '2' }, { ...old, updatedAt: 1 }]);
    expect(res.added).toBe(1);
    expect(res.updated).toBe(1);
    expect(res.put.map((n) => n.title)).toEqual(['новая', 'старая']);
  });
});
