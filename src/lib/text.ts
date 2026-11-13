/**
 * The API stores some names HTML-escaped ("Intro A/B/C/D &amp; Jump Up"). React already escapes
 * text, so showing them raw would print "&amp;". This turns the five standard entities back.
 */
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

export function decodeEntities(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39);/g, (match) => ENTITIES[match] ?? match);
}
