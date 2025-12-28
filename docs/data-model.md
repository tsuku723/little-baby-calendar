# データモデル定義（最新版：複数プロフィール + Today画面対応）

本ドキュメントは、従来モデル:contentReference[oaicite:0]{index=0} を  
以下の新仕様に対応させた完全版である。

- **複数プロフィール管理（兄弟・双子対応）**
- **Today 画面新設に伴うメインユーザー切替**
- **記録名称「できた／頑張った」→「記録」に統一**
- **ユーザーごとの独立データ管理**
- **将来の拡張（タグ・グラフ等）に耐える構造**

---

# 1. 永続データモデル（Persistent Models）

## 1.1 AppState（アプリ全体の永続データのトップ構造）

複数ユーザー対応のため、保存構造を最上位に一本化する。

```ts
type AppState = {
  users: UserProfile[]                 // 複数ユーザーの配列
  activeUserId: string | null          // 現在選択しているユーザー
  achievements: Record<string, Achievement[]> 
  // achievements[userId] = Achievement[]
}
```

### 重要ポイント
- **ユーザーごとに記録データを完全分離**  
- `activeUserId` により全画面の参照データが切り替わる  
- 既存ユーザーが1名であれば、初期移行時に users[0] を activeUser に設定するだけでよい  

---

## 1.2 UserProfile（複数プロフィールの1人分）

```ts
type UserProfile = {
  id: string                   // UUID
  name: string                 // 子どもの名前
  birthDate: string            // ISODateString（必須）
  dueDate: string | null       // 出産予定日（任意）
  settings: UserSettings       // 個別設定
  createdAt: string            // プロフィール作成日
}
```

---

## 1.3 UserSettings（従来仕様 + プロフィール分離に更新）

```ts
type AgeFormat = "md" | "ymd"

type UserSettings = {
  showCorrectedUntilMonths: number | null   // 24 / 36 / null
  ageFormat: AgeFormat                      // "md" | "ymd"
  showDaysSinceBirth: boolean               // 日齢表示 ON/OFF
  lastViewedMonth: string | null            // "YYYY-MM-01" の形式（任意）
}
```

### 更新点
- 従来は「アプリ全体の設定」だったが、**ユーザーごとに独立**させた。
- ユーザー切替時にカレンダー・Today 画面が即座に再計算される。

---

## 1.4 Achievement（記録データ：名称統一後）

```ts
type Achievement = {
  id: string
  date: string          // ISODateString（UTC丸めされた日付）
  category?: string     // 現在未使用。将来のタグ機能用予約フィールド（growth/effort などのレガシー値を保持する場合あり）
  title: string         // 記録タイトル（短文）
  memo?: string         // 任意メモ
  photoPath?: string    // 画像パス（任意）
  createdAt: string     // ISODateTime
  updatedAt?: string
}
```

### 更新点
- カテゴリ（成長/頑張った）を UI から廃止し、`category` フィールドは予約領域として保持するだけに変更
- 既存データの `growth` / `effort` などは `category` に温存し、ロジックでは参照しない

---

## 1.5 AchievementStore（複数プロフィール対応後の構造）

既存の1ユーザー前提構造では不十分なため、アプリ全体構造で管理する。

```ts
// AppState 内 achievements の型
Record<string, Achievement[]>
```

保存例：

```json
{
  "users": [
    {
      "id": "u1",
      "name": "徠生",
      "birthDate": "2025-10-01",
      "dueDate": "2025-12-01",
      "settings": {
        "showCorrectedUntilMonths": 24,
        "ageFormat": "md",
        "showDaysSinceBirth": true,
        "lastViewedMonth": "2026-04-01"
      }
    }
  ],
  "activeUserId": "u1",
  "achievements": {
    "u1": [
      {
        "id": "a001",
        "date": "2026-04-10",
        "category": "growth",
        "title": "つかまり立ち",
        "memo": "ソファにつかまって数秒立てた",
        "createdAt": "2026-04-10T09:12:00Z"
      }
    ]
  }
}
```

---

# 2. 派生データモデル（View Models）

## 2.1 AgeInfo（従来仕様を維持）

```ts
type AgeInfo = {
  chronological: {
    years: number
    months: number
    days: number
    formatted: string
  }
  corrected: {
    years: number
    months: number
    days: number
    formatted: string | null
    visible: boolean
  }
  daysSinceBirth: number
}
```

---

## 2.2 CalendarDay（複数プロフィール対応のまま据え置き）

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

## 2.3 CalendarMonthView

```ts
type CalendarMonthView = {
  year: number
  month: number
  days: CalendarDay[]
}
```

---

## 2.4 AchievementListItem（記録一覧用）

```ts
type AchievementListItem = {
  id: string
  date: string
  dateLabel: string
  title: string
}
```

---

# 3. Today Screen 用データモデル（新規）

Today 画面で必要な項目を一度に返す。

```ts
type TodayView = {
  userName: string
  date: string                 // 今日の日付
  ageInfo: AgeInfo             // 今日基準の実/修/月齢
  latestRecord: Achievement | null
}
```

---

# 4. データモデルとユースケースの紐付け

| 機能 | 使用モデル |
|------|------------|
| 初回セットアップ | UserProfile / UserSettings |
| Today 画面 | TodayView / AgeInfo |
| カレンダー | CalendarMonthView / CalendarDay |
| 記録追加・編集 | Achievement |
| 記録一覧 | AchievementListItem |
| 複数プロフィール | AppState / UserProfile / activeUserId |

---

# 5. 保存キー（更新版）

```ts
const STORAGE_KEYS = {
  appState: "little_baby_calendar_app_state"   // すべての永続データを1箇所に保存
}
```

※ 従来の `userSettings` `achievementStore` は廃止  
（複数ユーザー対応後は分離管理が不可能なため）

---

# 6. 今後の拡張を見据えた構造

- タグ分類を拡張しても Achievement モデルが崩れない  
- グラフ可視化で使用する集計データは  
  `achievements[userId]` から動的生成すればよい  
- クラウド同期を将来実装する場合  
  `AppState` ごと同期するだけでデータの一貫性が保てる  

---

# 7. まとめ（今回の更新点）

- **複数プロフィール対応のため AppState を新設**
- 記録分類は UI から撤廃し、`category` を予約フィールドとして温存
- UserSettings を **ユーザー単位へ移動**
- Today Screen 用の **TodayView** を新規追加
- 保存キーを **appState 1本化** に変更
- 既存 UI のデータ取り回しを完全に統一化

---

