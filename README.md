# Toho-Project-Second-games_@Picture-RPG_Powerd-by-zuyasi
東方Projectの二次創作ゲーム｜Picture-RPG（仮）@zuyasi

## プログラム

`プログラム/` に、GitHub Pages 前提で動作するデモ実装を追加しています。

- `プログラム/index.html`: 画像情報表示 + バックグラウンド画像認識 + カーソル操作反映 UI
- `プログラム/build-picture-manifest.mjs`: `写真` フォルダ（`背景`・`キャラクター`などのサブフォルダを含む）を再帰的に読み取り、`プログラム/picture-manifest.json` を更新

画像を増やした場合は以下を実行してマニフェストを更新してください。

```bash
node プログラム/build-picture-manifest.mjs
```

`picture-manifest.json` には画像ごとのクリック動作を定義できます。

- `onClick`: 画像全体クリック時の動作
- `hotspots`: クリック領域ごとの動作（`unit: "ratio"` で相対座標）

`build-picture-manifest.mjs` は既存の `onClick` / `hotspots` を保持したまま、画像一覧を更新します。
