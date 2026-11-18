"use client";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import BrandLogo from "../BrandLogo";
import { CUSTOMER_CENTER_PHONE } from "@/utils/constants";

interface NoPermissionDialogProps {
  visible: boolean;
  onClose: () => void;
}

const TC_HOME_URL = process.env.NEXT_PUBLIC_TC_HOME_URL ?? "";

// "No admin permission" popup (design 17108:76615): shown when a non-HQ account logs in.
// The session is never kept. "Go to Talking Club home" opens NEXT_PUBLIC_TC_HOME_URL when set,
// otherwise it just closes the popup (the home URL is not in the design — see design questions).
export default function NoPermissionDialog({ visible, onClose }: NoPermissionDialogProps) {
  const goHome = () => {
    if (TC_HOME_URL) {
      window.location.assign(TC_HOME_URL);
      return;
    }
    onClose();
  };

  return (
    <Dialog
      visible={visible}
      onHide={onClose}
      showHeader={false}
      className="no-permission-dialog"
      draggable={false}
      resizable={false}
      aria-labelledby="no-permission-title"
    >
      <div className="no-permission-body">
        <BrandLogo suffix="관리자" />
        <p className="no-permission-message" id="no-permission-title" role="alert">
          관리자 권한이 없습니다.
          <br />
          고객센터로 문의해주세요.
        </p>
        <p className="no-permission-phone">
          <a href={`tel:${CUSTOMER_CENTER_PHONE.replace(/-/g, "")}`}>{CUSTOMER_CENTER_PHONE}</a>
        </p>
        <Button type="button" className="no-permission-button" label="토킹클럽 홈으로" onClick={goHome} autoFocus />
      </div>
    </Dialog>
  );
}
