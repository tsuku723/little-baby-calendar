import { clampComment, normalizeSearchText, remainingChars } from '../src/utils/text';

describe('text utils exports', () => {
  test('remainingChars counts unicode code points', () => {
    expect(remainingChars('😀😀😀')).toBe(497);
  });

  test('clampComment keeps short text and truncates long text', () => {
    const short = 'abc';
    expect(clampComment(short)).toBe(short);

    const long = 'あ'.repeat(510);
    expect([...clampComment(long)]).toHaveLength(500);
  });

  test('normalizeSearchText handles null and full-width conversion', () => {
    expect(normalizeSearchText(null)).toBe('');
    expect(normalizeSearchText(' ＡＢＣ　１２3  Test ')).toBe('abc 123 test');
  });
});
