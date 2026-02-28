/**
 * 暦月齢ラベルには過去実装由来で「暦」「月齢」プレフィックスが混在しうるため、
 * 先頭プレフィックスを単一の正規表現で安全に除去して表示を統一する。
 */
export const stripChronologicalPrefix = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  return value.replace(/^(?:暦|月齢)\s*/, "");
};

/**
 * 空白だけのラベルは UI 上の欠落と同等なので null 扱いに正規化する。
 * 0 や "0" は有効値として保持する。
 */
export const normalizeAgeLabelText = (
  value: string | number | null | undefined
): string | number | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return value;
};
