export const remainingChars = (s: string): number => 500 - [...(s ?? "")].length;

export const clampComment = (s: string): string => {
  const chars = [...(s ?? "")];
  if (chars.length <= 500) {
    return s;
  }
  return chars.slice(0, 500).join("");
};

/**
 * 検索用に軽微な正規化を行う。
 * - 英字を小文字化
 * - 全角英数を半角へ変換
 * - 連続した空白を 1 つにまとめて前後を trim
 */
export const normalizeSearchText = (value?: string | null): string => {
  if (!value) return "";
  const toHalfWidth = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
  return toHalfWidth
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};
