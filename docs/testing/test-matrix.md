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
| `src/utils/photo.ts` | `pickAndSavePhotoAsync`, `ensureFileExistsAsync`, `deleteIfExistsAsync` | `__tests__/photo.utils.jest.test.ts` | ✅ |
| `src/state/AppStateContext.tsx` | `AppStateProvider`, `useAppState`, `useActiveUser`, `useAchievements` | `__tests__/AppStateContext.jest.test.tsx` | ✅ |
| `src/state/AchievementsContext.tsx` | `AchievementsProvider`, `useAchievements` | `__tests__/AchievementsContext.jest.test.tsx` | ✅ |
| `src/state/DateViewContext.tsx` | `DateViewProvider`, `useDateViewContext` | `__tests__/DateViewContext.jest.test.tsx` | ✅ |
| `src/types/models.ts` | `DEFAULT_SETTINGS` | `__tests__/models.types.content.jest.test.ts` | ✅ |
| `src/content/legal/ja.ts` | `LEGAL_META`, `ABOUT_TEXT_JA`, `TERMS_TEXT_JA`, `PRIVACY_POLICY_TEXT_JA` | `__tests__/models.types.content.jest.test.ts` | ✅ |
| `src/navigation/index.tsx` | `Navigator (default)` | `__tests__/app.navigation.ui.jest.test.tsx` | ✅ |
| `src/App.tsx` | `App (default)` | `__tests__/app.navigation.ui.jest.test.tsx` | ✅ |
| `src/screens/AboutScreen.tsx` | `AboutScreen (default)` | `__tests__/app.navigation.ui.jest.test.tsx` | ✅ |
| `src/screens/TermsScreen.tsx` | `TermsScreen (default)` | `__tests__/app.navigation.ui.jest.test.tsx` | ✅ |
| `src/screens/PrivacyPolicyScreen.tsx` | `PrivacyPolicyScreen (default)` | `__tests__/app.navigation.ui.jest.test.tsx` | ✅ |

### 非関数 export（補助）
- 型・interface export: `src/models/dataModels.ts`, `src/navigation/types.ts`, `src/state/*` など。
- 定数 export: `src/constants/colors.ts`, `src/content/legal/ja.ts`, `src/types/models.ts` の `DEFAULT_SETTINGS`。
- `src/models/dataModels.ts` / `src/navigation/types.ts` は type-only のため runtime 実行経路がなく、coverage から除外する。
- `App.js` は `src/App` への単純ブリッジでロジックを持たないため、coverage から除外する。
- `export default` の画面/コンポーネントは UI テスト最小方針で段階的に追加。

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
| TS-PHOTO-001 | 写真選択/保存・存在確認・削除 | ✅ | ✅ | — | 対象外 | `__tests__/photo.utils.jest.test.ts` |
| TS-STATE-002 | AppState load/migrate/profile/active 制御 | ✅ | ✅ | — | 対象外 | `__tests__/AppStateContext.jest.test.tsx` |
| TS-STATE-003 | AchievementsContext upsert/remove 分岐 | ✅ | ✅ | — | 対象外 | `__tests__/AchievementsContext.jest.test.tsx` |
| TS-STATE-004 | DateViewContext selectedDate/today 制御 | ✅ | — | ✅ | 対象外 | `__tests__/DateViewContext.jest.test.tsx` |
| TS-DATA-002 | storage.ts 例外/legacy object/不正map分岐 | ✅ | ✅ | — | 対象外 | `__tests__/storage.jest.test.ts` |
| TS-STATE-005 | AppState parse失敗/整合性補正/persist失敗分岐 | ✅ | ✅ | — | 対象外 | `__tests__/AppStateContext.jest.test.tsx` |
| TS-UI-002 | App・Navigator・法務Screenの最小表示分岐 | ✅ | — | ✅ | 対象外 | `__tests__/app.navigation.ui.jest.test.tsx` |
| TS-BOOT-001 | index.ts の registerRootComponent 呼び出し | ✅ | — | — | 対象外 | `__tests__/app.navigation.ui.jest.test.tsx` |
| TS-CONTENT-001 | 法務文面・メタデータの公開定数 | ✅ | — | — | 対象外 | `__tests__/models.types.content.jest.test.ts` |
| TS-MODEL-001 | 既定ユーザー設定定数（types/models） | ✅ | — | — | 対象外 | `__tests__/models.types.content.jest.test.ts` |
| TS-ZERO-002 | type専用/ブリッジモジュールは coverage 対象から除外 | — | — | — | 対象外 | `jest.config.js`, `package.json` (`typecheck`) |

## 現状サマリ
- 旧 ⛔ 対象（`photo.ts` / `AppStateContext` / `AchievementsContext` / `DateViewContext`）を Jest テスト追加で ✅ 化。
- 既存 `legacy` テストは `jest.config.js` の ignore 設定に従い対象外のまま維持。

- Phase C で `src/navigation/index.tsx`, `src/App.tsx`, `index.ts`, `src/screens/AboutScreen.tsx`, `src/screens/TermsScreen.tsx`, `src/screens/PrivacyPolicyScreen.tsx` を最小UI検証へ追加。

- Phase E で `AppStateContext` / `storage` / `photo` / `text` / `DayCell` / `AchievementsContext` の未踏分岐を追加検証。
