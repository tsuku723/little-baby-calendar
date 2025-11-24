export const remainingChars = (s: string): number => 500 - [...(s ?? "")].length;

export const clampComment = (s: string): string => {
  const chars = [...(s ?? "")];
  if (chars.length <= 500) {
    return s;
  }
  return chars.slice(0, 500).join("");
};
