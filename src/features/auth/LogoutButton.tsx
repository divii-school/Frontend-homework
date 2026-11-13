"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthProvider";
import { LOGIN_PATH } from "@/lib/auth/redirect";

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await logout();
        router.replace(LOGIN_PATH);
      }}
    >
      Log out
    </button>
  );
}
