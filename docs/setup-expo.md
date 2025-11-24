# Expo (Windows + iPhone) 実行手順

このリポジトリには React Native の JS/TS ソースのみが含まれており、`android/` や `ios/` ディレクトリは同梱されていません。Windows PC と iPhone の Expo Go で動かすには、以下の手順で新規 Expo プロジェクトにソースを組み込みます。

## 0. 事前準備

1. **Windows 側のインストール**
   - [Node.js 18 LTS](https://nodejs.org/)（インストーラに含まれる npm も利用します）
   - [Git for Windows](https://git-scm.com/download/win)
   - [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)（ネイティブ依存のビルド用。既存の VS/Build Tools があれば流用可能）
2. **モバイル側**
   - iPhone に Expo Go をインストール済みであることを確認
   - 同一ネットワーク（Wi-Fi）に PC と iPhone を接続

> ※ Chocolatey や winget で Node/Git を入れても構いません。PowerShell を管理者モードで開き、以降のコマンドを実行します。

## 1. このリポジトリを取得
```powershell
cd $env:USERPROFILE\source
git clone https://github.com/<your-account>/little-baby-age.git
cd little-baby-age
```

## 2. Expo プロジェクトを新規作成
ソース一式を受け入れる空プロジェクトを別フォルダで用意します。
```powershell
cd ..
npx create-expo-app@latest LittleBabyCalendarExpo --template blank-typescript
cd LittleBabyCalendarExpo
```

## 3. 既存ソースのコピー
1. `LittleBabyCalendarExpo` 直下に `little-baby-age/src` をまるごとコピーします。PowerShell の例:
   ```powershell
   robocopy ..\little-baby-age\src .\src /MIR
   robocopy ..\little-baby-age\__tests__ .\__tests__ /MIR
   robocopy ..\little-baby-age\__mocks__ .\__mocks__ /MIR
   copy ..\little-baby-age\tsconfig.json .\tsconfig.json
   ```
2. `package.json` の `dependencies`/`devDependencies` をこのリポジトリの内容に置き換え、`name` や `version` は任意で構いません。
3. Expo プロジェクト直下の `App.tsx` を次のように差し替え、`src/App` をエントリにします。
   ```tsx
   import App from "./src/App";
   export default App;
   ```
4. `src/index.ts` で `AppRegistry.registerComponent("LittleBabyCalendar", () => App);` を呼び出しているため、Expo では追加の設定は不要です（Bare RN の場合は `index.js` でこのファイルを読み込みます）。

## 4. 依存関係のインストール
Expo プロジェクト直下で実行します。
```powershell
npm install
```
`@react-navigation/native-stack` などネイティブ依存があるため、Expo では `expo install react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens` も自動で解決されます。必要に応じて `npx expo install` コマンドで追加モジュールを導入してください。

## 5. Metro/Expo を起動して iPhone で確認
1. プロジェクト直下で Metro を起動
   ```powershell
   # LittleBabyCalendarExpo フォルダであることを確認
   pwd   # => C:\Users\<you>\source\LittleBabyCalendarExpo
   npm install   # 未実行なら依存を入れておく
   npx expo start --tunnel
   ```
   - **`Unable to find expo in this project` と表示される場合**: `pwd`（または PowerShell の `Get-Location`）で **Expo プロジェクト側のフォルダにいるか** を確認し、まだなら `LittleBabyCalendarExpo` ディレクトリへ移動してから `npm install` → `npx expo start --tunnel` を実行してください。
   - `--tunnel` を付けると、PC と iPhone が別ネットワークでも接続しやすくなります。
2. ターミナルに表示される QR コードを iPhone のカメラで読み取るか、Expo Go の「Scan QR Code」で読み取ります。
3. Expo Go 内でアプリがビルドされ、「リトルベビーカレンダー」の UI が表示されます。

## 6. よくあるハマりどころ
- **npm install で `ETARGET`**: 公開されているバージョンへ変更してください（例: `@types/react-native` は 0.73 系が最新）。
- **`Unable to find expo in this project`**: `LittleBabyCalendarExpo` など Expo CLI で作ったフォルダ直下でコマンドを実行しているか、`package.json` に `"expo": "^50.x"` が入っているかを確認します。元の `little-baby-age` リポジトリ直下では `expo` 依存が無いため起動できません。
- **ビルド中に `react-native-reanimated` の Babel プラグイン警告**: `babel.config.js` に `plugins: ["react-native-reanimated/plugin"]` を追加します。Expo テンプレートの既定設定に追記してください。
- **iPhone から接続できない**: PC のファイアウォールを一時的に解除するか、`--tunnel` オプションを付けて起動します。
- **タイムゾーン差でズレる**: ソース内の `src/utils/date.ts` では `toUTCDateOnly` や `diffYMD` で日付を UTC 正規化しているため、改変しないようにしてください。

以上で、Windows + Expo Go でソースを動かす環境を構築できます。
