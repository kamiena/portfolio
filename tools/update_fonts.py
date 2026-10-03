#!/usr/bin/env python3
"""assets/css/fonts.css を作り直す（Google Fonts の読み込み設定）。

使い方（リポジトリのいちばん上のフォルダで）:
    python3 tools/update_fonts.py

なぜ自前で持つのか:
  Google Fonts は、見に来たブラウザが Windows だと「ヒンティング入り」のフォントファイルを返します。
  M PLUS Rounded 1c はヒンティングが強く効くため、Windows の標準的な解像度（拡大率100%）では
  線が画素に合わせて曲げられ、文字がガタガタ・欠けて見えます。
  Mac 向けに返される「ヒンティングなし」のファイルを全員が使うように、Mac として取得した
  読み込み設定（@font-face）をここに保存しています。フォントファイル自体は今までどおり
  Google（fonts.gstatic.com）から読み込みます。
"""
import urllib.request
from pathlib import Path

FAMILIES = 'family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@500;700;800;900&display=swap'
MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
OUT = Path(__file__).resolve().parent.parent / 'assets/css/fonts.css'

req = urllib.request.Request('https://fonts.googleapis.com/css2?' + FAMILIES, headers={'User-Agent': MAC_UA})
with urllib.request.urlopen(req, timeout=60) as r:
    css = r.read().decode('utf-8')
assert '@font-face' in css and 'woff2' in css, 'unexpected response from Google Fonts'
header = ('/* Google Fonts（Dela Gothic One / M PLUS Rounded 1c）の読み込み設定。tools/update_fonts.py で作成。\n'
          '   Windows でも「ヒンティングなし」のフォントを使い、文字がガタガタにならないようにしています。 */\n')
OUT.write_text(header + css, encoding='utf-8')
print(f'wrote {OUT} ({css.count("@font-face")} faces, {len(css) // 1024} KB)')
