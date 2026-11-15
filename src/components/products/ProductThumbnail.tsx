import Image from "next/image";

/** Square product picture, or the grey placeholder when the product has none (never a broken image). */
export function ProductThumbnail({ src, alt, size }: { src: string | null | undefined; alt: string; size: number }) {
  return (
    <span className="product-thumbnail" style={{ width: size, height: size }}>
      {src ? <Image src={src} alt={alt} width={size} height={size} /> : <i className="pi pi-image" role="img" aria-label="이미지 없음" />}
    </span>
  );
}
