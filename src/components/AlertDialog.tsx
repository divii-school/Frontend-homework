"use client";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

interface AlertDialogProps {
  visible: boolean;
  message: string;
  title?: string;
  confirmLabel?: string;
  onClose: () => void;
}

// System alert with one OK button (design 1.1.0 ④: "[OK] closes the popup").
// The message has role="alert" so it is read out as soon as the dialog opens.
export default function AlertDialog({ visible, message, title = "알림", confirmLabel = "확인", onClose }: AlertDialogProps) {
  return (
    <Dialog
      visible={visible}
      header={title}
      onHide={onClose}
      className="alert-dialog"
      draggable={false}
      resizable={false}
      footer={
        <div className="alert-dialog-actions">
          <Button type="button" label={confirmLabel} onClick={onClose} autoFocus />
        </div>
      }
    >
      <p className="alert-dialog-message" role="alert">
        {message}
      </p>
    </Dialog>
  );
}
