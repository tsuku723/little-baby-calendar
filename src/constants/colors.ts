export const COLORS = {
  // 背景
  background: "#F4F7F1",
  surface: "#FBFAF7",

  // セル
  cellCurrent: "#FBFAF7",
  cellDimmed: "#F1EFE8",

  // 枠・区切り
  border: "#E3E0D8",

  // 文字
  textPrimary: "#4A3F35",
  textSecondary: "#8B8278",

  // アクセント
  accentMain: "#F2A48A",
  accentSub: "#F6C1CC",
  highlightToday: "#CFE6D6",

  // 曜日
  sunday: "#E7A3A3",
  saturday: "#A9C4E4",
  weekday: "#8B8278",
};

export type ColorKeys = keyof typeof COLORS;
