"use client";

import { useRef, type KeyboardEvent } from "react";
import type { ProductDetailsTab } from "../list/product-routes";

export const DETAIL_TABS: ReadonlyArray<{ key: ProductDetailsTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "options", label: "Options" },
  { key: "related", label: "Same category" },
];

/** ?tab=… → a known tab; missing or unknown → overview. */
export function parseDetailsTab(value: string | null): ProductDetailsTab {
  const match = DETAIL_TABS.find((tab) => tab.key === value);
  return match ? match.key : "overview";
}

export const tabId = (key: ProductDetailsTab) => `product-tab-${key}`;
export const tabPanelId = (key: ProductDetailsTab) => `product-tabpanel-${key}`;

interface DetailsTabsProps {
  active: ProductDetailsTab;
  onChange: (tab: ProductDetailsTab) => void;
}

// Accessible tab buttons (WAI-ARIA tabs pattern): role=tablist / tab, only the active tab is in the
// Tab order, Arrow Left / Right / Home / End move between tabs and open them.
export default function DetailsTabs({ active, onChange }: DetailsTabsProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = DETAIL_TABS.length - 1;
    const target =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    buttons.current[target]?.focus();
    onChange(DETAIL_TABS[target].key);
  };

  return (
    <div className="details-tabs" role="tablist" aria-label="Product details sections">
      {DETAIL_TABS.map((tab, index) => {
        const selected = tab.key === active;
        return (
          <button
            key={tab.key}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={tabId(tab.key)}
            aria-selected={selected}
            aria-controls={selected ? tabPanelId(tab.key) : undefined}
            tabIndex={selected ? 0 : -1}
            className={`details-tab${selected ? " is-active" : ""}`}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
