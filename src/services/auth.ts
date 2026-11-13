import { z } from "zod";
import { apiRequest, request } from "@/services/http";

// TODO(HW3): confirm these shapes against a real QA login (the OpenAPI spec has no response schemas).
const loginDataSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

const refreshDataSchema = z.object({
  accessToken: z.string().min(1),
});

const profileSchema = z
  .object({
    name: z.string().optional(),
    loginId: z.string().optional(),
    role: z.string().optional(),
  })
  .passthrough();

export type LoginTokens = z.infer<typeof loginDataSchema>;
export type AdminProfile = z.infer<typeof profileSchema>;

export interface LoginInput {
  loginId: string;
  password: string;
}

export const authService = {
  async login(input: LoginInput): Promise<LoginTokens> {
    const data = await apiRequest<unknown>("/api/v1/auth/login", { method: "POST", body: input, anonymous: true });
    const parsed = loginDataSchema.safeParse(data);
    if (!parsed.success) throw new Error("Unexpected login response from the server.");
    return parsed.data;
  },

  /** Exchanges the refresh token for a new access token. */
  async refresh(refreshToken: string): Promise<string> {
    const data = await apiRequest<unknown>("/api/v1/auth/get-access-token", {
      anonymous: true,
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    return refreshDataSchema.parse(data).accessToken;
  },

  async logout(): Promise<void> {
    await request<unknown>("/api/v1/auth/logout");
  },

  async profile(signal?: AbortSignal): Promise<AdminProfile> {
    const data = await apiRequest<unknown>("/api/v1/admin/profile", { signal });
    return profileSchema.parse(data);
  },
};
