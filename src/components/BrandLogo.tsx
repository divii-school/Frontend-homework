import Link from "next/link";

interface BrandLogoProps {
  /** Extra text after a divider, e.g. "관리자" on the login card (design 1.1.0). */
  suffix?: string;
  /** Wrap in a link (sidebar: back to the home page). */
  href?: string;
  className?: string;
}

// "TalkingClub" wordmark: two linked rings (navy + brand pink, colours from tokens) + the name.
// The rings are decorative (aria-hidden); the text is the accessible name. The Latin "TalkingClub" is the
// brand mark as in the Figma logo (the designer decides on it); every other text, the suffix included, is Korean.
export default function BrandLogo({ suffix, href, className }: BrandLogoProps) {
  const content = (
    <>
      <svg className="brand-logo-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <circle className="brand-logo-ring-a" cx="12" cy="17" r="8" strokeWidth="2.4" />
        <circle className="brand-logo-ring-b" cx="20" cy="14" r="8" strokeWidth="2.4" />
      </svg>
      <span className="brand-logo-text">TalkingClub</span>
      {suffix && <span className="brand-logo-suffix">{suffix}</span>}
    </>
  );

  const classes = className ? `brand-logo ${className}` : "brand-logo";
  if (href) {
    return (
      <Link href={href} className={classes} aria-label="토킹클럽 홈">
        {content}
      </Link>
    );
  }
  return <span className={classes}>{content}</span>;
}
