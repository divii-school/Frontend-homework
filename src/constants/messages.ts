import { withObjectParticle } from "@/utils/korean";

/**
 * The API answers with message keys ("invalidPassword"). These are the Korean sentences shown for them.
 * WM | Error Message List has no wording yet, so the sentences are ours (see docs/design-questions.md).
 */
export const API_MESSAGES: Record<string, string> = {
  invalidPassword: "아이디 또는 비밀번호가 올바르지 않습니다.",
  userNotFound: "아이디 또는 비밀번호가 올바르지 않습니다.",
  Unauthorized: "아이디 또는 비밀번호가 올바르지 않습니다.",
  Forbidden: "이 작업을 할 권한이 없습니다.",
  productNotFound: "상품을 찾을 수 없습니다.",
  categoryNotFound: "카테고리를 찾을 수 없습니다.",
  fileRequired: "업로드할 파일을 선택해 주세요.",
  invalidImage: "등록할 수 없는 이미지입니다. 형식과 크기를 확인해 주세요.",
  uploadFailed: "이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  "Something went wrong": "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

export const MESSAGES = {
  network: "서버에 연결할 수 없습니다. 네트워크 상태를 확인한 후 다시 시도해 주세요.",
  server: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  unknown: "요청을 처리하지 못했습니다. 다시 시도해 주세요.",
  sessionExpired: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  required: (label: string) => `${withObjectParticle(label)} 입력해 주세요.`,
  selectRequired: (label: string) => `${withObjectParticle(label)} 선택해 주세요.`,
} as const;
