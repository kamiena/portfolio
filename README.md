# KamiEna Portfolio

インディーゲームクリエイター **カミエナ（KamiEna）** のポートフォリオサイトです。
フレームワークなしの静的サイト（HTML / CSS / JavaScript）なので、そのまま GitHub Pages などで公開できます。

## ファイル構成

```
index.html              … ページ本体（作品カード・作品詳細モーダルもすべてここ）
assets/css/style.css    … デザイン（色は :root の変数で一括管理）
assets/js/main.js       … メニュー開閉・スクロール演出・作品フィルター・詳細モーダル・YouTube 読み込み
assets/img/             … 画像（WebP に最適化済み）
  icon.webp             … アイコン
  ogp.jpg               … SNS シェア用画像（1200×630）
  works/<作品>/00.webp  … 各作品の画像（00 がメイン画像）
```

## ローカルで確認する

```sh
python3 -m http.server 8000
# → http://localhost:8000 を開く
```

## GitHub Pages で公開する

1. GitHub のリポジトリ → **Settings → Pages**
2. Source を **Deploy from a branch**、Branch を `main` / `/ (root)` にして保存
3. 数分後に `https://kamiena.github.io/portfolio/` で公開されます

独自ドメインなど別の URL で公開する場合は、`index.html` の `og:url` / `og:image` / JSON-LD 内の URL を書き換えてください。

## よくある編集

- **色を変える**：`assets/css/style.css` 冒頭の `--sky` `--pink` `--yellow` `--orange` `--lime` などを変更
- **作品を追加する**：`index.html` の `<!-- ガーデンハント -->` のような `<article class="work-card">` と、下のほうの同名 `<dialog class="work-modal">` をコピーして中身を差し替え。
  カードの `data-open-work="xxx"` とモーダルの `id="work-xxx"` を同じ名前にするとつながります。
  作品カードの色は `t-lime` / `t-purple` / `t-orange` / `t-pink` / `t-sky` から選べます。
- **画像を差し替える**：`assets/img/works/<作品>/` に同じファイル名で上書き（横長 16:9、幅 1280px 程度がおすすめ）
- **作品詳細への直リンク**：`https://…/#work-garden-hunt` のように URL 末尾に `#work-作品名` を付けると、その作品の詳細が開いた状態で表示されます

## 追加でほしい素材（あるとさらに良くなるもの）

- [ ] アイコンキャラの **全身・立ち絵イラスト（透過 PNG）** … ABOUT やヒーローで大きく使いたい
- [ ] アイコンの **高解像度・透過版**（今は Web 上の画像から切り出し）
- [ ] 各作品キャラの **透過立ち絵**（メイナ、クレアちゃん、フォルテなど）
- [ ] **CÔGEIMU** の展示写真（高解像度、会場の雰囲気がわかるもの）
- [ ] **Immersive Novel** を実際に渋谷で体験している様子の写真
- [ ] **イベント出展の写真**（コミケ、東京ゲームダンジョン、SHIBUYA GAMES WEEK、TGS / BitSummit など）
- [ ] X のヘッダー画像など、サイト全体のキービジュアルに使える横長イラスト

## 情報の出典

- クレアクラン公式HP（カミエナのページ）: https://sites.google.com/view/creaclan/creator/kamiena
- 各作品の Steam ストアページ、掲載記事（サイト内の「掲載メディア」を参照）
