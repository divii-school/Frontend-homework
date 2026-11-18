import Image from "next/image";
import { LOGO } from "@/constants/design";

interface BrandLogoProps {
  /** Extra class for where the logo sits (for example to centre it on the login card). */
  className?: string;
  /** True where the logo is the first thing the visitor sees (the login page): the browser loads it first. */
  priority?: boolean;
}

/**
 * The Talking Club logo. Light theme: the original file. Dark theme: a dark-mode version of the same size (light
 * text, lighter icon, no white background), so the logo swaps 1:1 with the theme (WM Light/Dark Mode Color System).
 * Both are in the page; CSS shows the one for the current theme, so a theme switch never waits for an image.
 */
export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <span className={className ? `brand-logo ${className}` : "brand-logo"}>
      <Image className="brand-logo-day" src={LOGO.src} alt="TalkingClub" width={LOGO.width} height={LOGO.height} priority={priority} />
      <Image className="brand-logo-night" src={LOGO.darkSrc} alt="TalkingClub" width={LOGO.width} height={LOGO.height} priority={priority} />
    </span>
  );
}
