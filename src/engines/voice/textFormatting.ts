// docs/06-Voice-Engine.md "Prononciation des adresses" — develops the
// documented abbreviations, leaves proper nouns untouched when no reliable
// rule exists ("le moteur doit éviter les transformations risquées").
//
// Number pronunciation ("224" -> "deux cent vingt-quatre", docs/06
// "Prononciation des nombres") is deliberately NOT implemented here — a
// French number-to-words converter is a large, error-prone undertaking for
// little gain: embedded local TTS engines already pronounce a normal
// 2-4 digit civic number naturally when it appears in an ordinary sentence
// (they only spell digit-by-digit for things that look like codes/long
// digit strings). Pragmatic simplification, documented in plans.md, not an
// oversight.
const DOTTED_STREET_TYPE_ABBREVIATIONS: [RegExp, string][] = [
  [/\br\.\s*/gi, 'rue '],
  [/\bav\.\s*/gi, 'avenue '],
  [/\bboul\.\s*/gi, 'boulevard '],
  [/\bch\.\s*/gi, 'chemin '],
];

// Only ever applied to an isolated final token (see below) — a bare
// uppercase "N"/"S"/"E"/"O" almost never occurs elsewhere in a Québec civic
// address except as the trailing cardinal-direction suffix (e.g.
// "boulevard Saint-Jean N."), so restricting to that position avoids
// mangling a street/place name that happens to contain one of these
// letters.
const DIRECTION_SUFFIXES: Record<string, string> = { N: 'nord', S: 'sud', E: 'est', O: 'ouest' };

export function normalizeAddressForSpeech(address: string): string {
  let result = address;
  for (const [pattern, replacement] of DOTTED_STREET_TYPE_ABBREVIATIONS) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(/\s+/g, ' ').trim();

  const tokens = result.split(' ');
  const lastToken = tokens[tokens.length - 1];
  const bareLastToken = lastToken?.replace(/\.$/, '');
  if (bareLastToken && bareLastToken in DIRECTION_SUFFIXES) {
    tokens[tokens.length - 1] = DIRECTION_SUFFIXES[bareLastToken] as string;
    result = tokens.join(' ');
  }

  return result;
}
