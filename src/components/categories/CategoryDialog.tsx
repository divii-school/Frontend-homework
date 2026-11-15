"use client";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useState, type FormEvent } from "react";
import { ErrorSummary } from "@/components/common/ErrorSummary";
import { FormField, invalidProps } from "@/components/common/FormField";
import { useToast } from "@/components/providers/ToastProvider";
import { MESSAGES } from "@/constants/messages";
import { useSaveCategory } from "@/hooks/API/categories/useCategories";
import type { CategoryLevel, CategoryTarget } from "@/types/category";

export const LEVEL_LABEL: Record<CategoryLevel, string> = { category: "대분류", sub: "중분류", child: "소분류" };

/**
 * Create or rename a category on any of the three levels. `target.id` present = edit.
 * The parent renders it with a `key`, so each opening starts with a fresh name and no old error.
 */
export function CategoryDialog({ target, onClose }: { target: CategoryTarget; onClose: () => void }) {
  const showToast = useToast();
  const save = useSaveCategory();
  const [name, setName] = useState(target.name ?? "");
  const [submitted, setSubmitted] = useState(false);
  const isEdit = target.id !== undefined;
  const title = `${LEVEL_LABEL[target.level]} ${isEdit ? "수정" : "등록"}`;
  // The API's only rule for a category: "name should not be empty".
  const error = name.trim() ? undefined : MESSAGES.required(`${LEVEL_LABEL[target.level]} 이름`);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (error) return;
    save.mutate(
      { level: target.level, id: target.id, parentId: target.parentId, name: name.trim() },
      {
        onSuccess: () => {
          showToast({ severity: "success", summary: isEdit ? "수정 완료" : "등록 완료", detail: `${name.trim()} 카테고리를 저장했습니다.` });
          onClose();
        },
      },
    );
  };

  return (
    <Dialog className="confirm-dialog" header={title} visible modal draggable={false} closable={!save.isPending} onHide={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <ErrorSummary error={save.error} />
        <FormField id="category-name" label="카테고리 이름" required error={submitted ? error : undefined}>
          <InputText
            id="category-name"
            value={name}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            {...invalidProps("category-name", submitted ? error : undefined)}
          />
        </FormField>
        <div className="form-actions">
          <Button type="button" label="취소" outlined disabled={save.isPending} onClick={onClose} />
          <Button type="submit" label={isEdit ? "저장" : "등록"} loading={save.isPending} disabled={save.isPending} />
        </div>
      </form>
    </Dialog>
  );
}
