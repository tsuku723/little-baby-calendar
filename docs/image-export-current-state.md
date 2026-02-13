# 画像出力（保存）機能の現状メモ

- 実装本体は `src/screens/TodayScreen.tsx` にあり、`react-native-view-shot` で非表示領域をキャプチャし、`expo-media-library` で写真ライブラリへ保存している。
- UIの導線は `CalendarScreen` で日付セルをタップして `Today` 画面へ遷移し、`Today` 画面内の「画像として保存」ボタンで実行される。
- 保存対象は画面表示用UIではなく、`hiddenRenderer` 内の `ViewShot` コンテナ。
- 現在の出力サイズは `exportContainer.width = 720`（固定幅）で、フォーマットは JPEG。
