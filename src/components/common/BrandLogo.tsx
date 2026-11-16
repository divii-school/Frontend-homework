import Image from "next/image";
import { LOGO } from "@/constants/design";

interface BrandLogoProps {
  /** Extra class for where the logo sits (for example to centre it on the login card). */
  className?: string;
  /** True where the logo is the first thing the visitor sees (the login page): the browser loads it first. */
  priority?: boolean;
}

/**
 * The Talking Club logo on a white plate. The logo file has a white background, so on a dark surface it would
 * show as a white rectangle; the plate (same white in both themes, with padding and round corners) makes
 * that deliberate. On a white surface the plate cannot be seen.
 */
export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <span className={className ? `brand-logo ${className}` : "brand-logo"}>
      <Image src={LOGO.src} alt="TalkingClub" width={LOGO.width} height={LOGO.height} priority={priority} />
    </span>
  );
}
