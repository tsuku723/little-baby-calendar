# 月齢/修正月齢/在胎週数 テスト仕様

## 判定ルール

- 予定日は妊娠40週0日（280日）として扱う。
- `prematurityDays = daysBetween(birth, due)`
- `gestationAtBirthDays = 280 - prematurityDays`
- `isPreterm = gestationAtBirthDays < 259`（37週0日未満）

## 表示ルール

- 単独表示（早産でない、または表示条件に当てはまらない）:
  - `月齢 {暦月齢}`
- 予定日前（早産かつ `target < due`）:
  - `在胎 {在胎週数}（暦 {暦月齢}）`
- 予定日以降（早産かつ `target >= due`）:
  - `修正 {修正月齢}（暦 {暦月齢}）`
- `target == due` は予定日以降扱い:
  - `修正 0ヶ月0日` を表示

- カレンダー表示では、誕生日前のセルに暦月齢ラベルを表示しない。
- 修正月齢ラベルは月初固定ではなく、予定日を起点に「修正月齢が1か月進んだ日」に表示する（例: due=1/10 -> 2/10 に修正0ヶ月）。

## 計算ルール

- 日数差は UTC 00:00 基準の暦日差で算出する。
- 月齢差分はアンカー法を使う。
  - `addMonthsClamped(base, months)` を利用。
  - アンカーが end を超えた場合は month を1つ戻す。
  - days は `daysBetween(anchor, end)` で算出し、負値にならない。

## テストケース

1. 月末跨ぎで負日が出ない
   - birth: `2025-01-31`
   - target: `2025-03-01`
   - 期待: 表示に `-` が含まれない、`days >= 0`

2. うるう年
   - birth: `2024-02-29`
   - target: `2024-03-28` / `2024-03-29`
   - 期待: いずれも days が負にならない

3. 早産境界
   - `gestationAtBirthDays=258` は preterm
   - `gestationAtBirthDays=259` は not preterm

4. 予定日前表示
   - early preterm + `target < due`
   - 期待: gestational visible / corrected not visible

5. 予定日当日表示
   - early preterm + `target == due`
   - 期待: corrected `0才0ヶ月0日` visible / gestational not visible

6. 日齢表示設定
   - `showDaysSinceBirth=false`
   - 期待: UI 上で「生まれてから◯日目」を表示しない
