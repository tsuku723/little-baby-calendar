import { clampComment, normalizeSearchText, remainingChars } from '../src/utils/text';

describe('text utils', () => {
  test('remainingChars counts unicode code points', () => {
    expect(remainingChars('a')).toBe(499);
    expect(remainingChars('😀😀😀')).toBe(497);
  });

  test('clampComment limits to 500 code points', () => {
    const value = '😀'.repeat(600);
    const clamped = clampComment(value);
    expect([...clamped]).toHaveLength(500);
  });

  test('normalizeSearchText lowercases and normalizes full-width alnum and spaces', () => {
    expect(normalizeSearchText(' ＡＢＣ　１２3  Test ')).toBe('abc 123 test');
  });
});
