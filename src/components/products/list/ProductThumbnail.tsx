"use client";

import { useState } from "react";

interface ProductThumbnailProps {
  src: string | null | undefined;
  /** Empty (default) when the product name is shown right next to the image. */
  alt?: string;
  className?: string;
}

// Product image with the grey placeholder of design 8.1.0 ⑥ — shown when there is no image
// or the image URL is broken (onError). Plain <img>: the images come from S3 / CDN URLs.
export default function ProductThumbnail({ src, alt = "", className }: ProductThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span className={["product-thumb", className].filter(Boolean).join(" ")}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote S3 URLs, sizes unknown; next/image adds nothing here
        <img src={src as string} alt={alt} loading="lazy" decoding="async" onError={() => setFailedSrc(src as string)} />
      ) : (
        <i className="pi pi-image product-thumb-placeholder" aria-hidden="true" />
      )}
    </span>
  );
}
