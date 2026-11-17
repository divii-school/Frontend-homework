"use client";

import type { ChangeEvent } from "react";
import { useUpdateProductStatus } from "@/hooks/API/products/useProductMutations";
import { useToast } from "@/providers/ToastProvider";

interface ProductStatusSelectProps {
  productId: number;
  productName: string;
  isVisible: boolean;
  disabled?: boolean;
}

// Inline exposure status (design 8.1.0 ⑩): Yes / No saves at once.
// The mutation hook is optimistic — the row flips immediately and is put back if the API refuses —
// so this component only picks the toast.
export default function ProductStatusSelect({ productId, productName, isVisible, disabled = false }: ProductStatusSelectProps) {
  const updateStatus = useUpdateProductStatus();
  const toast = useToast();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value === "yes";
    updateStatus.mutate(
      { id: productId, isVisible: next },
      {
        onSuccess: () => toast.success("Exposure status saved", `${productName}: ${next ? "Yes" : "No"}`),
        onError: (error) => toast.error("Exposure status not saved", error.message),
      },
    );
  };

  return (
    <span className="product-select product-select-compact" aria-busy={updateStatus.isPending || undefined}>
      <select
        aria-label={`Exposure status of ${productName}`}
        value={isVisible ? "yes" : "no"}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
      <i className="pi pi-chevron-down product-select-icon" aria-hidden="true" />
    </span>
  );
}
