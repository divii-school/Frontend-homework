import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import type { ReactNode } from "react";
import { ErrorSummary } from "@/components/common/ErrorSummary";
import type { ApiError } from "@/types/api";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** "취소" by default; a yes/no question uses "아니오". */
  cancelLabel?: string;
  /** A delete is red; a plain question (leave the form?) is not. */
  danger?: boolean;
  /** True while the request runs: the button shows a spinner and cannot be clicked twice. */
  pending: boolean;
  error: ApiError | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "Are you sure?" before a delete or before leaving a form. Stays open with the API's message when the request fails. */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { visible, title, children, confirmLabel, cancelLabel = "취소", danger = true, pending, error, onConfirm, onCancel } = props;
  return (
    <Dialog
      className="confirm-dialog"
      header={title}
      visible={visible}
      modal
      draggable={false}
      closable={!pending}
      onHide={onCancel}
      footer={
        <>
          <Button type="button" label={cancelLabel} outlined disabled={pending} onClick={onCancel} />
          <Button type="button" label={confirmLabel} severity={danger ? "danger" : undefined} loading={pending} disabled={pending} onClick={onConfirm} />
        </>
      }
    >
      <ErrorSummary error={error} />
      <div className="confirm-dialog-body">{children}</div>
    </Dialog>
  );
}
