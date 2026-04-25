# リトルベビーログ

早産・NICU経験のある赤ちゃんを含む多子対応の育児記録アプリ。修正月齢・在胎週数の計算機能あり。

## リポジトリ
- GitHub: https://github.com/tsuku723/little-baby-log

## 技術スタック
- React Native / Expo 54 / TypeScript
- React Navigation（スタック + ボトムタブ）
- AsyncStorage（ローカル永続化）

## ディレクトリ構成
```
src/
  components/   # 共通UIコンポーネント
  screens/      # 画面コンポーネント
  navigation/   # ナビゲーション設定
  models/       # データモデル・型定義
  services/     # ビジネスロジック
  state/        # 状態管理
  storage/      # AsyncStorageラッパー
  utils/        # ユーティリティ関数
  types/        # 共通型定義
  constants/    # 定数
  content/      # 静的コンテンツ
```

## コマンド
```bash
npm start           # Expo開発サーバー起動
npm test            # 全テスト実行（run-age-tests.mjs経由）
npm run test:unit   # Jestユニットテストのみ
npm run typecheck   # TypeScript型チェック
```

## テスト方針
- Jestによる自動テスト（21ファイル）は完了済み
- カバレッジ目標: ステートメント80%・ブランチ77%・関数70%（達成済み）
- CI/CD: GitHub Actions（typecheck + jest）で自動実行
- E2Eは手動テスト仕様書（`docs/testing/e2e-manual-test-spec.md`）に基づき手動実施

## ブランチ戦略
- `main`: リリースブランチ
- 作業ブランチ: `main` から派生し、完了後は `main` にマージ

## Issue対応フロー
Issue対応時は必ず以下の手順で進めること。

1. 対象Issueに `status: in-progress` ラベルを付与
2. `main` ブランチから作業ブランチを作成（fix/issue-XX-<内容> など）
3. バグ修正・実装
4. コミット＆プッシュ
5. `main` への プルリクエスト作成
   - descriptionに修正内容・確認手順を記載
   - `Closes #XX` を記載（マージ時にIssueが自動クローズされる）
6. 対象Issueの `status: in-progress` を `status: needs-review` に変更

## 注意事項
- 修正月齢計算ロジックは複雑なため、変更前に必ず既存テストを確認する
- 多子対応（複数の子ども）を前提とした設計になっている
