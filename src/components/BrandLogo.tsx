import { useId } from "react";
import Link from "next/link";

interface BrandLogoProps {
  /** Wrap in a link (sidebar / topbar: back to the home page). */
  href?: string;
  className?: string;
}

// The logo artwork: the TalkingClub logo of the Figma frames (1.1.0 login, 8.1.0 header: layer "image 6").
// Figma holds it only as a 158 × 30 px bitmap on white, so the file used here is the same artwork in higher
// resolution with a transparent background (512 × 107 px, the logo of the Talking Club web product).
const LOGO_SRC = "/brand/talkingclub-logo.png";
const LOGO_SRC_WIDTH = 512;
const LOGO_SRC_HEIGHT = 107;

// Where the two parts sit inside the file (1 px margin around the drawn pixels) …
const SRC_MARK = { x: 4, y: 13, width: 129, height: 81 };
const SRC_WORDMARK = { x: 153, y: 23, width: 352, height: 66 };
// … and where they sit in the 158 × 30 box of the Figma frames (mark 40 × 25 at the left, wordmark 101 px wide).
const BOX_HEIGHT = 30;
const MARK_BOX_WIDTH = 42;
const WORDMARK_BOX_WIDTH = 116;
const BOX_MARK = { x: 0.69, y: 2.69, width: 40.63, height: 25.51 };
const BOX_WORDMARK = { x: 48.71, y: 4.98, width: 101.58, height: 19.05 };

const viewBox = (box: { x: number; y: number; width: number; height: number }) => `${box.x} ${box.y} ${box.width} ${box.height}`;

// TalkingClub logo = the three-ring mark + the "TalkingClub" wordmark, as one image (role="img", name "TalkingClub").
//  - mark: the pixels of the logo file, unchanged (the rings keep their colours);
//  - wordmark: the same file used as a mask and filled with `currentColor`, so only the wordmark changes colour
//    with the theme (--color-logo-text: the logo's own grey on light, a light grey on dark).
// The two parts are two <svg> elements so the topbar can show the mark alone on a phone (see _app-shell.scss).
// The login page shows the logo alone, as in frame 1.1.0; its heading for screen readers is in LoginForm.
export default function BrandLogo({ href, className }: BrandLogoProps) {
  // One mask per logo on the page (sidebar + topbar render two); only letters and digits so url(#…) stays valid
  const maskId = `brand-logo-mask-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const image = (
    <span className="brand-logo-image" role="img" aria-label="TalkingClub">
      <svg className="brand-logo-mark" viewBox={`0 0 ${MARK_BOX_WIDTH} ${BOX_HEIGHT}`} aria-hidden="true" focusable="false">
        <svg {...BOX_MARK} viewBox={viewBox(SRC_MARK)} preserveAspectRatio="none">
          <image href={LOGO_SRC} width={LOGO_SRC_WIDTH} height={LOGO_SRC_HEIGHT} />
        </svg>
      </svg>
      <svg
        className="brand-logo-wordmark"
        viewBox={`${MARK_BOX_WIDTH} 0 ${WORDMARK_BOX_WIDTH} ${BOX_HEIGHT}`}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" {...SRC_WORDMARK} style={{ maskType: "alpha" }}>
            <image href={LOGO_SRC} width={LOGO_SRC_WIDTH} height={LOGO_SRC_HEIGHT} />
          </mask>
        </defs>
        <svg {...BOX_WORDMARK} viewBox={viewBox(SRC_WORDMARK)} preserveAspectRatio="none">
          <rect {...SRC_WORDMARK} fill="currentColor" mask={`url(#${maskId})`} />
        </svg>
      </svg>
    </span>
  );

  const classes = className ? `brand-logo ${className}` : "brand-logo";
  if (href) {
    return (
      <Link href={href} className={classes} aria-label="토킹클럽 홈">
        {image}
      </Link>
    );
  }
  return <span className={classes}>{image}</span>;
}
