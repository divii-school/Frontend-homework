'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './url-tabs.module.scss';

export interface TabDef {
  key: string;
  label: string;
  render: () => ReactNode;
}

/**
 * Accessible tabs whose active tab is the `?tab=` URL parameter, so refresh, back and a shared
 * link keep it. Only the active panel is rendered, so each tab fetches its data when opened.
 * Keyboard: ←/→ move between tabs, Home/End jump (WAI-ARIA tabs pattern).
 */
export function UrlTabs({ tabs, label }: { tabs: TabDef[]; label: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const requested = params.get('tab');
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.key === requested),
  );
  const active = tabs[activeIndex];

  const select = (index: number, focus = false) => {
    const next = new URLSearchParams(params.toString());
    if (index === 0) next.delete('tab');
    else next.set('tab', tabs[index].key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    if (focus) refs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const target =
      event.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : event.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    select(target, true);
  };

  return (
    <div className={styles['tabs']}>
      <div role="tablist" aria-label={label} className={styles['tablist']}>
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={index === activeIndex}
            aria-controls={`panel-${tab.key}`}
            tabIndex={index === activeIndex ? 0 : -1}
            className={`${styles['tab']} ${index === activeIndex ? styles['is-active'] : ''}`}
            onClick={() => select(index)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${active.key}`} aria-labelledby={`tab-${active.key}`} tabIndex={0} className={styles['panel']}>
        {active.render()}
      </div>
    </div>
  );
}
