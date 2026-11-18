import { PRIME_THEME_LINKS, THEME_BOOT_SCRIPT } from '@/config/theme';

/**
 * In <head>: the PrimeReact light and dark themes (dark starts disabled), then the boot script that enables the saved /
 * OS theme before the first paint. React places these after Next's stylesheets; that is fine because the theme's rules
 * sit in `@layer primereact` (below our unlayered SCSS) and its only unlayered part, `:root`, is outranked by our
 * `html:root` block in globals.scss.
 * suppressHydrationWarning: the script may have flipped `disabled` before React hydrates.
 */
// `disabled` is a valid <link> attribute (HTML spec) that React renders, but React's types do not list it.
const DISABLED: Record<string, boolean> = { disabled: true };

export function PrimeThemeLinks() {
  return (
    <>
      <link id={PRIME_THEME_LINKS.light.id} rel="stylesheet" href={PRIME_THEME_LINKS.light.href} suppressHydrationWarning />
      <link id={PRIME_THEME_LINKS.dark.id} rel="stylesheet" href={PRIME_THEME_LINKS.dark.href} {...DISABLED} suppressHydrationWarning />
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
    </>
  );
}
