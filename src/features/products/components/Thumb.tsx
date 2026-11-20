/* eslint-disable @next/next/no-img-element */
import { imageUrl } from '../productService';
import styles from './Thumb.module.scss';

export function Thumb({ src, alt, size = 56 }: { src?: string; alt: string; size?: number }) {
  const url = imageUrl(src);
  return url ? (
    <img src={url} alt={alt} width={size} height={size} className={styles.img} loading="lazy" />
  ) : (
    <span className={styles.placeholder} style={{ width: size, height: size }} role="img" aria-label={`${alt} 이미지 없음`} />
  );
}
