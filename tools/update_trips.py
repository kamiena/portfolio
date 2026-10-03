#!/usr/bin/env python3
"""旅行記（ACTIVITY の TRIP）を、X の「#ゲームクリエイターの〇〇旅行」のポストから作り直す。

使い方（リポジトリのいちばん上のフォルダで）:
    pip install pillow
    python3 tools/update_trips.py

- ポストの取得には、ログイン不要の非公式 API（FxTwitter）を使います。仕様が変わると動かなくなることがあります。
- 新しい旅行を足すときは、下の TRIPS に1行追加し、assets/i18n/*.js に旅行名のキー（例: "trip.korea"）を足してください。
- ハッシュタグをつける前の旅（ハワイ、イギリス・イタリア）は、期間（since〜until）でポストを集めています。
  旅と関係ないポストが混ざったら、SKIP にポストの ID を足してください（ほかの人へのリプライは自動で外します）。
- index.html の <!-- trip-nav:start --> 〜 <!-- trip-nav:end --> と
  <!-- trip-posts:start --> 〜 <!-- trip-posts:end --> の間だけを書き換えます。
"""
import datetime, html, io, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / 'assets/img/trip'
ACCOUNT = 'KamiEna_Game'
# 新しい旅行ほど上に。tag（ハッシュタグ）か、since/until（期間。until の日は含まない）でポストを集める
TRIPS = [
    dict(key='taiwan', name_key='trip.tw', name='台湾', color='--yellow', tag='ゲームクリエイターの台湾旅行'),
    dict(key='bali', name_key='trip.bali', name='バリ島', color='--lime', tag='ゲームクリエイターのバリ島旅行'),
    dict(key='egypt', name_key='trip.egypt', name='エジプト', color='--orange', tag='ゲームクリエイターのエジプト旅行'),
    dict(key='hawaii', name_key='trip.hawaii', name='ハワイ', color='--sky', since='2023-09-10', until='2023-09-18'),
    dict(key='uk-italy', name_key='trip.ukit', name='イギリス・イタリア', color='--purple', since='2018-08-03', until='2018-08-29'),
]
SKIP = {
    '1955126822632632418',                          # ハッシュタグの紹介だけのリプライ
    '1701171817124430295',                          # ハワイ：エディオン公式への返事
    '1028622395311939586', '1028971876318466050',   # イギリス・イタリアの前：制作合宿
}
JST = datetime.timezone(datetime.timedelta(hours=9))

def get_json(url):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 kamiena-portfolio'})
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.load(r)
        except Exception as e:
            print('  retry', attempt, e); time.sleep(4 * (attempt + 1))
    return None

def search(query):
    found, cursor = {}, None
    for _ in range(10):
        url = 'https://api.fxtwitter.com/2/search?q=' + urllib.parse.quote(query) + ('&cursor=' + urllib.parse.quote(cursor) if cursor else '')
        d = get_json(url)
        if not d: break
        results = d.get('results') or []
        new = [t for t in results if t['id'] not in found]
        for t in new: found[t['id']] = t
        nxt = (d.get('cursor') or {}).get('bottom')
        if not results or not new or not nxt or nxt == cursor: break
        cursor = nxt; time.sleep(1)
    return list(found.values())

def is_reply_to_others(p):
    to = p.get('replying_to')
    to = (to.get('screen_name') if isinstance(to, dict) else to) or ''
    return p['text'].lstrip().startswith('@') or (to and to.lower() != ACCOUNT.lower())

def clean(text):
    text = re.sub(r'#\S+', '', text)            # ハッシュタグは見出しに出すので本文からは外す
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'[ \t　]+\n', '\n', text)
    return re.sub(r'\n{2,}', '\n', text).strip()  # カードでは空行を詰める

def excerpt(text, n=150):
    return text if len(text) <= n else re.sub(r'[\s️‍]+$', '', text[:n]) + '…'

def save_image(media, post_id):
    src = media['url'] if media['type'] == 'photo' else media.get('thumbnail_url')
    if not src: return None
    if media['type'] == 'photo': src = src.split('?')[0] + '?name=small'
    req = urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        im = Image.open(io.BytesIO(r.read())).convert('RGB')
    im.thumbnail((560, 560), Image.LANCZOS)
    im.save(IMG_DIR / f'{post_id}.webp', 'WEBP', quality=78, method=6)
    return im.size

def build():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    nav, sections = [], []
    for trip in TRIPS:
        key, name_key, name, color, tag = trip['key'], trip['name_key'], trip['name'], trip['color'], trip.get('tag')
        query = f'#{tag} from:{ACCOUNT}' if tag else f'from:{ACCOUNT} since:{trip["since"]} until:{trip["until"]}'
        posts = sorted((p for p in search(query) if p['id'] not in SKIP and not is_reply_to_others(p)), key=lambda p: p['created_timestamp'])
        if not posts:
            print('no posts for', key); continue
        days = [datetime.datetime.fromtimestamp(p['created_timestamp'], JST) for p in posts]
        items = []
        for p, day in zip(posts, days):
            media = (p.get('media') or {}).get('all') or []
            photo = ''
            if media:
                size = save_image(media[0], p['id'])
                if size:
                    badge = (f'<span class="trip-count">+{len(media) - 1}</span>' if len(media) > 1 else '') + \
                            ('<span class="trip-play"><svg class="icon" aria-hidden="true"><use href="#i-play"/></svg></span>' if media[0]['type'] == 'video' else '')
                    photo = f'<span class="trip-photo"><img src="assets/img/trip/{p["id"]}.webp" alt="" width="{size[0]}" height="{size[1]}" loading="lazy">{badge}</span>'
            text = html.escape(excerpt(clean(p['text']))).replace('\n', '<br>')
            items.append(f'              <li class="trip-post"><a href="{p["url"]}" target="_blank" rel="noopener">{photo}<span class="trip-text"><time datetime="{day:%Y-%m-%d}">{day:%Y.%m.%d}</time><span lang="ja">{text}</span></span><span class="trip-more"><span data-i18n="trip.viewOnX">X で見る</span><svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></span></a></li>')
        tag_link = f'<a href="https://x.com/hashtag/{urllib.parse.quote(tag)}?f=live" target="_blank" rel="noopener">#{tag}</a>' if tag else ''
        sections.append(f'''        <section class="trip" id="trip-{key}" style="--c:var({color})">
          <h3 class="wm-h"><svg class="bolt" viewBox="0 0 32 32" aria-hidden="true"><use href="#i-bolt"/></svg><span data-i18n="{name_key}">{name}</span></h3>
          <p class="trip-meta"><time>{days[0]:%Y.%m.%d}–{days[-1]:%m.%d}</time><span>{len(posts)} posts</span>{tag_link}</p>
          <ul class="trip-posts">
{chr(10).join(items)}
          </ul>
        </section>''')
        nav.append(f'<button class="chip trip-jump" type="button" data-jump="trip-{key}" style="--c:var({color})"><span data-i18n="{name_key}">{name}</span> {days[0]:%Y}</button>')
        print(f'{key}: {len(posts)} posts')
    return ''.join(nav), '\n\n'.join(sections)

def replace_between(text, name, body):
    pat = re.compile(rf'(<!-- {name}:start -->)(.*?)(<!-- {name}:end -->)', re.S)
    if not pat.search(text): sys.exit(f'marker {name} not found in index.html')
    return pat.sub(lambda m: m.group(1) + body + m.group(3), text, count=1)

if __name__ == '__main__':
    nav, sections = build()
    index = ROOT / 'index.html'
    text = index.read_text(encoding='utf-8')
    text = replace_between(text, 'trip-nav', nav)
    text = replace_between(text, 'trip-posts', '\n' + sections + '\n        ')
    index.write_text(text, encoding='utf-8')
    print('index.html updated')
