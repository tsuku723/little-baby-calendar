# テスト網羅性マトリクス

| 仕様ID | 仕様項目 | Unit | Integration | UI | E2E | テストファイル |
|---|---|---:|---:|---:|---:|---|
| TS-AGE-001 | 年齢情報計算（暦/修正/在胎） | ✅ |  |  |  | `__tests__/age.dateUtils.jest.test.ts` |
| TS-AGE-002 | カレンダー月ビュー生成 | ✅ |  |  |  | `__tests__/age.dateUtils.jest.test.ts` |
| TS-TEXT-001 | 年齢ラベル正規化 | ✅ |  |  |  | `__tests__/ageLabelNormalization.jest.test.ts` |
| TS-TEXT-002 | テキスト補助（文字数・検索正規化） | ✅ |  |  |  | `__tests__/text.utils.test.ts` |
| TS-UI-001 | 日セル表示ルール |  |  | ✅ |  | `__tests__/DayCell.ui.test.tsx` |
| TS-STATE-001 | 実績写真の差し替え・削除 |  |  |  |  | 未実装 |
| TS-DATA-001 | ストレージ読み出しと実績移行 |  | ✅(legacy) |  |  | `__tests__/legacy/services.test.ts` |

## 現状サマリ
- High 優先の純ロジック（年齢計算・文字列正規化・文字数処理）を Unit 化。
- 重要画面の最小 UI として `DayCell` 表示ルールを追加。
- 既存 legacy テストは Jest 対象外にして参照のみ（`__tests__/legacy/`）。
