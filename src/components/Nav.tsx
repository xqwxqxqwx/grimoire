import { IconBook, IconMore, IconTag } from './art';

export type Tab = 'notes' | 'tags' | 'more';

const TABS: [Tab, string, (p: { className?: string }) => React.JSX.Element][] = [
  ['notes', 'Записи', IconBook],
  ['tags', 'Метки', IconTag],
  ['more', 'Ещё', IconMore],
];

export function Nav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => onTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
