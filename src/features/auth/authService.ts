import { api } from '@/lib/api/client';
import { isObject, pickString, unwrapData } from '@/lib/api/normalize';
import { normalizeRole, type Role } from '@/config/access';

export interface LoginInput {
  loginId: string;
  password: string;
}

export interface Session {
  accessToken: string;
  refreshToken?: string;
}

export interface AdminProfile {
  name: string;
  loginId: string;
  role: Role;
  rawRole?: string;
}

const ROLE_KEYS = ['role', 'roleName', 'adminType', 'userType', 'type', 'adminRole'];

function findRole(obj: unknown): string | undefined {
  if (!isObject(obj)) return undefined;
  const direct = pickString(obj, ROLE_KEYS);
  if (direct) return direct;
  for (const k of ['role', 'admin', 'user', 'profile']) {
    const nested = obj[k];
    if (isObject(nested)) {
      const r = pickString(nested, ['name', 'code', ...ROLE_KEYS]);
      if (r) return r;
    }
  }
  return undefined;
}

export function mapProfile(body: unknown): AdminProfile {
  let d = unwrapData(body);
  if (isObject(d) && isObject(d.admin)) d = d.admin;
  const rawRole = findRole(d);
  return {
    name: pickString(d, ['name', 'adminName', 'fullName', 'username']) ?? '관리자',
    loginId: pickString(d, ['loginId', 'email', 'username']) ?? '',
    role: normalizeRole(rawRole),
    rawRole,
  };
}

export const authService = {
  async login(input: LoginInput): Promise<Session> {
    const body = await api.post('/auth/login', input, false);
    let d = unwrapData(body);
    if (isObject(d) && isObject(d.tokens)) d = d.tokens;
    const accessToken = pickString(d, ['accessToken', 'access_token', 'token']);
    if (!accessToken) throw new Error('로그인 응답에 토큰이 없습니다.');
    return { accessToken, refreshToken: pickString(d, ['refreshToken', 'refresh_token']) };
  },
  async profile(): Promise<AdminProfile> {
    return mapProfile(await api.get('/admin/profile'));
  },
  async logout(): Promise<void> {
    await api.get('/auth/logout');
  },
};
