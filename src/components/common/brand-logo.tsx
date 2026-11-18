import Image from 'next/image';
import styles from './brand-logo.module.scss';

interface BrandLogoProps {
  alt: string;
  priority?: boolean;
}

/**
 * The TalkingClub logo on a transparent background: the light version in light mode, a version with a light wordmark
 * in dark mode. CSS picks one from <html data-theme>, which is set before the first paint, so it never flashes.
 */
export function BrandLogo({ alt, priority = false }: BrandLogoProps) {
  return (
    <>
      <Image className={styles['logo-light']} src="/images/logo-talkingclub-light.png" alt={alt} width={158} height={30} priority={priority} />
      <Image className={styles['logo-dark']} src="/images/logo-talkingclub-dark.png" alt={alt} width={158} height={30} priority={priority} />
    </>
  );
}
