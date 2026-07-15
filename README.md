# Toho-Project-Second-games_@Picture-RPG_Powerd-by-zuyasi
東方Projectの二次創作ゲーム｜Picture-RPG（仮）@zuyasi

## プログラム

このリポジトリには、`プログラム/` に**ブラウザで動くデモ**が入っています。  
「画像を選ぶ → 解析する → クリック動作を確認する」流れを試せます。

### 1. 最初に何を使うか（ファイルの役割）

| ファイル | 役割 |
| --- | --- |
| `プログラム/index.html` | デモ画面本体（ブラウザで表示するページ） |
| `プログラム/app.js` | 画面の動き（画像選択、クリック時の挙動、状態表示） |
| `プログラム/image-worker.js` | 画像のバックグラウンド解析 |
| `プログラム/picture-manifest.json` | 画像一覧とクリック動作の設定 |
| `プログラム/build-picture-manifest.mjs` | `写真/` を読み取り、`picture-manifest.json` を更新 |

### 2. デモを動かす（初心者向け）

`index.html` は `fetch()` を使うため、`file://` 直開きでは動かないことがあります。  
次の手順で**ローカルサーバー経由**で開くのが確実です。

```bash
cd プログラム
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いてください。

### 3. 画面の使い方

1. **画像**プルダウンで画像を選ぶ  
2. **バックグラウンド認識を実行**を押す  
3. 画像をクリックして、`picture-manifest.json` に設定した動作（画面遷移・ブロック選択・textbox編集）を確認する  
4. 「状態」パネルで現在の画面名や選択状態を確認する

### 4. 画像を追加したとき

1. `写真/` 配下（例: `写真/背景`、`写真/キャラクター`）に画像を入れる  
2. リポジトリのルートで次を実行する

```bash
node プログラム/build-picture-manifest.mjs
```

これで `プログラム/picture-manifest.json` が更新されます。  
既存画像に設定済みの `onClick` / `hotspots` は保持されます。

### 5. クリック動作の設定（`picture-manifest.json`）

- `onClick`: 画像全体クリック時の動作
- `hotspots`: 部分領域クリック時の動作（`unit: "ratio"` で 0.0〜1.0 の相対座標指定）

代表的な `type`:
- `navigate`（`nextScreen` へ移動）
- `select-block`（`blockId` を選択）
- `focus-textbox`（`textboxId` を編集状態にする）
