/**
 * The API stores some names HTML-escaped ("Intro A/B/C/D &amp; Jump Up"). React already escapes
 * text, so showing them raw would print "&amp;". This turns the five standard entities back.
 */
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

export function decodeEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39);/g, (match) => ENTITIES[match] ?? match);
}

/**
 * Korean particle that fits the word: 을/를, 은/는, 이/가, 으로/로.
 * A last Hangul syllable with a final consonant (받침) takes the first form ("수량을", "단가를").
 * 으로/로: ㄹ 받침 takes 로 too. A word not ending in Hangul (e.g. "ERP") is read as no 받침.
 */
type Particle = '을/를' | '은/는' | '이/가' | '으로/로';

export function josa(word: string, particle: Particle): string {
  const [withFinal, withoutFinal] = particle.split('/');
  const code = word.trimEnd().charCodeAt(word.trimEnd().length - 1) - 0xac00;
  const final = code >= 0 && code <= 11171 ? code % 28 : 0;
  const useFirst = particle === '으로/로' ? final !== 0 && final !== 8 : final !== 0;
  return word + (useFirst ? withFinal : withoutFinal);
}
