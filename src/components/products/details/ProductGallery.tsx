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
        alt={current ? `${productName} — image ${index + 1} of ${list.length}` : ""}
        className="product-gallery-main"
      />
      {list.length === 0 && <p className="product-gallery-empty">No image registered</p>}
      {list.length > 1 && (
        <ul className="product-gallery-thumbs" aria-label="Product images">
          {list.map((src, position) => (
            <li key={`${src}-${position}`}>
              <button
                type="button"
                className="product-gallery-thumb"
                aria-label={`Show image ${position + 1}`}
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
