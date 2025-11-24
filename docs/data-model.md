# データモデル定義（data-model）

## 1. 概要

本ドキュメントは、リトルベビーカレンダーの**永続データ構造**と  
画面表示に用いる**派生データ構造（ViewModel）**を定義する。

- 永続データ：端末内ストレージ（例：AsyncStorage）に保存される JSON
- 派生データ：永続データ＋日付計算から動的に生成される値（保存しない）

---

## 2. 永続データモデル

### 2.1 UserSettings（ユーザー設定）

アプリ全体の振る舞いを決める設定。

```ts
type AgeFormat = "md" | "ymd"

type UserSettings = {
  birthDate: string              // ISODateString（例: "2025-10-01"）
  dueDate: string | null         // ISODateString or null（予定日未入力の場合は null）
  showCorrectedUntilMonths: number | null
  // 修正月齢表示上限（月数）
  // 例: 24, 36, null（制限なし）

  ageFormat: AgeFormat           // "md" or "ymd"
  showDaysSinceBirth: boolean    // 生まれてからの日数表示 ON/OFF（R-013）

  lastViewedMonth: string | null // ISODateString（その月の1日を想定。例："2026-04-01"）
}
```

#### 制約

- `birthDate` は必須。日付として妥当であること。
- `dueDate` は null 許容。設定されている場合は `birthDate` 以前・以後いずれも許容。
- `showCorrectedUntilMonths`:
  - 24 または 36 または null（制限なし）のいずれか。
- `ageFormat`:
  - `"md"`（月＋日）、`"ymd"`（年＋月＋日）のいずれか。
- `showDaysSinceBirth`:
  - 初期値は `true` でも `false` でもよいが、初期セットアップ時に決定する。
- `lastViewedMonth`:
  - R-009 を実装する場合のみ使用。
  - `"YYYY-MM-01"` 形式で保存する（その月の1日固定にすることで扱いやすくする）。

---

### 2.2 Achievement（できた・頑張った記録）

日付ごとの「できた」「頑張った」を表現する1件分のレコード。

```ts
type AchievementType = "did" | "tried"   // "did" = できた, "tried" = 頑張った

type Achievement = {
  id: string              // 一意なID（UUIDなど）
  date: string            // ISODateString（対象日。例: "2026-04-10"）※UTC丸め済み
  type: AchievementType   // "did" or "tried"
  title: string           // できた／頑張った内容（1行テキスト）
  memo?: string           // 任意のメモ（複数行可）
  createdAt: string       // 作成日時（ISODateTime推奨、例: "2026-04-10T09:12:00Z"）
  updatedAt?: string      // 更新日時（編集時のみセット）
}
```

#### 制約

- `id` はアプリ内で一意であること。
- `date` は対象日のみ（時刻は 00:00 UTC に正規化して扱う前提）。
- 同じ日付に複数 `Achievement` が存在してもよい。
- 一覧表示（S-04）では `date` 降順 → `createdAt` 降順 程度のルールでよい。

---

### 2.3 AchievementStore（記録の保存形式）

AsyncStorage 等に保存する際のラップ構造。  
※シンプルに配列だけ保存してもよいが、将来拡張を考えてオブジェクトで持つ前提。

```ts
type AchievementStore = {
  achievements: Achievement[]
}
```

#### 保存例（JSONイメージ）

```json
{
  "achievements": [
    {
      "id": "a1b2c3",
      "date": "2026-04-10",
      "type": "did",
      "title": "初めてつかまり立ち",
      "memo": "ソファにつかまって数秒立てた",
      "createdAt": "2026-04-10T09:12:00Z",
      "updatedAt": "2026-04-10T09:20:00Z"
    }
  ]
}
```

---

### 2.4 永続化キー（AsyncStorage キー案）

```ts
const STORAGE_KEYS = {
  userSettings: "little_baby_calendar_user_settings",
  achievementStore: "little_baby_calendar_achievements"
}
```

---

## 3. 派生データモデル（ViewModel）

永続データ＋計算ロジックから導出して画面に渡す構造。  
※これらは保存せず、都度生成する。

### 3.1 AgeInfo（年齢情報）

```ts
type AgeInfo = {
  chronological: {
    years: number
    months: number
    days: number
    formatted: string       // 例: "2m4d" or "1y2m4d"
  }
  corrected: {
    years: number
    months: number
    days: number
    formatted: string | null // 修正月齢非表示の場合は null
    visible: boolean         // カレンダー上で「修」を出すかどうか
  }
  daysSinceBirth: number     // 生まれてから何日目か
}
```

---

### 3.2 CalendarDay（カレンダー1セル分）

```ts
type CalendarDay = {
  date: string
  isCurrentMonth: boolean
  isToday: boolean
  ageInfo: AgeInfo | null
  hasAchievements: boolean
}
```

---

### 3.3 CalendarMonthView

```ts
type CalendarMonthView = {
  year: number
  month: number
  days: CalendarDay[]
}
```

---

### 3.4 AchievementListItem

```ts
type AchievementListItem = {
  id: string
  date: string
  dateLabel: string
  type: AchievementType
  typeLabel: string
  title: string
}
```

---

## 4. データモデルと要求定義の紐付け

- `UserSettings` → R-001, R-005, R-006, R-007, R-009, R-012, R-013  
- `Achievement` / `AchievementStore` → R-007, R-010, R-011  
- `AgeInfo` / `CalendarDay` / `CalendarMonthView` → R-002, R-003, R-004  
- `AchievementListItem` → R-011  

---

## 5. 実装方針メモ

- 永続データは 1ユーザー前提。
- 保存単位：
  - `UserSettings`
  - `AchievementStore`
- UI層には常に ViewModel を渡す。

```ts
type CalendarScreenProps = {
  monthView: CalendarMonthView
  onSelectDay: (date: string) => void
  onNextMonth: () => void
  onPrevMonth: () => void
  onToday: () => void
}
```

