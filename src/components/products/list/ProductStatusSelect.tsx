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
        onSuccess: () => toast.success("저장 완료", `${productName}: ${next ? "예" : "아니오"}`),
        onError: (error) => toast.error("저장에 실패했습니다.", error.message),
      },
    );
  };

  return (
    <span className="product-select product-select-compact" aria-busy={updateStatus.isPending || undefined}>
      <select
        aria-label={`${productName} 노출여부`}
        value={isVisible ? "yes" : "no"}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="yes">예</option>
        <option value="no">아니오</option>
      </select>
      <i className="pi pi-chevron-down product-select-icon" aria-hidden="true" />
    </span>
  );
}
