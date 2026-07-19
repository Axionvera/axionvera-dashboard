import { fuzzyMatch, fuzzyScore, levenshtein, tokenize } from '@/search/fuzzy';

describe('fuzzy matching', () => {
  it('returns exact substring matches with score 1', () => {
    expect(fuzzyScore('deposit', 'user deposit transaction')).toBe(1);
    expect(fuzzyMatch('quorum', 'increase quorum threshold')).toBe(true);
  });

  it('matches typos within threshold', () => {
    expect(fuzzyMatch('depositt', 'deposit transaction')).toBe(true);
    expect(fuzzyMatch('goverance', 'governance proposal vote')).toBe(true);
  });

  it('rejects unrelated strings', () => {
    expect(fuzzyMatch('xyzabc', 'deposit transaction')).toBe(false);
    expect(fuzzyScore('xyzabc', 'deposit transaction')).toBe(0);
  });

  it('tokenizes and scores multi-word queries', () => {
    const score = fuzzyScore('quorum threshold', 'increase quorum threshold to 40');
    expect(score).toBeGreaterThan(0);
  });

  it('computes levenshtein distance', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('tokenizes strings into words', () => {
    expect(tokenize('  Hello   World  ')).toEqual(['hello', 'world']);
  });
});
