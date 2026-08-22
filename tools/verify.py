# -*- coding: utf-8 -*-
"""Static verification of the whole site. No browser, no network.

Checks the DEVELOPER_GUIDE invariants across all three languages, plus the
structural hygiene that is easy to break by hand: JSON-LD that parses and
whose @id references resolve, balanced tags, local paths that exist, images
with intrinsic dimensions, prices that match js/config.js, and an hreflang
cluster where every page agrees with every other.

    python tools/verify.py           (from the repository root)

Exit status is non-zero if anything fails, so it can gate a commit.
"""
import glob
import html as htmlmod
import json
import os
import re
import subprocess
import sys
import unicodedata
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import unquote

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _html import VOID, inner, strip_scripts

BASE = 'https://caribbeansgtransferstours.com/'
LANGS = ('en', 'es', 'fr')

fails = []


def check(cond, msg):
    print(('  OK  ' if cond else '  FAIL') + '  ' + msg)
    if not cond:
        fails.append(msg)


def lang_of(path):
    head = path.replace('\\', '/').split('/')[0]
    return head if head in LANGS else 'en'


def leaf(path):
    return os.path.basename(path.replace('\\', '/'))


pages = sorted(f.replace(os.sep, '/') for f in
               glob.glob('*.html') + glob.glob('es/*.html') + glob.glob('fr/*.html'))
src_of = {f: open(f, encoding='utf-8').read() for f in pages}

# 404.html is served by GitHub Pages for any unmatched path, at the root only.
# It has no canonical, no place in the hreflang cluster and no translations —
# every check below that assumes a page belongs to the cluster skips it.
STANDALONE = {'404.html'}
cluster = [f for f in pages if f not in STANDALONE]

# ---------------------------------------------------------------- JSON-LD ---
print('\n== 1. JSON-LD parsea y los @id resuelven ==')
n_blocks, orphans = 0, []
for f in pages:
    ids, refs = set(), []

    def walk(o):
        if isinstance(o, dict):
            if '@id' in o and '@type' in o:
                ids.add(o['@id'])
            if set(o) == {'@id'}:
                refs.append(o['@id'])
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    for i, b in enumerate(re.findall(
            r'<script type="application/ld\+json">(.*?)</script>', src_of[f], re.S)):
        n_blocks += 1
        try:
            walk(json.loads(b))
        except json.JSONDecodeError as e:
            check(False, f'{f} bloque {i}: {e}')
    orphans += [(f, r) for r in refs if r not in ids]
check(not orphans, f'{len(pages)} paginas, {n_blocks} bloques JSON-LD, todos parsean')
check(not orphans, 'todas las referencias @id resuelven'
      + ('' if not orphans else f' -> {orphans[:4]}'))

# ------------------------------------------------------------- HTML balance --
print('\n== 2. HTML bien formado ==')


class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.err = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.err.append(f'</{tag}> sin apertura')
        elif self.stack[-1] == tag:
            self.stack.pop()
        elif tag in self.stack:
            while self.stack and self.stack[-1] != tag:
                self.err.append(f'<{self.stack.pop()}> sin cerrar')
            self.stack.pop()
        else:
            self.err.append(f'</{tag}> inesperado')


broken = []
for f in pages:
    p = Balance()
    p.feed(src_of[f])
    if p.err or p.stack:
        broken.append((f, p.err[:2], p.stack[:2]))
check(not broken, f'{len(pages)} paginas con etiquetas balanceadas'
      + ('' if not broken else f' -> {broken[:3]}'))

# -------------------------------------------------------------- dictionary ---
print('\n== 3. Diccionario i18n ==')
r = subprocess.run(['node', 'tools/dump-dict.js'], capture_output=True, text=True,
                   encoding='utf-8')
if r.returncode:
    sys.exit(r.stderr)
D = json.loads(r.stdout)
check(set(D) == set(LANGS),
      'diccionarios: ' + ' '.join(f'{k}={len(v)}' for k, v in D.items()))

used = set()
for f in pages:
    used |= set(re.findall(r'data-i18n="([\w.]+)"', src_of[f]))
    used |= set(re.findall(r'data-i18n-attr="[\w-]+:([\w.]+)"', src_of[f]))
    used |= set(re.findall(r'data-(?:title|service)-key="([\w.]+)"', src_of[f]))
for lang in LANGS:
    miss = sorted(used - set(D[lang]))
    check(not miss, f'{lang}: {len(used)} claves usadas, faltan {len(miss)}'
          + (f' -> {miss[:6]}' if miss else ''))


def norm(t):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', htmlmod.unescape(t))).strip()


# ----------------------- invariante #1: el HTML servido == su diccionario ----
print('\n== 4. Invariante #1: cada pagina coincide con el diccionario de SU idioma ==')
drift = []
for f in pages:
    dic = D[lang_of(f)]
    for key, frag in inner(strip_scripts(src_of[f])):
        if key in dic and norm(frag) != norm(dic[key]):
            drift.append((f, key, norm(frag)[:60], norm(dic[key])[:60]))
check(not drift, f'{len(pages)} paginas comparadas, {len(drift)} divergencias de texto')
for f, k, a, b in drift[:10]:
    print(f'        {f} {k}\n          html: {a}\n          dict: {b}')

# The same invariant for attributes: aria-labels, placeholders and image alt.
ATTR_TAG = re.compile(r'<[a-zA-Z][\w-]*[^>]*\sdata-i18n-attr="([^"]+)"[^>]*>')
attr_drift, n_attr = [], 0
for f in pages:
    dic = D[lang_of(f)]
    for m in ATTR_TAG.finditer(src_of[f]):
        for pair in m.group(1).split('|'):
            attr, _, key = pair.partition(':')
            if key not in dic:
                attr_drift.append((f, key, '(clave inexistente)', ''))
                continue
            have = re.search(r'\s%s="([^"]*)"' % re.escape(attr), m.group(0))
            n_attr += 1
            if not have:
                attr_drift.append((f, key, f'(sin atributo {attr})', dic[key][:50]))
            elif norm(have.group(1)) != norm(dic[key]):
                attr_drift.append((f, key, norm(have.group(1))[:50], norm(dic[key])[:50]))
check(not attr_drift, f'{n_attr} atributos comparados, {len(attr_drift)} divergencias')
for f, k, a, b in attr_drift[:10]:
    print(f'        {f} {k}\n          html: {a}\n          dict: {b}')

# An image that says something must say it from the dictionary; a decorative
# one must stay silent rather than be handed invented text.
loose = []
for f in pages:
    for tag in re.findall(r'<img\b[^>]*>', src_of[f]):
        alt = re.search(r'alt="([^"]*)"', tag)
        if alt and alt.group(1) and 'data-i18n-attr=' not in tag:
            loose.append(f'{f}: {alt.group(1)[:40]}')
check(not loose, 'ningun alt de imagen se queda fuera del diccionario'
      + ('' if not loose else f' -> {loose[:4]}'))

# ------------------------------------- invariante #2: FAQ visible == JSON-LD --
print('\n== 5. Invariante #2: FAQ visible == FAQPage JSON-LD ==')


def nf(t):
    t = htmlmod.unescape(re.sub(r'<[^>]+>', '', t))
    t = unicodedata.normalize('NFKC', t)
    t = t.replace('—', '-').replace('–', '-').replace('’', "'")
    return re.sub(r'[\s.·,;:!?"\'-]+', ' ', t).strip().lower()


n_faq, bad_faq = 0, []
for f in pages:
    blocks = [b for b in re.findall(
        r'<script type="application/ld\+json">(.*?)</script>', src_of[f], re.S)
        if '"FAQPage"' in b]
    if not blocks:
        continue
    ld = json.loads(blocks[0])['mainEntity']
    vis = []
    for it in re.findall(r'<div class="faq-item">(.*?)</div>\s*</div>\s*</div>',
                         strip_scripts(src_of[f]), re.S):
        q = re.search(r'<span data-i18n="[\w.]+">(.*?)</span>', it, re.S)
        a = re.search(r'<p data-i18n="[\w.]+">(.*?)</p>', it, re.S)
        if q and a:
            vis.append((q.group(1), a.group(1)))
    ok = len(vis) == len(ld) and all(
        nf(vq) == nf(l['name']) and nf(va) == nf(l['acceptedAnswer']['text'])
        for (vq, va), l in zip(vis, ld))
    n_faq += 1
    if not ok:
        bad_faq.append(f'{f} ({len(vis)} visibles vs {len(ld)} JSON-LD)')
check(not bad_faq, f'{n_faq} paginas con FAQ, todas coinciden'
      + ('' if not bad_faq else f' -> {bad_faq[:4]}'))

# ---------------------------------------------------------------- assets -----
print('\n== 6. Rutas locales e imagenes ==')
missing_path, bad_img = [], []
for f in pages:
    here = os.path.dirname(f)
    for a in re.findall(r'(?:href|src)="((?!https?:|mailto:|tel:|#|data:)[^"]+)"', src_of[f]):
        target = unquote(a.split('#')[0].split('?')[0])
        if not target:
            continue
        # a leading / is relative to the site root, which is the repo root
        resolved = target.lstrip('/') if target.startswith('/')             else os.path.join(here, target)
        if not os.path.exists(os.path.normpath(resolved)):
            missing_path.append(f'{f} -> {a}')
    for tag in re.findall(r'<img\b[^>]*>', src_of[f]):
        if 'width=' not in tag or 'height=' not in tag or 'alt=' not in tag:
            bad_img.append(f'{f}: {tag[:60]}')
check(not missing_path, 'todas las rutas locales existen'
      + ('' if not missing_path else f' -> {missing_path[:5]}'))
check(not bad_img, 'todos los <img> llevan width/height/alt'
      + ('' if not bad_img else f' -> {bad_img[:3]}'))

# ------------------------------------------------- idioma servido y hreflang --
print('\n== 7. Idioma servido, canonical y hreflang ==')


def page_url(lang, name):
    return BASE + ('' if lang == 'en' else lang + '/') + ('' if name == 'index.html' else name)


bad_lang, bad_canon, bad_alt = [], [], []
for f in cluster:
    lang, name = lang_of(f), leaf(f)
    m = re.search(r'<html lang="([^"]+)"', src_of[f])
    if not m or m.group(1) != lang:
        bad_lang.append(f)
    m = re.search(r'<link rel="canonical" href="([^"]+)"', src_of[f])
    if not m or m.group(1) != page_url(lang, name):
        bad_canon.append(f'{f} -> {m.group(1) if m else "sin canonical"}')
    alts = dict(re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)" />',
                           src_of[f]))
    want = {o: page_url(o, name) for o in LANGS}
    want['x-default'] = page_url('en', name)
    if alts != want:
        bad_alt.append(f)
check(not bad_lang, f'{len(cluster)} paginas declaran el <html lang> de su carpeta'
      + ('' if not bad_lang else f' -> {bad_lang[:4]}'))
check(not bad_canon, 'cada canonical apunta a su propia URL'
      + ('' if not bad_canon else f' -> {bad_canon[:3]}'))
check(not bad_alt, 'las 3 alternates + x-default son reciprocas en todas'
      + ('' if not bad_alt else f' -> {bad_alt[:4]}'))

no_switch = [f for f in cluster if src_of[f].count('class="lang-btn') != 3]
check(not no_switch, 'el selector de idioma enlaza a los 3 idiomas'
      + ('' if not no_switch else f' -> {no_switch[:4]}'))

# --------------------------------------------------- invariante #4: precios ---
print('\n== 8. Invariante #4: precios sincronizados ==')
cfg = open('js/config.js', encoding='utf-8').read()
pop_dest = {k: float(v) for k, v in re.findall(r"'([a-z-]+)':\s*\{[^}]*price:\s*([\d.]+)", cfg)}
prov = re.search(r'POP_PROVINCE_FIXED_FARES\s*=\s*\{(.*?)\n\};', cfg, re.S).group(1)
pop_prov = {k: float(v) for k, v in re.findall(r"'([a-z-]+)':\s*([\d.]+)", prov)}
# OTHER_AIRPORT_FIXED_FARES mixes 'fixed:<slug>' destination keys with bare
# province slugs, so take every value in the block rather than one key shape.
other_block = re.search(r'OTHER_AIRPORT_FIXED_FARES\s*=\s*\{(.*?)\n\};', cfg, re.S).group(1)
other = [float(v) for v in re.findall(r"':\s*([\d.]+)", other_block)]
cfg_prices = sorted(set(pop_dest.values()) | set(pop_prov.values()) | set(other))
# One table row per confirmed fare: the POP destinations, the POP provinces and
# every non-POP fare. Derived, so adding a fare cannot silently skip the table.
want_rows = len(pop_dest) + len(pop_prov) + len(other)

for lang in LANGS:
    f = 'transfers.html' if lang == 'en' else f'{lang}/transfers.html'
    sec = re.search(r'<section class="section fares" id="fares">(.*?)\n  </section>',
                    src_of[f], re.S).group(1)
    rows = len(re.findall(r'<th scope="row">', sec))
    tbl = sorted({float(p) for p in re.findall(r'US\$([\d.]+)</td>', sec)})
    check(rows == want_rows and tbl == cfg_prices,
          f'{f}: {rows}/{want_rows} filas, {len(tbl)} precios == config.js')

llms = open('llms.txt', encoding='utf-8').read()
lp = {float(p) for p in re.findall(r'\|\s*([\d]+\.?\d*)\s*\|', llms)}
check(not [p for p in cfg_prices if p not in lp], 'llms.txt cubre todas las tarifas de config.js')

tours = {}
for f in ['excursions.html', 'cruises.html']:
    for i, pr in re.findall(r"id=\"(exc\d|cruise\d)\"[^>]*data-prices='([^']+)'", src_of[f]):
        tours[f + '#' + i] = json.loads(pr)
mismatch = [k for k, v in tours.items()
            if not all(str(int(x) if x == int(x) else x) in llms for x in v.values())]
check(not mismatch, f'{len(tours)} tarjetas de tour, precios presentes en llms.txt'
      + ('' if not mismatch else f' -> {mismatch}'))

# ------------------------------------------- invariante #3: una sola entidad --
print('\n== 9. Invariante #3: una sola entidad de negocio ==')
orgs, carriers = set(), 0
for f in pages:
    for line in src_of[f].split('\n'):
        line = line.strip()
        if line.startswith('{"@context":"https://schema.org","@type":"TravelAgency"') \
                and '"employee"' not in line:
            orgs.add(line)
            carriers += 1
check(len(orgs) == 1,
      f'el nodo TravelAgency es identico en las {carriers} paginas que lo llevan'
      + ('' if len(orgs) == 1 else f' -> {len(orgs)} variantes'))

# ------------------------------------------------------------------ sitemap --
print('\n== 10. Sitemap ==')
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
root = ET.parse('sitemap.xml').getroot()
locs = [u.find('s:loc', ns).text for u in root.findall('s:url', ns)]
listed = set(locs)
indexable = {page_url(lang_of(f), leaf(f)) for f in cluster
               if 'noindex' not in src_of[f]}
check(listed == indexable, f'{len(locs)} URLs; sitemap == paginas indexables'
      + ('' if listed == indexable
         else f' -> solo sitemap {sorted(listed - indexable)[:3]}, '
              f'solo disco {sorted(indexable - listed)[:3]}'))
check(len(locs) == len(set(locs)), 'sin URLs duplicadas en el sitemap')

# ------------------------------------------------------------ JS syntax ------
print('\n== 11. Sintaxis JS ==')
bad_js = [f for f in sorted(glob.glob('js/*.js'))
          if subprocess.run(['node', '--check', f], capture_output=True).returncode]
check(not bad_js, f'{len(glob.glob("js/*.js"))} archivos js/ parsean'
      + ('' if not bad_js else f' -> {bad_js}'))

print('\n' + ('TODO OK' if not fails else f'{len(fails)} FALLOS:\n - ' + '\n - '.join(fails)))
sys.exit(1 if fails else 0)
