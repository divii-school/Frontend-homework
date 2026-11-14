'use client';

import { Dropdown, type DropdownProps } from 'primereact/dropdown';

type Props = Omit<DropdownProps, 'ariaLabel'> & {
  /** Spoken name of the control (also used for the ▼ button). Required: every dropdown needs one. */
  label: string;
};

/**
 * PrimeReact Dropdown with the accessibility gaps closed (found by axe):
 * - the ▼ trigger gets the control's name instead of none;
 * - the off-screen native <select> PrimeReact keeps for forms gets the same name, so it is
 *   never read as an unnamed control (hiding it instead fails axe "aria-hidden-focus").
 */
export function AppDropdown({ label, pt, ...props }: Props) {
  return (
    <Dropdown
      {...props}
      ariaLabel={label}
      pt={{
        ...pt,
        trigger: { 'aria-label': `${label} 목록 열기` },
        select: { 'aria-label': label },
      }}
    />
  );
}
