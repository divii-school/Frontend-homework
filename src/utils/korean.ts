// Korean particles depend on whether the word before them ends in a consonant (받침).
// Writing "아이디을(를)" avoids the choice but reads badly, so the right particle is picked here.

const HANGUL_START = 0xac00;
const HANGUL_COUNT = 11172;
const FINALS_PER_SYLLABLE = 28;
const FINAL_RIEUL = 8;

/** Index of the final consonant of the last syllable: 0 = none. A word that does not end in Hangul counts as none. */
function finalConsonant(word: string): number {
  const offset = word.charCodeAt(word.length - 1) - HANGUL_START;
  return offset >= 0 && offset < HANGUL_COUNT ? offset % FINALS_PER_SYLLABLE : 0;
}

/** "상품명" -> "상품명을", "아이디" -> "아이디를" */
export const withObjectParticle = (word: string): string => `${word}${finalConsonant(word) === 0 ? "를" : "을"}`;

/** "상품 관리" -> "상품 관리로", "목록" -> "목록으로". A final ㄹ takes 로 like a vowel ("서울로"). */
export function withDirectionParticle(word: string): string {
  const final = finalConsonant(word);
  return `${word}${final === 0 || final === FINAL_RIEUL ? "로" : "으로"}`;
}
