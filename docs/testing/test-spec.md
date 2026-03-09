# little-baby-calendar テスト仕様書（実装復元）

本書は **実装コードの実際の分岐** から復元した仕様のみを記載する。推測仕様は記載しない。

## TS-AGE-001 年齢情報計算（暦／修正／在胎）
- 対象関数: `calculateAgeInfo`
- 実装根拠: `src/utils/dateUtils.ts`
- 実装上の挙動:
  1. `targetDate` / `birthDate` は `normalizeToUtcDate` でパースされ、不正なら `Invalid Date` となる。
  2. `targetDate` または `birthDate` が不正な場合、`calculateAgeInfo: Invalid date input` を throw する。
  3. `dueDate` があり、かつ `gestationAtBirthDays < 259` の場合のみ早産扱いになる。
  4. 予定日前は在胎表示 (`gestational.visible=true`)、予定日以降は修正月齢可否を `isWithinCorrectedLimit` で判定する。
  5. `showMode` は `chronologicalOnly` / `gestational` / `corrected` を返す。
- テスト:
  - `__tests__/age.dateUtils.jest.test.ts`
  - `__tests__/dateUtils.full.jest.test.ts`

## TS-AGE-002 カレンダー月ビュー生成（buildCalendarMonthView）
- 対象関数: `buildCalendarMonthView`
- 実装根拠: `src/utils/dateUtils.ts`
- 実装上の挙動:
  1. 月グリッドは `startOfCalendarGrid` と `weeks(5~6)` で構築される。
  2. 暦ラベルは「誕生日セル」または「暦月齢が前日から +1 になったセル」で表示される。
  3. 修正ラベルは `correctedVisible` かつ「予定日同日（なければ月末代替日）」でのみ表示する。
  4. 当月外セルは `calendarAgeLabel = null` に強制される。
  5. 当月に暦ラベルが1件もない場合、`birthDate` 以降セルの最初の `ageInfo` にフォールバック表示を入れる。
- テスト:
  - `__tests__/age.dateUtils.jest.test.ts`
  - `__tests__/dateUtils.full.jest.test.ts`

## TS-AGE-003 日付ユーティリティ（ISO/境界）
- 対象関数: `isIsoDateString`, `normalizeToUtcDate`, `safeParseIsoLocal`, `toUtcDateOnly`, `toIsoDateString`, `todayIsoDate`, `daysBetweenUtc`, `monthKey`, `formatCalendarAgeLabel`
- 実装根拠: `src/utils/dateUtils.ts`
- 実装上の挙動:
  1. ISO バリデーションは `YYYY-MM-DD` の形式のみ。
  2. `normalizeToUtcDate` は `null/undefined/不正形式` で warn して `Invalid Date` を返す。
  3. `toIsoDateString` は `Invalid Date` を受けると throw する。
  4. `daysBetweenUtc` は負値を返さず 0 に丸める。
  5. `formatCalendarAgeLabel` は `ageFormat` に応じて `暦`/`修正` 接頭辞を付与する。
  6. `toUtcDateOnly` は `Invalid Date` 入力を受けた場合 `Invalid Date` を返す。
  7. `daysBetweenUtc` は `start/end` のいずれかが `Invalid Date` の場合も 0 を返す。
- テスト:
  - `__tests__/dateUtils.full.jest.test.ts`

## TS-TEXT-001 年齢ラベル正規化
- 対象関数: `stripChronologicalPrefix`, `normalizeAgeLabelText`
- 実装根拠: `src/utils/ageLabelNormalization.ts`
- 実装上の挙動:
  1. `stripChronologicalPrefix` は先頭 `暦|月齢` + 空白を除去する。
  2. `normalizeAgeLabelText` は空白のみ文字列を `null` にし、`0`/`"0"` は保持する。
- テスト:
  - `__tests__/ageLabelNormalization.jest.test.ts`
  - `__tests__/DayCell.ui.jest.test.tsx`（表示分岐で実使用）

## TS-TEXT-002 テキスト補助（コメント長・検索正規化）
- 対象関数: `remainingChars`, `clampComment`, `normalizeSearchText`
- 実装根拠: `src/utils/text.ts`
- 実装上の挙動:
  1. code point ベースで 500 文字上限を扱う。
  2. `clampComment` は 500 超過時のみ切り詰める。
  3. `normalizeSearchText` は全角英数半角化 + lowercase + 空白圧縮を行う。
- 追加カバー（Phase E）:
  - `undefined` 入力時の nullish fallback 分岐。
  - 空文字入力時の早期 return 分岐。
- テスト:
  - `__tests__/text.utils.jest.test.ts`

## TS-UI-001 DayCell 表示分岐 + イベント
- 対象: `DayCell` コンポーネント
- 実装根拠: `src/components/DayCell.tsx`
- 実装上の挙動:
  1. 在胎ラベルがある場合は上段を在胎表示、修正ラベルを表示しない。
  2. 暦ラベルは `stripChronologicalPrefix` 後に表示される。
  3. 当月外セルはラベル非表示レンダリング。
  4. タップ時に `onPress(day.date)` を呼び出す。
- 追加カバー（Phase E/F）:
  - `gridPos` の最終行/最終列で罫線幅を 0 にする分岐。
  - `isToday` と `achievementCount>0` の表示分岐。
  - 当月セルで `calendarAgeLabel=null` のとき空ラベル2行を表示する分岐。
  - 当月外セルでも hidden プレースホルダ2行を返す分岐。
- テスト:
  - `__tests__/DayCell.ui.jest.test.tsx`

## TS-STATE-001 実績写真の差し替え／削除
- 対象関数: `cleanupReplacedPhotoAsync`, `removeAchievementPhotoAsync`
- 実装根拠: `src/services/achievementService.ts`
- 実装上の挙動:
  1. 差し替え時は `previousPhotoPath` があり、`desiredPhotoPath` が `undefined` でなく、かつ値が変わる場合のみ旧画像削除を呼ぶ。
  2. 実績削除時は引数をそのまま `deleteIfExistsAsync` に委譲する。
- テスト:
  - `__tests__/achievementService.jest.test.ts`

## TS-DATA-001 設定/実績の永続化・移行
- 対象関数: `loadUserSettings`, `loadAchievements`
- 実装根拠: `src/storage/storage.ts`
- 実装上の挙動:
  1. `loadUserSettings` は保存値を `DEFAULT_SETTINGS` で補完して返す。
  2. JSON パース失敗時は warn してデフォルトへフォールバックする。
  3. `loadAchievements` は array / legacy object / map を `Record<date, Achievement[]>` に移行し、正規化したキーで再保存する。
  4. 移行時は `createdAt` / `updatedAt` 欠損を現在時刻で補完する。
- 追加カバー（Phase E/F）:
  - 保存データ無し (`raw=null`) で空ストアを返す。
  - array 形式で `date` 欠損アイテムをスキップする。
  - map 形式でも `date` 欠損で正規化後空配列になるキーを保存対象から除外する。
  - map 形式の空配列エントリ（`safeList.length===0`）を保存対象から除外する。
- テスト:
  - `__tests__/storage.jest.test.ts`

## TS-PHOTO-001 写真ユーティリティ（選択/保存/存在確認/削除）
- 対象関数: `pickAndSavePhotoAsync`, `ensureFileExistsAsync`, `deleteIfExistsAsync`
- 実装根拠: `src/utils/photo.ts`
- 実装上の挙動:
  1. `pickAndSavePhotoAsync` はメディア権限が拒否されると warn して `null` を返す。
  2. 画像選択が cancel または `assets` なしなら `null` を返す。
  3. 画像選択成功時、長辺が 1600px 超過なら `calculateResize` により resize action が渡される。
  4. 保存先ディレクトリがなければ作成し、`achievement-*.jpg` 名で `moveAsync` して destination を返す。
  5. `ensureFileExistsAsync` は path 未指定で `null`、例外時も warn して `null`。
  6. `deleteIfExistsAsync` は path 未指定なら no-op、存在時のみ `idempotent: true` で削除し、例外時は warn のみ。
- 追加カバー（Phase E）:
  - 長辺が閾値以下の画像で resize action が空配列になる。
  - 画像寸法欠損時に width=1600 の fallback resize を使う。
  - 保存ディレクトリ既存時は `makeDirectoryAsync` を呼ばない。
- テスト:
  - `__tests__/photo.utils.jest.test.ts`

## TS-STATE-002 AppState（ロード/移行/ユーザー操作）
- 対象関数: `AppStateProvider`, `useAppState`, `useActiveUser`, `useAchievements`
- 実装根拠: `src/state/AppStateContext.tsx`
- 実装上の挙動:
  1. `useAppState` は provider 外で使用すると throw する。
  2. 初期化時は `APP_STATE_KEY` を優先ロードし、JSON parse 成功時は `ensureStateIntegrity` 後に `loading=false` になる。
  3. `addUser` は users へ追加し、`achievements[userId]=[]` を作る。`activeUserId` が null のとき新規 user を active にする。
  4. `setActiveUser` は存在しない userId を渡すと state を変更しない。
  5. `deleteUser` は削除対象が active の場合、残存 users の先頭へ切り替え、空なら null。
  6. legacy キーがある場合 `loadUserSettings/loadAchievements` で migratedState を組み立て、legacy key 削除と APP_STATE 保存を行う。
- 追加カバー（Phase E/F+）:
  - legacy settings が無い移行で既定値を採用する。
  - `addAchievement/updateAchievement/deleteAchievement` の user bucket fallback 分岐を通す。
  - `updateAchievement` の未存在ユーザーバケット（`?? []`）フォールバック分岐。
  - `users`/`achievements` が null の復元で空構造へ補正する。
- テスト:
  - `__tests__/AppStateContext.jest.test.tsx`

## TS-STATE-003 AchievementsContext（upsert/remove）
- 対象関数: `AchievementsProvider`, `useAchievements`
- 実装根拠: `src/state/AchievementsContext.tsx`
- 実装上の挙動:
  1. `useAchievements` は provider 外で使用すると throw する。
  2. `upsert` は active user 不在なら warn して終了する。
  3. `upsert` は `payload.date` が ISO でない場合 error して終了する。
  4. 新規保存時は `addAchievement`、既存更新時は `updateAchievement` を使い分ける。
  5. `payload.photoPath === null` は「写真削除」を意味し、保存値は `undefined` になる。
  6. 保存処理後は `cleanupReplacedPhotoAsync(previousPhotoPath, payload.photoPath)` を呼ぶ。
  7. `remove` は active user 不在なら warn。対象に `photoPath` があれば `removeAchievementPhotoAsync` を呼ぶ。
- 追加カバー（Phase E/F+）:
  - `loadDay` / `loadMonth` の no-op Promise 解決分岐。
  - active user bucket 欠損時の `store` / `monthCounts` フォールバック分岐。
  - `monthCounts` の月キー初回生成と同月日次カウント集約分岐。
  - 同月の別日エントリ投入で `if (!result[month])` の false 側（既存月）も通過する。
  - `cleanupReplacedPhotoAsync` / `removeAchievementPhotoAsync` 失敗時の catch 分岐。
- テスト:
  - `__tests__/AchievementsContext.jest.test.tsx`

## TS-STATE-004 DateViewContext（日付選択状態）
- 対象関数: `DateViewProvider`, `useDateViewContext`
- 実装根拠: `src/state/DateViewContext.tsx`
- 実装上の挙動:
  1. `useDateViewContext` は provider 外で使用すると throw する。
  2. provider 初期化時、`today` と `selectedDate` は `toUtcDateOnly` で正規化された同値になる。
  3. `selectDateFromCalendar` は入力日付を正規化して `selectedDate` を更新する。
  4. `resetToToday` は `new Date(today)` を用いるため、同時刻値だが別インスタンスで `selectedDate` を更新する。
- テスト:
  - `__tests__/DateViewContext.jest.test.tsx`

## TS-CONTENT-001 法務コンテンツ定数
- 対象: `LEGAL_META`, `ABOUT_TEXT_JA`, `TERMS_TEXT_JA`, `PRIVACY_POLICY_TEXT_JA`
- 実装根拠: `src/content/legal/ja.ts`
- 実装上の挙動:
  1. `LEGAL_META` はアプリ名・運営者・連絡先・発効日・バージョン表記を固定値として公開する。
  2. `ABOUT_TEXT_JA` / `TERMS_TEXT_JA` / `PRIVACY_POLICY_TEXT_JA` は Markdown 文字列として公開される。
  3. 文面にはそれぞれ見出し (`# ...`) と問い合わせ導線が含まれる。
- テスト:
  - `__tests__/models.types.content.jest.test.ts`

## TS-MODEL-001 既定設定定数
- 対象: `DEFAULT_SETTINGS`
- 実装根拠: `src/types/models.ts`
- 実装上の挙動:
  1. `DEFAULT_SETTINGS` は `showCorrectedUntilMonths: 24`, `ageFormat: "ymd"`, `showDaysSinceBirth: true`, `lastViewedMonth: null` を返す。
  2. `UserSettings` 型の既定値として利用される。
- テスト:
  - `__tests__/models.types.content.jest.test.ts`

## TS-DATA-002 storage.ts の追加分岐（例外・legacy object・不正map）
- 対象関数: `loadAchievements`
- 実装根拠: `src/storage/storage.ts`
- 実装上の挙動:
  1. `input.achievements` 配列形式（legacy object）でも `AchievementStore` へ移行する。
  2. 移行保存 (`saveJson`) が失敗すると warn を出して例外を再throwする。
  3. map 形式でも value が配列でない不正入力は `isMapFormat=false` 判定となり、空データ扱いで保存される。
- テスト:
  - `__tests__/storage.jest.test.ts`

## TS-STATE-005 AppState の例外/整合性分岐
- 対象関数: `AppStateProvider`, `useAppState`
- 実装根拠: `src/state/AppStateContext.tsx`
- 実装上の挙動:
  1. `APP_STATE_KEY` のJSONパース失敗時は warn の上で初期状態へフォールバックする。
  2. `ensureStateIntegrity` は不正 `activeUserId` を先頭ユーザーIDへ補正し、`achievements[user.id]` 未定義なら空配列を補完する。
  3. `updateUser` は `settings` を shallow merge し、`id` は不変のまま保持する。
  4. 永続化失敗時 (`persistState`) は warn のみでUI状態更新は継続する。
- テスト:
  - `__tests__/AppStateContext.jest.test.tsx`

## TS-UI-002 App / Navigator / 法務スクリーンの最小UI検証
- 対象: `App`, `Navigator`, `AboutScreen`, `TermsScreen`, `PrivacyPolicyScreen`
- 実装根拠: `src/App.tsx`, `src/navigation/index.tsx`, `src/screens/AboutScreen.tsx`, `src/screens/TermsScreen.tsx`, `src/screens/PrivacyPolicyScreen.tsx`
- 実装上の挙動:
  1. `App` は `useFonts` が false の間 `null` を返し、true のとき Provider チェーンを返す。
  2. `Navigator` は `NavigationContainer` に `COLORS` を反映したthemeを渡し、`DateViewProvider` と `RootNavigator` を内包する。
  3. 各法務スクリーンは対応する法務本文 (`ABOUT_TEXT_JA`/`TERMS_TEXT_JA`/`PRIVACY_POLICY_TEXT_JA`) を `LegalTextScreen` へ渡す。
- テスト:
  - `__tests__/app.navigation.ui.jest.test.tsx`

## TS-BOOT-001 エントリポイント登録
- 対象: `index.ts`
- 実装根拠: `index.ts`
- 実装上の挙動:
  1. `registerRootComponent(App)` が起動時に実行される。
- テスト:
  - `__tests__/app.navigation.ui.jest.test.tsx`


## TS-ZERO-001 App.js はロジックなしブリッジのため coverage 除外
- 対象: `App.js`
- 実装根拠: `App.js`
- 実装上の挙動:
  1. `App.js` は `./src/App` をそのまま再exportするブリッジのみで、独自ロジックを持たない。
  2. coverage 目的のテスト専用実装を避けるため、coverage 設定で除外して運用する。
- テスト/確認:
  - `npm run test:unit -- --coverage` の出力で `App.js` が一覧から除外されることを確認

## TS-ZERO-002 type-only モジュールの coverage 除外（方針維持）
- 対象: `src/models/dataModels.ts`, `src/navigation/types.ts`
- 実装根拠: `src/models/dataModels.ts`, `src/navigation/types.ts`, `jest.config.js`
- 実装上の挙動:
  1. 両ファイルは型定義のみで runtime 実行コードを持たない。
  2. runtime marker のような本番コード混入を避けるため、coverage 設定で除外して運用する。
  3. 型定義の整合性は Jest ではなく `npm run typecheck` (`tsc -p tsconfig.typecheck.json --noEmit`) で担保する。
- テスト/確認:
  - `npm run test:unit -- --coverage` の出力で対象ファイルが一覧から除外されることを確認
  - `npm run typecheck` が成功することを確認（`typechecks/navigation-types.typecheck.ts` を含む）


- Phase F で対象ファイルの残分岐を列挙し、実装挙動に基づく最小ケースを追加。
