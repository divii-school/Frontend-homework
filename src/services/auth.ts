import { z } from "zod";
import { apiRequest, request } from "@/services/http";
import type { SessionUser } from "@/types/auth";

// Confirmed against the QA server (2026-11-16):
// POST /auth/login → data: { token, user: { id, fullName, role, permissions, … } } (+ httpOnly refreshToken cookie)
const loginDataSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.number(),
    fullName: z.string().nullable(),
    role: z.string(),
  }),
});

export interface LoginInput {
  loginId: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: SessionUser;
}

export const authService = {
  async login(input: LoginInput): Promise<LoginResult> {
    const data = await apiRequest<unknown>("/api/v1/auth/login", { method: "POST", body: input, anonymous: true });
    const parsed = loginDataSchema.safeParse(data);
    if (!parsed.success) throw new Error("서버의 로그인 응답 형식이 올바르지 않습니다.");
    const { token, user } = parsed.data;
    return { accessToken: token, user: { id: user.id, fullName: user.fullName ?? "", role: user.role } };
  },

  /** Ends the session on the server (the token stops working right away). */
  async logout(): Promise<void> {
    await request<unknown>("/api/v1/auth/logout");
  },

  /** Logout for a token that was never stored (e.g. a non-admin account right after login). */
  async logoutWith(token: string): Promise<void> {
    await request<unknown>("/api/v1/auth/logout", { anonymous: true, headers: { Authorization: `Bearer ${token}` } });
  },
};
