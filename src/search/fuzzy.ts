/**
 * Lightweight fuzzy matching for client-side search.
 * Combines substring matching with token overlap and edit-distance scoring.
 */

const DEFAULT_THRESHOLD = 0.55;

/** Normalize text for comparison. */
export function normalizeText(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Tokenize a string into lowercase words. */
export function tokenize(value: string): string[] {
  return normalizeText(value).split(/\s+/).filter(Boolean);
}

/** Levenshtein edit distance between two strings. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

/** Similarity ratio in [0, 1] based on edit distance. */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Score how well a query matches a haystack string.
 * Returns 0 when no meaningful match is found.
 */
export function fuzzyScore(query: string, haystack: string, threshold = DEFAULT_THRESHOLD): number {
  const q = normalizeText(query);
  const h = normalizeText(haystack);
  if (!q) return 1;
  if (!h) return 0;

  if (h.includes(q)) return 1;

  const queryTokens = tokenize(q);
  const haystackTokens = tokenize(h);

  let tokenScore = 0;
  for (const qt of queryTokens) {
    let best = 0;
    for (const ht of haystackTokens) {
      if (ht.includes(qt)) {
        best = Math.max(best, 1);
      } else {
        best = Math.max(best, similarity(qt, ht));
      }
    }
    tokenScore += best;
  }
  tokenScore /= queryTokens.length;

  const fullSimilarity = similarity(q, h);
  const score = Math.max(tokenScore, fullSimilarity);

  return score >= threshold ? score : 0;
}

/** Returns true when the query fuzzy-matches the haystack. */
export function fuzzyMatch(query: string, haystack: string, threshold = DEFAULT_THRESHOLD): boolean {
  return fuzzyScore(query, haystack, threshold) > 0;
}
