"use client";

import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import type { CategoryLevel } from "@/api-services/ProductCategoryService.types";
import { useSaveCategory } from "@/hooks/API/categories/useCategoryMutations";
import { useToast } from "@/providers/ToastProvider";
import { getApiMessage } from "@/utils/api-messages";
import { CATEGORY_RULES } from "@/utils/constants";
import { queryKeys } from "@/utils/query-keys";
import { LEVEL_INFO } from "./category-nodes";

/** What the dialog adds or edits. Built by CategoryManager from the clicked row. */
export interface CategoryFormTarget {
  mode: "add" | "edit";
  level: CategoryLevel;
  /** Edit only. */
  id?: number;
  /** Subcategory → its category id; minor category → its subcategory id. */
  parentId?: number;
  /** Key of the parent row (expanded after an add so the new row is visible). */
  parentKey?: string;
  /** "[72] Phonics & Alphabet" — shown so the user sees where the new item goes. */
  parentLabel?: string;
  initialName: string;
  /** Other names at the same place: a duplicate is caught before the API is called. */
  siblingNames: string[];
}

interface CategoryFormDialogProps {
  visible: boolean;
  target: CategoryFormTarget | null;
  onClose: () => void;
  onSaved: (target: CategoryFormTarget) => void;
}

interface FormValues {
  name: string;
}

/** API keys that mean "this name is taken" → shown under the field, not as a toast. */
const DUPLICATE_KEYS = ["categoryAlreadyExists", "subCategoryAlreadyExists", "childSubcategoryAlreadyExists"];
const MAX = CATEGORY_RULES.nameMaxLength;

function dialogTitle(target: CategoryFormTarget | null): string {
  if (!target) return "";
  const noun = LEVEL_INFO[target.level].noun;
  if (target.mode === "edit") return `Edit ${noun}`;
  return target.level === "category" ? "Register main category" : `Add ${noun}`;
}

// Add / edit modal for all three levels (design ⑤ ⑦ ⑧ ⑨ ⑫).
// Rules: name required, spaces trimmed, ≤ 50 characters, no duplicate among siblings (checked here
// for what is on screen, and by the API for everything). Enter saves, Esc closes, focus starts in the field.
export default function CategoryFormDialog({ visible, target, onClose, onSaved }: CategoryFormDialogProps) {
  const formId = useId();
  const inputId = `${formId}-name`;
  const toast = useToast();
  const queryClient = useQueryClient();
  const save = useSaveCategory();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { name: "" } });

  // Each time the dialog opens: empty field for add, current name for edit
  useEffect(() => {
    if (visible && target) reset({ name: target.initialName });
  }, [visible, target, reset]);

  const length = (watch("name") ?? "").trim().length;
  const nameError = errors.name?.message;

  // Submit: skip the call when nothing changed; map duplicate-name errors onto the field
  const onSubmit = handleSubmit(({ name }) => {
    if (!target) return;
    const trimmed = name.trim();
    if (target.mode === "edit" && trimmed === target.initialName.trim()) {
      onClose();
      return;
    }
    save.mutate(
      { level: target.level, id: target.id, name: trimmed, parentId: target.parentId },
      {
        onSuccess: (res) => {
          toast.success(getApiMessage(res.message, "Saved."));
          onSaved(target);
        },
        onError: (error) => {
          const fieldMessage = error.fieldErrors?.name ?? (DUPLICATE_KEYS.includes(error.messageKey) ? error.message : null);
          if (fieldMessage) {
            setError("name", { type: "server", message: fieldMessage }, { shouldFocus: true });
            return;
          }
          toast.error("Could not save the category", error.message);
          // Someone else deleted it meanwhile: close and reload the tree
          if (error.kind === "not-found") {
            void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
            onClose();
          }
        },
      },
    );
  });

  return (
    <Dialog
      visible={visible}
      onHide={onClose}
      onShow={() => setFocus("name", { shouldSelect: target?.mode === "edit" })}
      header={dialogTitle(target)}
      className="category-form-dialog"
      draggable={false}
      resizable={false}
      footer={
        <div className="category-form-actions">
          <Button type="button" label="Cancel" outlined onClick={onClose} />
          <Button
            type="submit"
            form={formId}
            label={target?.mode === "edit" ? "Save" : "Register"}
            icon={save.isPending ? "pi pi-spin pi-spinner" : undefined}
            disabled={save.isPending}
          />
        </div>
      }
    >
      <form id={formId} className="category-form" onSubmit={onSubmit} noValidate>
        {/* Where the new item goes (add under a parent only) */}
        {target?.parentLabel && target.mode === "add" && (
          <p className="category-form-parent">
            Parent: <strong>{target.parentLabel}</strong>
          </p>
        )}

        {/* Name field + counter + error */}
        <label htmlFor={inputId} className="category-form-label">
          Category name <span aria-hidden="true">*</span>
        </label>
        <InputText
          id={inputId}
          className={nameError ? "p-invalid" : undefined}
          autoComplete="off"
          aria-required="true"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={`${inputId}-hint${nameError ? ` ${inputId}-error` : ""}`}
          placeholder="Please enter the category name."
          {...register("name", {
            validate: {
              required: (value) => value.trim().length > 0 || "Please enter a category name.",
              maxLength: (value) => value.trim().length <= MAX || `Use ${MAX} characters or fewer.`,
              unique: (value) =>
                !(target?.siblingNames ?? []).some((other) => other.trim().toLowerCase() === value.trim().toLowerCase()) ||
                "This name is already used at this level.",
            },
          })}
        />
        <div className="category-form-meta">
          <p id={`${inputId}-hint`} className="field-hint">
            Up to {MAX} characters. Spaces at the start and end are removed.
          </p>
          <span className={length > MAX ? "category-form-counter category-form-counter-over" : "category-form-counter"}>
            {length}/{MAX}
          </span>
        </div>
        {nameError && (
          <p id={`${inputId}-error`} className="field-error" role="alert">
            {nameError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
