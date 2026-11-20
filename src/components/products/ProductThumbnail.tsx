"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Square product picture. A product with no image, or with a file that is missing in storage, shows the
 * grey placeholder: never a broken picture.
 */
export function ProductThumbnail({ src, alt, size }: { src: string | null | undefined; alt: string; size: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="product-thumbnail" style={{ width: size, height: size }}>
      {src && !failed ? (
        <Image src={src} alt={alt} width={size} height={size} onError={() => setFailed(true)} />
      ) : (
        <i className="pi pi-image" role="img" aria-label="이미지 없음" />
      )}
    </span>
  );
}
