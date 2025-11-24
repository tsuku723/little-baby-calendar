# リトルベビーカレンダー プロトタイプ設計

## 画面遷移図とフロー

```
[初回セットアップ SetupScreen]
    │ 保存 (出生・予定日・上限・表記形式)
    ▼
[月カレンダー CalendarScreen]
    │  ├─ ヘッダー: 「＜」「YYYY/MM」「＞」「今日へ」「設定」
    │  ├─ 月グリッド: 7列×5-6行（セル右上に💮×N バッジ）
    │  └─ フッター注記・端末内保存メッセージ
    │
    └─ 日セルタップ
            ▼
       [日別シート AchievementSheet]
            ・対象日 (YYYY-MM-DD)
            ・実: / 修: 表示（同値/上限超は非表示）
            ・達成リスト（AchievementItem）
            ・AchievementForm（タイプ／コメント／写真／残字）
```

## 主要UIコンポーネント

| コンポーネント | 役割 | メモ |
| --- | --- | --- |
| `<App>` | Settings/Achievements Provider をラップし Stack ナビゲーションを描画 | 完全ローカルで状態を共有 |
| `<Navigator>` | `@react-navigation/native-stack` で Setup ↔ Calendar を制御 | 初回起動時は Setup から開始 |
| `<SetupScreen>` | 出生日・予定日・上限・表記形式の入力フォーム | 「見守り」トーンのガイド文、保存後にカレンダーへ遷移 |
| `<CalendarScreen>` | 月移動／今日に戻る／設定へ戻る | カレンダーセルでは💮バッジのみ表示 |
| `<CalendarGrid>` | 月カレンダーのレイアウト生成 | DayCell を 7x5~6 行で描画 |
| `<DayCell>` | 各日の表示とタップ処理 | 💮×N を右上にバッジ表示 |
| `<AchievementSheet>` | 選択日の記録とフォームをまとめたモーダル | 実／修ラベルと注記を表示 |
| `<AchievementForm>` | 「できた／がんばった」入力、コメント、写真、残字カウンタ | 2 秒デバウンスでオートセーブ |
| `<AchievementItem>` | 1 件の記録表示 | コメント抜粋と写真プレビュー |
| `SettingsContext` | AsyncStorage の設定データを管理 | `updateSettings()` で即時保存 |
| `AchievementsContext` | 記録の取得／月別集計をキャッシュ | `queryMonthCounts()` を活用 |
| `AgeService` | 実月齢・修正月齢計算、フォーマット | UTC 基準での日付計算、上限ロジック |

## トーンとスタイル指針

- 背景: #FFFDF9、文字: #2E2A27、アクセント: #3A86FF
- ベースフォント 16pt、セル内ラベル 13pt 以上
- 文言例: 「あせらず、ゆっくり」「主治医といっしょに確認しましょう」
- アクセントカラーはヘッダーアイコン・今日ボタン・選択セルに使用

## 拡張余地

- `AgeDetail` モデルに週齢 (w/d)、メモ、バッジ種別を追加できるよう余白を確保
- Zustand ストアのスライスを分割し、将来の計測データや通知設定を追加可能
- カレンダーセルにメモバッジや写真サムネイルを重ねる余地を残した設計
- ExportService を追加し settings/achievements JSON を ZIP にまとめる余地
