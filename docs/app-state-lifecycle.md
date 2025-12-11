# アプリ状態管理仕様（app-state-lifecycle）

本ドキュメントは、リトルベビーカレンダーにおける  
**アプリ全体の状態（AppState）のライフサイクルと管理ルール** を定義する。

- 対象：複数プロフィール対応版（AppState / activeUserId 導入後）
- 目的：実装時の判断ブレ・不整合・クラッシュを防ぐこと

---

## 1. 用語と前提

### 1.1 AppState

永続データのトップレベル構造（AsyncStorage に保存）。

```ts
type AppState = {
  users: UserProfile[]
  activeUserId: string | null
  achievements: Record<string, Achievement[]>
}
```

### 1.2 activeUser

- `activeUserId` に対応する `UserProfile`
- 画面表示・計算・記録など、**すべて activeUser 前提で動く**

### 1.3 旧ストレージ構造

- 旧：`userSettings` / `achievementStore` キー
- 新：`appState` キー（AppState 全体）

本仕様では、旧構造から新構造への移行も扱う。

---

## 2. AppState 初期化フロー（起動時）

### 2.1 通常フロー（新構造が既に存在する場合）

1. アプリ起動
2. AsyncStorage から `appState` を読み込む
3. JSON パース
4. バリデーション
   - `users` が配列か
   - 各 `UserProfile` の `id` / `birthDate` が妥当か
   - `achievements` が `Record<userId, Achievement[]>` か
5. `activeUserId` の決定
   - `activeUserId` が null または存在しない ID の場合
     - `users[0]?.id` を activeUserId に設定
     - `users` が空なら「初回セットアップ扱い」とする（後述）
6. メモリ上の AppState として保持
7. 画面遷移
   - `users.length > 0` → S-02 Today 画面へ
   - `users.length === 0` → S-01 初回セットアップへ

### 2.2 新構造が存在せず、旧構造のみ存在する場合

1. `appState` キーを読み込む → **存在しない**
2. 旧キーの有無をチェック
   - `userSettings` / `achievementStore` があるか
3. 旧データ → 新構造へのマイグレート（おおまかな方針）
   - `userSettings` から `UserProfile` を1件生成
     - `id`: 新規 UUID
     - `name`: 空文字 or デフォルト（「ベビー」など）  
       （※実際は初回起動時に名前入力を促してもよい）
     - `birthDate`, `dueDate`, `settings` をコピー
   - `achievementStore.achievements` を `achievements[userId]` へコピー
   - `activeUserId = user.id`
4. 新しい AppState を `appState` キーに保存
5. 旧キーは削除（1度だけ行う）
6. 以降は「2.1 通常フロー」と同じ扱い

### 2.3 旧・新ともに存在しない場合（完全初回）

1. `appState` キーなし
2. 旧キーもなし
3. メモリ上の AppState を以下で初期化：
   ```ts
   appState = {
     users: [],
     activeUserId: null,
     achievements: {}
   }
   ```
4. 画面を S-01 初回セットアップに遷移

---

## 3. AppState 更新ルール

### 3.1 共通原則

- **AppState の変更はすべて単一の更新関数を経由する**
  - 例：`updateAppState((draft) => { ... })`
- 更新後は必ず AsyncStorage の `appState` に保存する
- UI は AppState を subscribe する（Context 経由）

### 3.2 ユーザー追加（S-01 / S-01B）

1. 新規 `UserProfile` を生成
2. `users.push(newUser)`
3. `achievements[newUser.id] = []` を生成
4. `activeUserId` が null の場合は `newUser.id` をセット
5. AppState を保存

### 3.3 ユーザー編集

- `users` 内の該当 `UserProfile` を検索し、必要な項目を更新
- `id` は変更不可（安易に変えると achievements と不整合になるため）
- 更新後 AppState を保存

### 3.4 ユーザー削除

1. 対象 `UserProfile` を `users` から削除
2. `achievements[userId]` を削除
3. activeUserId の更新
   - 削除した ID が `activeUserId` と一致する場合：
     - `users[0]?.id` を新しい `activeUserId` とする
     - `users` が空になった場合：
       - `activeUserId = null`
4. AppState を保存
5. 画面遷移ルール
   - `users` がまだ1件以上 → S-02 Today 画面で新しい activeUser を表示
   - `users` が 0 件 → S-01 初回セットアップへ強制遷移

---

## 4. activeUser 切り替えルール

### 4.1 切り替えトリガ

- S-02 Today 画面のプロフィール切替ボタン
- S-01B プロフィール管理画面での選択

### 4.2 切り替え手順

1. 引数として受け取った `userId` が `users` に存在するか確認
2. 存在しなければ無視（no-op）
3. `activeUserId = userId` に更新
4. AppState を保存
5. `achievements[userId]` が存在しない場合は `[]` をセット
6. 表示中の画面に応じて UI を再描画

### 4.3 プロフィール切替時の画面挙動

- **S-02 Today にいる場合**
  - 同じ画面に留まり、表示内容のみ差し替え（再計算）
- **S-03 カレンダーにいる場合**
  - 同じ月を維持したまま、activeUser に応じて再描画
- **S-04 日付詳細シートが開いている場合**
  - 安全性の観点から：
    - モーダルを一旦閉じて S-03 に戻す  
      （別ユーザーの記録を誤って編集するリスクを防ぐ）
- **S-05 記録一覧にいる場合**
  - 現在のフィルタ状態は維持しつつ、activeUser の記録のみ再取得

---

## 5. 画面と状態の同期ルール

### 5.1 Today 画面（S-02）

- データソース：
  - `activeUser`（UserProfile）
  - 今日の日付
  - `achievements[activeUserId]`
- 再描画タイミング：
  - activeUserId 変更時
  - achievements[activeUserId] 更新時
  - 設定値（ageFormat, showCorrectedUntilMonths, showDaysSinceBirth）変更時

### 5.2 カレンダー（S-03）

- データソース：
  - `activeUser`
  - 対象月
  - `achievements[activeUserId]`
- `lastViewedMonth` の更新：
  - 月が変更されるたびに `activeUser.settings.lastViewedMonth` に保存してよい

### 5.3 記録一覧（S-05）

- データソース：
  - `achievements[activeUserId]` のみ
- 他ユーザーの記録は一切見えない

---

## 6. 非同期ロードとエラー時挙動

### 6.1 ロード中

- App 起動直後、`appState` ロード完了までは「スプラッシュ／ローディング画面」を表示してもよい
- ロード完了後に初めて画面を出す（Today or Setup）

### 6.2 ロード失敗時

- JSON パースエラーなどで復元不能な場合：
  - **安全側に倒す**（全削除 → 初回セットアップ）
  - 具体的には：
    - `appState` を削除
    - メモリ上で空の AppState を作成（users = []）
    - S-01 初回セットアップへ遷移

---

## 7. 旧データから新 AppState へのマイグレーション（骨格）

※詳細実装は別途だが、方針はここで固定する。

### 7.1 実施タイミング

- 起動直後 `appState` が存在しない場合に一度だけチェック
- マイグレーション成功後、旧キーは削除

### 7.2 変換方針

- 旧 `userSettings` → 新 `UserProfile` 1件にマッピング
- 旧 `achievementStore.achievements` → `achievements[userId]` に丸ごとコピー
- 名前が存在しないため、当面の暫定値として空文字 or プレースホルダを設定
  - 初回 Today 画面 or 設定画面で名前入力を促す設計も検討可

---

## 8. Context / Provider 設計との関係（概要）

状態管理仕様と実装の橋渡しとして、以下のような Context 構成を前提とする。

```ts
// 例示

<AppStateProvider>
  <UserProvider>          // activeUser を derive
    <AchievementsProvider>// activeUserId に依存
      <NavigationRoot />
    </AchievementsProvider>
  </UserProvider>
</AppStateProvider>
```

- `AppStateProvider`
  - AsyncStorage との読み書き担当
  - users / achievements / activeUserId の更新関数を提供
- `UserProvider`
  - `activeUser` を計算して各画面に提供
- `AchievementsProvider`
  - `achievements[activeUserId]` とその操作をラップ
- Today / Calendar / 設定などの各画面は、これら Provider に依存するだけに留める

---

## 9. この仕様で守るべきこと（要約）

- AppState は **常に一貫性のある形** で保持・保存すること
- 複数プロフィール間でデータが混ざらないこと
- activeUser が常に有効なユーザーを指していること
- プロフィール切替時は画面挙動を統一し、想定外の UI 状態を避けること

