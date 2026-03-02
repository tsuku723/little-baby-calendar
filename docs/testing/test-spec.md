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
- テスト:
  - `__tests__/storage.jest.test.ts`
