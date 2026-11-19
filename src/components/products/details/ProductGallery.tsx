"use client";

import { useState } from "react";
import ProductThumbnail from "../list/ProductThumbnail";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

// Image gallery of the Overview tab: one large image + small buttons to switch (max 4 images).
// No image / a broken URL shows the same grey placeholder as the list.
export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const list = images.filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const index = Math.min(activeIndex, Math.max(0, list.length - 1));
  const current = list[index] ?? null;

  return (
    <div className="product-gallery">
      <ProductThumbnail
        src={current}
        alt={current ? `${productName} 이미지 ${index + 1}/${list.length}` : ""}
        className="product-gallery-main"
      />
      {list.length === 0 && <p className="product-gallery-empty">등록된 이미지가 없습니다</p>}
      {list.length > 1 && (
        <ul className="product-gallery-thumbs" aria-label="상품 이미지">
          {list.map((src, position) => (
            <li key={`${src}-${position}`}>
              <button
                type="button"
                className="product-gallery-thumb"
                aria-label={`이미지 ${position + 1} 보기`}
                aria-pressed={position === index}
                onClick={() => setActiveIndex(position)}
              >
                <ProductThumbnail src={src} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
