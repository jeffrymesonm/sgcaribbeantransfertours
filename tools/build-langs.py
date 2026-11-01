# -*- coding: utf-8 -*-
"""Render the Spanish and French versions of the site, and the hreflang cluster.

The site used to be multilingual only in the browser: one set of English pages
whose text was swapped by js/i18n.js after load. Visitors got all three
languages, search engines got one, because there was a single URL per page and
its served HTML was always English.

This renders /es/ and /fr/ as real pages at real URLs, from the same dictionary
the runtime uses, so nothing has to be translated twice.

    python tools/build-langs.py          (from the repository root)

WHAT IT TOUCHES
  es/*.html, fr/*.html   generated in full — never hand-edit these
  *.html                 English originals: only the hreflang block, the
                         language switcher and the [data-i18n] fallbacks
  sitemap.xml            regenerated: every URL, each with its alternates

The English pages stay at the root, unchanged in address, so no existing link
or ranking moves.

Re-run after editing any English page or any dictionary value.
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _html import esc_attr, script_ranges, spans, strip_scripts, text

BASE = 'https://caribbeansgtransferstours.com/'
LANGS = ('en', 'es', 'fr')
OG_LOCALE = {'en': 'en_US', 'es': 'es_DO', 'fr': 'fr_FR'}
LANG_LABEL = {'en': ('EN', 'Switch to English'),
              'es': ('ES', 'Cambiar a español'),
              'fr': ('FR', 'Passer au français')}

# page file -> the data-page key its <body> carries, which is also the
# meta.<key>.title / .description prefix in the dictionary
PAGES = {
    'index.html': 'home',
    'transfers.html': 'transfers',
    'excursions.html': 'excursions',
    'cruises.html': 'cruises',
    'nosotros.html': 'nosotros',
    'sosua.html': 'sosua',
    'cabarete.html': 'cabarete',
    'puerto-plata.html': 'puertoplata',
    'cofresi.html': 'cofresi',
    'rio-san-juan.html': 'riosanjuan',
    'las-terrenas.html': 'lasterrenas',
    'privacy.html': 'privacy',
}

BANNER = """<!--
  GENERATED FILE — do not edit by hand.

  Rendered from the English page of the same name plus the {lang} dictionary in
  js/i18n.js, by tools/build-langs.py. Any edit here is lost on the next run:
  change the English page or the dictionary and re-run the script.
-->
"""

# ---------------------------------------------------------------------------
# Transformations
# ---------------------------------------------------------------------------
def page_url(lang, page):
    """Absolute URL of one page in one language."""
    prefix = '' if lang == 'en' else lang + '/'
    leaf = '' if page == 'index.html' else page
    return BASE + prefix + leaf


def rel_href(from_lang, to_lang, page):
    """Relative href from a page in from_lang to the same page in to_lang."""
    if from_lang == to_lang:
        return page
    if from_lang == 'en':
        return f'{to_lang}/{page}'
    return f'../{page}' if to_lang == 'en' else f'../{to_lang}/{page}'


def translate_text(src, dic):
    """Replace every [data-i18n] element's innerHTML with its dictionary value.

    Values are inserted raw because the runtime assigns them with innerHTML —
    they already carry their own markup and entities. Anything inside <script>
    is skipped: JSON-LD is not a fallback.
    """
    guard = script_ranges(src)
    missing = []
    for key, a, b in reversed(spans(src)):
        if any(lo <= a < hi for lo, hi in guard):
            continue
        if key not in dic:
            missing.append(key)
            continue
        src = src[:a] + dic[key] + src[b:]
    return src, missing


ATTR_TAG = re.compile(r'<[a-zA-Z][\w-]*[^>]*\sdata-i18n-attr="([^"]+)"[^>]*>')


def translate_attrs(src, dic):
    """Apply data-i18n-attr="attr:key|attr2:key2" in the served markup."""
    def fix(m):
        tag = m.group(0)
        for pair in m.group(1).split('|'):
            attr, _, key = pair.partition(':')
            if key not in dic:
                continue
            val = esc_attr(dic[key])
            probe = re.compile(r'(\s%s=")[^"]*(")' % re.escape(attr))
            if probe.search(tag):
                tag = probe.sub(lambda mm: mm.group(1) + val + mm.group(2), tag, count=1)
            else:
                tag = tag[:-1].rstrip() + ' %s="%s">' % (attr, val)
        return tag
    return ATTR_TAG.sub(fix, src)


def set_meta(src, lang, page, dic):
    """Title, description and their Open Graph twins, from the dictionary."""
    key = PAGES[page]
    title, desc = dic[f'meta.{key}.title'], dic[f'meta.{key}.description']
    src = re.sub(r'<title>.*?</title>',
                 lambda m: '<title>%s</title>' % esc_attr(title), src, count=1, flags=re.S)
    for sel, val in ((r'<meta name="description" content="', desc),
                     (r'<meta property="og:title" content="', title),
                     (r'<meta property="og:description" content="', desc)):
        src = re.sub(re.escape(sel) + r'[^"]*"',
                     lambda m, v=val, s=sel: s + esc_attr(v) + '"', src, count=1)
    return src


def set_urls(src, lang, page):
    """Canonical, og:url, og:locale and the hreflang cluster."""
    url = page_url(lang, page)
    src = re.sub(r'(<link rel="canonical" href=")[^"]*(")',
                 lambda m: m.group(1) + url + m.group(2), src, count=1)
    src = re.sub(r'(<meta property="og:url" content=")[^"]*(")',
                 lambda m: m.group(1) + url + m.group(2), src, count=1)

    # rebuild og:locale + alternates from scratch so re-runs stay stable
    src = re.sub(r'\n\s*<meta property="og:locale(?::alternate)?" content="[^"]*" />', '', src)
    locales = '\n  '.join(
        ['<meta property="og:locale" content="%s" />' % OG_LOCALE[lang]]
        + ['<meta property="og:locale:alternate" content="%s" />' % OG_LOCALE[o]
           for o in LANGS if o != lang])
    src = re.sub(r'(<meta property="og:url" content="[^"]*" />)',
                 lambda m: locales + '\n  ' + m.group(1), src, count=1)

    # hreflang: every language points at all three plus x-default (English).
    # Strip the whole previous block first — comment included — or a re-run
    # stacks a second copy of it on top of the first.
    src = re.sub(r'\n+\s*<!-- One page, three addresses\. x-default is English\. -->', '', src)
    src = re.sub(r'\n\s*<link rel="alternate" hreflang="[^"]*" href="[^"]*" />', '', src)
    alts = '\n  '.join(
        ['<link rel="alternate" hreflang="%s" href="%s" />' % (o, page_url(o, page))
         for o in LANGS]
        + ['<link rel="alternate" hreflang="x-default" href="%s" />' % page_url('en', page)])
    src = re.sub(r'(<link rel="canonical" href="[^"]*" />)',
                 lambda m: m.group(1) + '\n\n  <!-- One page, three addresses. x-default is English. -->\n  ' + alts,
                 src, count=1)
    return src


def set_assets(src, lang):
    """/es/ and /fr/ sit one directory deep, so shared assets need ../."""
    if lang == 'en':
        return src
    return re.sub(r'(\s(?:href|src)=")(css/|js/|img/)', r'\1../\2', src)


def set_switcher(src, lang, page):
    """The EN/ES/FR control becomes real links — a crawler can follow it."""
    rows = []
    for other in LANGS:
        label, aria = LANG_LABEL[other]
        active = other == lang
        rows.append(
            '          <a class="lang-btn%s" href="%s" hreflang="%s"%s aria-label="%s">%s</a>'
            % (' is-active' if active else '', rel_href(lang, other, page), other,
               ' aria-current="page"' if active else '', aria, label))
    block = ('<div class="lang-switch" role="group" aria-label="Language / Idioma / Langue">\n'
             + '\n'.join(rows) + '\n        </div>')
    new, n = re.subn(r'<div class="lang-switch".*?</div>', lambda m: block, src, count=1, flags=re.S)
    assert n == 1, 'language switcher not found'
    return new


CRUMB = re.compile(r'<ol class="crumbs-list">(.*?)</ol>', re.S)


def visible_crumbs(src):
    """Labels of the visible breadcrumb trail, in order. Empty if none."""
    m = CRUMB.search(strip_scripts(src))
    if not m:
        return []
    return [text(li) for li in re.findall(r'<li[^>]*>(.*?)</li>', m.group(1), re.S)]

def localize_jsonld(src, lang, page, dic):
    """Localize the page-level nodes only.

    WebPage and BreadcrumbList describe *this URL*, so they follow the
    language. TravelAgency, TouristDestination, Service and the tour lists
    describe real-world things that do not change when the page does; they keep
    one stable @id across all three languages so search engines resolve every
    version to the same entity instead of inventing three.
    """
    key = PAGES[page]
    title, desc = dic[f'meta.{key}.title'], dic[f'meta.{key}.description']
    remap = {page_url('en', p): page_url(lang, p) for p in PAGES}

    def swap(m):
        try:
            node = json.loads(m.group(1))
        except json.JSONDecodeError:
            return m.group(0)
        t = node.get('@type')
        if t == 'WebPage':
            node['@id'] = page_url(lang, page) + '#webpage'
            node['url'] = page_url(lang, page)
            node['inLanguage'] = lang
            node['name'] = title
            node['description'] = desc
        elif t == 'BreadcrumbList':
            # Names come from the visible trail, which is already translated —
            # a Spanish page whose breadcrumb markup says "Inicio" must not
            # hand Google a JSON-LD that says "Home".
            labels = visible_crumbs(src)
            for i, item in enumerate(node.get('itemListElement', [])):
                if isinstance(item.get('item'), str):
                    item['item'] = remap.get(item['item'], item['item'])
                if i < len(labels):
                    item['name'] = labels[i]
        else:
            return m.group(0)
        return ('<script type="application/ld+json">\n  '
                + json.dumps(node, ensure_ascii=False, separators=(',', ':'))
                + '\n  </script>')

    return re.sub(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>',
                  swap, src, flags=re.S)


FAQ_ITEM = re.compile(r'<div class="faq-item">(.*?)</div>\s*</div>\s*</div>', re.S)


def rebuild_faq(src):
    """Regenerate FAQPage JSON-LD from the visible accordion in this language.

    Invariant #2 applies per language: if the two disagree Google may discard
    the block. The visible markup is always the source of truth.
    """
    body = strip_scripts(src)
    pairs = []
    for item in FAQ_ITEM.findall(body):
        q = re.search(r'data-i18n="[\w.]+">(.*?)</span>', item, re.S)
        a = re.search(r'<p data-i18n="[\w.]+">(.*?)</p>', item, re.S)
        if q and a:
            pairs.append((text(q.group(1)), text(a.group(1))))
    if not pairs:
        return src

    def swap(m):
        if '"FAQPage"' not in m.group(1):
            return m.group(0)
        node = json.loads(m.group(1))
        node['mainEntity'] = [
            {'@type': 'Question', 'name': q,
             'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in pairs]
        return ('<script type="application/ld+json">\n  '
                + json.dumps(node, ensure_ascii=False, separators=(',', ':'))
                + '\n  </script>')

    return re.sub(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>',
                  swap, src, flags=re.S)


def build(src, lang, page, dic):
    src, missing = translate_text(src, dic)
    src = translate_attrs(src, dic)
    src = re.sub(r'<html lang="[^"]*"', '<html lang="%s"' % lang, src, count=1)
    src = set_meta(src, lang, page, dic)
    src = set_urls(src, lang, page)
    src = set_switcher(src, lang, page)
    src = localize_jsonld(src, lang, page, dic)
    src = rebuild_faq(src)
    src = set_assets(src, lang)
    if lang != 'en':
        src = re.sub(r'^(<!doctype html>\n)', lambda m: m.group(1) + BANNER.format(lang=lang),
                     src, count=1, flags=re.I)
        # the English pages carry a note that the structured data is English-only
        src = src.replace('(English-only, matches default page language)',
                          '(matches this page language)')
    return src, missing


# ---------------------------------------------------------------------------
def build_sitemap(existing):
    """Every URL, each declaring all three alternates plus x-default."""
    rows = []
    for page in PAGES:
        lastmod, priority = existing.get(page, ('2026-08-22', '0.8'))
        for lang in LANGS:
            alts = '\n'.join(
                '    <xhtml:link rel="alternate" hreflang="%s" href="%s" />' % (o, page_url(o, page))
                for o in LANGS)
            rows.append(
                '  <url>\n'
                '    <loc>%s</loc>\n%s\n'
                '    <xhtml:link rel="alternate" hreflang="x-default" href="%s" />\n'
                '    <lastmod>%s</lastmod>\n'
                '    <changefreq>monthly</changefreq>\n'
                '    <priority>%s</priority>\n'
                '  </url>'
                % (page_url(lang, page), alts, page_url('en', page),
                   lastmod if lang == 'en' else '2026-08-22',
                   priority if lang == 'en' else
                   '%.1f' % max(0.1, float(priority) - 0.1)))
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<!-- Every page exists in English, Spanish and French. Each entry lists all\n'
            '     three so search engines serve the right one and treat the rest as the\n'
            '     same page, not as duplicates. Generated by tools/build-langs.py. -->\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
            '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + '\n'.join(rows) + '\n</urlset>\n')


def read_sitemap_meta():
    """Keep each English page's existing lastmod and priority."""
    try:
        s = open('sitemap.xml', encoding='utf-8').read()
    except FileNotFoundError:
        return {}
    out = {}
    for m in re.finditer(r'<loc>([^<]+)</loc>.*?<lastmod>([^<]+)</lastmod>'
                         r'.*?<priority>([^<]+)</priority>', s, re.S):
        loc, lastmod, priority = m.groups()
        leaf = loc[len(BASE):]
        page = 'index.html' if leaf in ('', '/') else leaf
        if page in PAGES:
            out[page] = (lastmod, priority)
    return out


def main():
    if not os.path.exists('js/i18n.js'):
        sys.exit('run this from the repository root')
    r = subprocess.run(['node', 'tools/dump-dict.js'],
                       capture_output=True, text=True, encoding='utf-8')
    if r.returncode:
        sys.exit(r.stderr or 'could not read the dictionaries')
    D = json.loads(r.stdout)

    sitemap_meta = read_sitemap_meta()
    problems = []
    for lang in LANGS:
        if lang != 'en':
            os.makedirs(lang, exist_ok=True)
        for page in PAGES:
            src = open(page, encoding='utf-8').read()
            out, missing = build(src, lang, page, D[lang])
            for key in missing:
                problems.append(f'{lang}/{page}: falta la clave {key}')
            dest = page if lang == 'en' else os.path.join(lang, page)
            open(dest, 'w', encoding='utf-8', newline='\n').write(out)
        print(f'{lang}: {len(PAGES)} paginas')

    open('sitemap.xml', 'w', encoding='utf-8', newline='\n').write(build_sitemap(sitemap_meta))
    print(f'sitemap.xml: {len(PAGES) * len(LANGS)} URLs con alternates')

    if problems:
        print('\n'.join(problems))
        sys.exit('faltan claves de diccionario')


if __name__ == '__main__':
    main()
