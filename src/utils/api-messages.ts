import { API_FIELD_LABELS, API_MESSAGES, MESSAGES } from "@/constants/messages";
import { hasHangul, withTopicParticle } from "@/utils/korean";

/**
 * Rule: no English on screen. Whatever the API answers is turned into Korean here:
 * 1. a known key -> its sentence from API_MESSAGES;
 * 2. text that is already Korean -> shown as it is;
 * 3. an unknown key -> a Korean sentence chosen by its shape (…NotFound, …AlreadyExists, …LimitReached);
 * 4. otherwise -> a Korean sentence for the HTTP status.
 */
const KEY_SHAPES: ReadonlyArray<[RegExp, string]> = [
  [/notfound$/i, MESSAGES.notFound],
  [/(alreadyexists?|duplicate|alreadyused|alreadyregistered)/i, MESSAGES.alreadyExists],
  [/(limit|maximum|exceed)/i, MESSAGES.limitReached],
  [/(forbidden|permission|notallowed|denied)/i, MESSAGES.forbidden],
  [/(must|invalid|notvalid|wrong|required|empty)/i, MESSAGES.invalidValue],
];

function byStatus(status: number): string {
  if (status === 401) return MESSAGES.sessionExpired;
  if (status === 403) return MESSAGES.forbidden;
  if (status === 404) return MESSAGES.notFound;
  if (status >= 500) return MESSAGES.server;
  return MESSAGES.unknown;
}

/** Korean sentence for one message key of the API. Never returns the key itself. */
export function koreanForKey(key: string, status: number): string {
  const known = API_MESSAGES[key];
  if (known) return known;
  if (hasHangul(key)) return key;
  // A 5xx is the server's fault whatever the key says.
  if (status >= 500) return MESSAGES.server;
  return KEY_SHAPES.find(([shape]) => shape.test(key))?.[1] ?? byStatus(status);
}

/** "images.0.url must be a string" -> "images" */
const fieldOf = (sentence: string): string => (sentence.split(" ")[0] ?? "").split(".")[0] ?? "";

/** Korean sentence for one English validation sentence of the API ("productName should not be empty"). */
export function koreanForValidation(sentence: string): string {
  if (hasHangul(sentence)) return sentence;
  const label = API_FIELD_LABELS[fieldOf(sentence)];
  if (!label) return MESSAGES.checkInput;
  if (/should not be empty|must be defined|is required/i.test(sentence)) return MESSAGES.required(label);
  if (/must be (a|an) (number|integer|positive|int)|must not be less than|must not be greater than|must be a number string|must be (a )?positive/i.test(sentence)) {
    return `${withTopicParticle(label)} 올바른 숫자로 입력해 주세요.`;
  }
  if (/must be (longer|shorter) than|characters/i.test(sentence)) return `${label}의 글자 수를 확인해 주세요.`;
  return `${label}의 값을 확인해 주세요.`;
}

/** Korean lines for a list of validation sentences: translated, without duplicates, never empty. */
export function koreanForValidationList(sentences: readonly string[]): string[] {
  const lines = [...new Set(sentences.map(koreanForValidation))];
  return lines.length > 0 ? lines : [MESSAGES.checkInput];
}
