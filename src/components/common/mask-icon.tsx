import type { CSSProperties } from 'react';
import styles from './mask-icon.module.scss';

interface MaskIconProps {
  /** SVG in /public/icons, e.g. "/icons/icon-cart.svg". */
  src: string;
  /** Square size in px (the Figma icon box). */
  size?: number;
  className?: string;
}

/**
 * Draws a Figma SVG icon in the current text colour (CSS mask + currentColor),
 * so the same file works in light and dark mode. Decorative: hidden from screen readers.
 */
export function MaskIcon({ src, size = 24, className }: MaskIconProps) {
  const style = { '--icon-url': `url(${src})`, '--icon-size': `${size}px` } as CSSProperties;
  return <span aria-hidden className={`${styles['mask-icon']} ${className ?? ''}`} style={style} />;
}
