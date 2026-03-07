import { normalizeAgeLabelText, stripChronologicalPrefix } from '../src/utils/ageLabelNormalization';

describe('age label normalization', () => {
  test('strips legacy prefix and keeps zero-like values', () => {
    expect(stripChronologicalPrefix('暦 1才2ヶ月')).toBe('1才2ヶ月');
    expect(normalizeAgeLabelText('0ヶ月')).toBe('0ヶ月');
    expect(normalizeAgeLabelText(0)).toBe(0);
  });

  test('converts blank strings to null', () => {
    expect(normalizeAgeLabelText(' 　\t ')).toBeNull();
  });

  test('stripChronologicalPrefix returns null for nullish values', () => {
    expect(stripChronologicalPrefix(null)).toBeNull();
    expect(stripChronologicalPrefix(undefined)).toBeNull();
  });

});
