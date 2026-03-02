# テスト網羅性マトリクス

## Phase 0: export インベントリ（src 配下）

> 抽出コマンド: `rg "^export (async )?(function|const|let|class) |^export \{.*\}|^export default" src --line-number`

### 関数 export（主対象）

| モジュール | export 関数 | 既存/追加テスト | カバー状況 |
|---|---|---|---|
| `src/utils/dateUtils.ts` | `isIsoDateString`, `normalizeToUtcDate`, `safeParseIsoLocal`, `toUtcDateOnly`, `toIsoDateString`, `todayIsoDate`, `formatCalendarAgeLabel`, `daysBetweenUtc`, `calculateAgeInfo`, `monthKey`, `buildCalendarMonthView` | `__tests__/age.dateUtils.jest.test.ts`, `__tests__/dateUtils.full.jest.test.ts` | ✅ |
| `src/utils/ageLabelNormalization.ts` | `stripChronologicalPrefix`, `normalizeAgeLabelText` | `__tests__/ageLabelNormalization.jest.test.ts` | ✅ |
| `src/utils/text.ts` | `remainingChars`, `clampComment`, `normalizeSearchText` | `__tests__/text.utils.jest.test.ts` | ✅ |
| `src/services/achievementService.ts` | `cleanupReplacedPhotoAsync`, `removeAchievementPhotoAsync` | `__tests__/achievementService.jest.test.ts` | ✅ |
| `src/storage/storage.ts` | `loadUserSettings`, `loadAchievements` | `__tests__/storage.jest.test.ts` | ✅ |
| `src/utils/photo.ts` | `pickAndSavePhotoAsync`, `ensureFileExistsAsync`, `deleteIfExistsAsync` | （未追加: Expo FileSystem/ImagePicker 依存のため unit 対象外） | ⛔ |
| `src/state/AppStateContext.tsx` | `AppStateProvider`, `useAppState`, `useActiveUser`, `useAchievements` | （未追加: provider 統合挙動が中心） | ⛔ |
| `src/state/AchievementsContext.tsx` | `AchievementsProvider`, `useAchievements` | （未追加: provider 統合挙動が中心） | ⛔ |
| `src/state/DateViewContext.tsx` | `DateViewProvider`, `useDateViewContext` | （未追加: provider 統合挙動が中心） | ⛔ |

### 非関数 export（補助）
- 型・interface export: `src/models/dataModels.ts`, `src/navigation/types.ts`, `src/state/*` など。
- 定数 export: `src/constants/colors.ts`, `src/content/legal/ja.ts`, `src/types/models.ts` の `DEFAULT_SETTINGS` など。
- `export default` の画面/コンポーネントは UI テスト最小方針のため今回の完全網羅対象外。

## 仕様 × テストレベル

| 仕様ID | 仕様項目 | Unit | Integration (Jest) | UI (min) | E2E | テストファイル |
|---|---|---:|---:|---:|---:|---|
| TS-AGE-001 | 年齢情報計算（暦/修正/在胎） | ✅ | — | — | 対象外 | `__tests__/age.dateUtils.jest.test.ts`, `__tests__/dateUtils.full.jest.test.ts` |
| TS-AGE-002 | カレンダー月ビュー生成（buildCalendarMonthView） | ✅ | — | — | 対象外 | `__tests__/age.dateUtils.jest.test.ts`, `__tests__/dateUtils.full.jest.test.ts` |
| TS-AGE-003 | 日付ユーティリティ（ISO/日差/月キー） | ✅ | — | — | 対象外 | `__tests__/dateUtils.full.jest.test.ts` |
| TS-TEXT-001 | 年齢ラベル正規化 | ✅ | — | ✅ | 対象外 | `__tests__/ageLabelNormalization.jest.test.ts`, `__tests__/DayCell.ui.jest.test.tsx` |
| TS-TEXT-002 | テキスト補助（文字数・検索正規化） | ✅ | — | — | 対象外 | `__tests__/text.utils.jest.test.ts` |
| TS-UI-001 | DayCell 表示分岐 + onPress | — | — | ✅ | 対象外 | `__tests__/DayCell.ui.jest.test.tsx` |
| TS-STATE-001 | 写真差し替え/削除の副作用制御 | ✅ | ✅ | — | 対象外 | `__tests__/achievementService.jest.test.ts` |
| TS-DATA-001 | 設定/実績の永続化・移行 | ✅ | ✅ | — | 対象外 | `__tests__/storage.jest.test.ts` |

## 現状サマリ
- 最優先対象（`buildCalendarMonthView`、日付境界、修正月齢、DayCellイベント、STATE/DATA 副作用）を Jest 29 系 unit/integration 相当で追加。
- 既存 `legacy` テストは `jest.config.js` の ignore 設定に従い対象外のまま維持。
