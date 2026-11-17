"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Dialog } from "primereact/dialog";
import { useCategoryMutations } from "@/hooks/useProductCategories";
import { useToast } from "@/providers/ToastProvider";
import { errorMessage } from "@/lib/errors";
import { CATEGORY_NAME_MAX, type CategoryLevel, type CategoryNode } from "@/types/category";
import btn from "@/components/ui/Button.module.scss";
import styles from "./CategoryDialogs.module.scss";

export type CategoryFormTarget =
  | { mode: "create"; level: CategoryLevel; parent: CategoryNode | null }
  | { mode: "edit"; node: CategoryNode };

const LEVEL_NAME: Record<CategoryLevel, string> = { 1: "main category", 2: "subcategory", 3: "child category" };

export function validateCategoryName(raw: string): string | null {
  const name = raw.trim();
  if (!name) return "Please enter a category name.";
  if (name.length > CATEGORY_NAME_MAX) return `Use ${CATEGORY_NAME_MAX} characters or fewer.`;
  return null;
}

/**
 * Add or rename a category (Figma 8.2.0 #5, #7, #8, #9).
 * Rendered only while open, with a `key` per target, so every open starts from fresh state.
 * On an API error the dialog stays open with the typed name kept.
 */
export function CategoryFormDialog({ target, onClose }: { target: CategoryFormTarget; onClose: () => void }) {
  const { create, update } = useCategoryMutations();
  const { notify } = useToast();
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const level = target.mode === "create" ? target.level : target.node.level;
  const parent = target.mode === "create" ? target.parent : null;
  const [name, setName] = useState(target.mode === "edit" ? target.node.name : "");
  const [touched, setTouched] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = target.mode === "create" ? create : update;
  const pending = mutation.isPending;
  const validationError = validateCategoryName(name);
  const shownError = apiError ?? (touched ? validationError : null);
  const unchanged = target.mode === "edit" && name.trim() === target.node.name;

  const title =
    target.mode === "create" ? `Add ${LEVEL_NAME[level]}` : `Edit ${LEVEL_NAME[level]}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (validationError || pending) return;
    setApiError(null);
    try {
      if (target.mode === "create") {
        await create.mutateAsync({ level, name, parentId: parent?.id ?? null });
        notify("success", `“${name.trim()}” was added.`);
      } else {
        await update.mutateAsync({
          id: target.node.id,
          input: { level, name, parentId: target.node.parentId },
        });
        notify("success", `Saved “${name.trim()}”.`);
      }
      onClose();
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  const formId = `${inputId}-form`;

  return (
    <Dialog
      visible
      header={title}
      onHide={() => !pending && onClose()}
      draggable={false}
      resizable={false}
      blockScroll
      // PrimeReact would focus the close button; start on the name field instead.
      focusOnShow={false}
      onShow={() => inputRef.current?.focus()}
      footer={
        <>
          <button type="button" className={`${btn.button} ${btn.outline}`} onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className={`${btn.button} ${btn.primary}`}
            disabled={pending || unchanged}
            aria-busy={pending}
          >
            {pending ? "Saving…" : target.mode === "create" ? "Add" : "Save"}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className={styles.form}>
        {parent && (
          <p className={styles.parent}>
            Parent: <span className={styles.code}>[{parent.id}]</span> {parent.name}
          </p>
        )}
        <label htmlFor={inputId} className={styles.label}>
          Category name <span aria-hidden>*</span>
        </label>
        <input
          id={inputId}
          className={`${styles.input} ${shownError ? styles["input-invalid"] : ""}`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setApiError(null);
          }}
          onBlur={() => setTouched(true)}
          maxLength={CATEGORY_NAME_MAX + 20}
          autoComplete="off"
          aria-required
          aria-invalid={Boolean(shownError)}
          aria-describedby={errorId}
          ref={inputRef}
        />
        <div className={styles.meta}>
          <p id={errorId} className={styles.error} role="alert">
            {shownError}
          </p>
          <span className={styles.counter} aria-hidden>
            {name.trim().length}/{CATEGORY_NAME_MAX}
          </span>
        </div>
      </form>
    </Dialog>
  );
}
