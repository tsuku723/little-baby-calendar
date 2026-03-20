export const remainingChars = (s: string): number => 500 - [...(s ?? "")].length;

export const clampComment = (s: string): string => {
  const chars = [...(s ?? "")];
  if (chars.length <= 500) {
    return s;
  }
  return chars.slice(0, 500).join("");
};

/**
 * 検索用に正規化を行う。
 * - NFKC正規化（半角カタカナ→全角・全角英数→半角など）
 * - 英字を小文字化
 * - 連続した空白を 1 つにまとめて前後を trim
 */
export const normalizeSearchText = (value?: string | null): string => {
  if (!value) return "";
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};
