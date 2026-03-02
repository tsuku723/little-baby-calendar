# little-baby-calendar テスト仕様書（実装復元）

本書は実装コードから復元した仕様のみを記載する。要件推測は含めない。

## TS-AGE-001 年齢情報計算（暦／修正／在胎）
- **目的**: 指定日・誕生日・予定日から表示用年齢情報を計算する。
- **前提**: `targetDate`/`birthDate` は ISO 日付文字列。`dueDate` は null 可。
- **入力**: `calculateAgeInfo({ targetDate, birthDate, dueDate, showCorrectedUntilMonths, ageFormat })`
- **手順**:
  1. ISO 日付を `normalizeToUtcDate` で厳密パースする。
  2. `diffYmdAnchored` で暦年齢を算出する。
  3. `gestationAtBirthDays < 259` で早産判定する。
  4. 予定日前は在胎表示、予定日以降は修正月齢表示可否を判定する。
- **期待結果**:
  - 不正日付入力時は例外送出。
  - 早産で予定日前なら `gestational.visible=true`。
  - 早産で予定日以降かつ上限内なら `corrected.visible=true`。
  - `showMode` は `chronologicalOnly/gestational/corrected` のいずれか。
- **例外**: 不正日付で `calculateAgeInfo` が `Error` を投げる。
- **受入条件**: 上記フラグとフォーマットがテストで再現されること。
- **根拠**: `src/utils/dateUtils.ts` の `calculateAgeInfo`, `normalizeToUtcDate`, `diffYmdAnchored`, `isWithinCorrectedLimit`。

## TS-AGE-002 カレンダー月ビュー生成
- **目的**: 月グリッド（5〜6週）と日別ラベル・実績件数を構築する。
- **前提**: `buildCalendarMonthView` に `anchorDate`, `settings`, `birthDate`, `dueDate` を渡す。
- **入力**: `buildCalendarMonthView({...})`
- **手順**:
  1. 月初の曜日からグリッド開始日を算出。
  2. 各セルで `calculateAgeInfo` を計算。
  3. 暦ラベルは月齢変化時または誕生日セルで表示。
  4. 修正ラベルは予定日「同日」または月末補正日に限定表示。
  5. 当月に暦ラベルが1件もない場合は誕生日以降セルへ補完。
- **期待結果**:
  - 予定日前セルに修正ラベルは出ない。
  - 修正ラベルは due anniversary 日のみ出る。
  - 誕生日前セルへ暦ラベル補完しない。
- **例外**: `birthDate` 未設定/不正時は `ageInfo=null`。
- **受入条件**: 指定日の `calendarAgeLabel` 有無が一致すること。
- **根拠**: `src/utils/dateUtils.ts` の `buildCalendarMonthView`, `startOfCalendarGrid`, `formatCalendarAgeLabel`。

## TS-TEXT-001 年齢ラベル正規化
- **目的**: 表示上不要な接頭辞・空白ラベルを正規化する。
- **前提**: 表示前に `stripChronologicalPrefix` / `normalizeAgeLabelText` を通す。
- **入力**: `string | number | null | undefined`
- **手順**:
  1. `stripChronologicalPrefix` で先頭 `暦|月齢` を除去。
  2. `normalizeAgeLabelText` で空白文字列のみ null 化。
- **期待結果**:
  - `0`, `"0"`, `"0ヶ月"` は保持。
  - 空白のみ文字列は null。
- **例外**: null/undefined は null として返る。
- **受入条件**: 上記変換が値型を保って成立。
- **根拠**: `src/utils/ageLabelNormalization.ts` の `stripChronologicalPrefix`, `normalizeAgeLabelText`。

## TS-TEXT-002 テキスト補助（文字数・検索正規化）
- **目的**: 入力文字数制限と検索の軽微正規化を提供する。
- **前提**: Unicode サロゲートを1文字として扱う。
- **入力**: `remainingChars`, `clampComment`, `normalizeSearchText`
- **手順**:
  1. `remainingChars` は 500 から code point 長を減算。
  2. `clampComment` は 500 code point で切り詰め。
  3. `normalizeSearchText` は全角英数→半角、lowercase、空白圧縮。
- **期待結果**: 絵文字含む入力で文字数計算が破綻しない。
- **例外**: 未入力は空文字として扱う。
- **受入条件**: 500 文字上限と検索正規化の結果が一致。
- **根拠**: `src/utils/text.ts` の `remainingChars`, `clampComment`, `normalizeSearchText`。

## TS-UI-001 日セル表示ルール
- **目的**: 日セルに表示するラベル優先順位（在胎 > 暦+修正 > 暦）を保証する。
- **前提**: `DayCell` は `CalendarDay` を受ける。
- **入力**: `day.calendarAgeLabel.{chronological,corrected,gestational}`
- **手順**:
  1. 暦ラベル接頭辞を除去し空白を正規化。
  2. 在胎ラベルがある場合、上段のみ在胎表示。
  3. 修正ラベルがある場合、上段=暦/下段=修正表示。
- **期待結果**:
  - legacy 接頭辞（暦/月齢）は最終表示に出ない。
  - 在胎表示時は修正ラベルを表示しない。
  - タップ時に `onPress(day.date)` を呼ぶ。
- **例外**: 当月外セルはラベル非表示。
- **受入条件**: 表示テキストと onPress 引数が一致。
- **根拠**: `src/components/DayCell.tsx` の `DayCell` コンポーネント。

## TS-STATE-001 実績写真の差し替え・削除
- **目的**: 実績更新/削除時の画像ファイルリークを防ぐ。
- **前提**: 実績編集時に旧パス・新パスが比較可能。
- **入力**: `cleanupReplacedPhotoAsync(previousPhotoPath, desiredPhotoPath)`, `removeAchievementPhotoAsync(photoPath)`
- **手順**:
  1. 差し替え時は「旧あり・新指定あり・同一でない」場合のみ旧画像削除。
  2. 実績削除時は指定パスを削除処理へ委譲。
- **期待結果**: 不要画像のみ削除される。
- **例外**: `undefined/null` 入力時は安全に no-op。
- **受入条件**: 条件分岐どおり削除呼び出しが発生。
- **根拠**: `src/services/achievementService.ts` の `cleanupReplacedPhotoAsync`, `removeAchievementPhotoAsync`。

## TS-DATA-001 ストレージ読み出しと実績移行
- **目的**: 旧形式を含む保存データを辞書形式へ正規化する。
- **前提**: AsyncStorage に map/object/array 形式の揺れがありうる。
- **入力**: `loadUserSettings`, `loadAchievements`
- **手順**:
  1. JSON パース失敗時はデフォルトへフォールバック。
  2. 実績を `migrateToMap` で `Record<date, Achievement[]>` に統合。
  3. 日付キーを `normalizeDateKeySafe` で正規化。
- **期待結果**:
  - 設定はデフォルト項目を補完して返す。
  - 実績は map 形式で返却・保存される。
- **例外**: 不正 JSON は warn して fallback。
- **受入条件**: map 化と timestamp 補完が成立。
- **根拠**: `src/storage/storage.ts` の `loadUserSettings`, `loadAchievements`, `migrateToMap`, `safeParse`。
