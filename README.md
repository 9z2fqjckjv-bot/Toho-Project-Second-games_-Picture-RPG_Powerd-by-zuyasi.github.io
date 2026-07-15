# Toho-Project-Second-games_@Picture-RPG_Powerd-by-zuyasi
東方Projectの二次創作ゲーム｜Picture-RPG（仮）@zuyasi

## Programs

`Programs/` に、GitHub Pages 前提で動作するデモ実装を追加しています。

- `Programs/index.html`: 画像情報表示 + バックグラウンド画像認識 + カーソル操作反映 UI
- `Programs/build-picture-manifest.mjs`: `Pictures` または `Picture` フォルダを読み取り、`Programs/picture-manifest.json` を更新

画像を増やした場合は以下を実行してマニフェストを更新してください。

```bash
node Programs/build-picture-manifest.mjs
```
