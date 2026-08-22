# -*- coding: utf-8 -*-
"""Small HTML helpers shared by tools/build-langs.py and tools/verify.py.

The site has no DOM available to these scripts, and the one thing they both
need is to find the real innerHTML of a [data-i18n] element. The obvious regex,
`data-i18n="k">(.*?)<`, stops at the first inner tag — so any value containing
<em> or <br /> gets half-read and, in a generator, half-written. This walks
tags and matches the closing one properly instead.
"""
import html as htmlmod
import re

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
        'meta', 'param', 'source', 'track', 'wbr'}
TAG = re.compile(r'<(/?)([a-zA-Z][\w-]*)([^>]*?)(/?)>')
SCRIPT = re.compile(r'<script.*?</script>', re.S)


def spans(src, attr='data-i18n'):
    """[(key, inner_start, inner_end)] for every element carrying `attr`.

    @param src  Full HTML source.
    @param attr Attribute holding the dictionary key.
    @returns List of (key, start, end) offsets in document order.
    """
    out = []
    pattern = r'<([a-zA-Z][\w-]*)([^>]*\s' + attr + r'="([\w.]+)"[^>]*)>'
    for m in re.finditer(pattern, src):
        tag, attrs, key = m.group(1), m.group(2), m.group(3)
        if tag in VOID or attrs.rstrip().endswith('/'):
            continue                      # self-closing: no inner content
        depth, pos = 1, m.end()
        while depth:
            t = TAG.search(src, pos)
            if not t:
                break
            name, closing, selfclose = t.group(2), t.group(1) == '/', t.group(4) == '/'
            pos = t.end()
            if name in VOID or selfclose or name != tag:
                continue
            depth += -1 if closing else 1
            if depth == 0:
                out.append((key, m.end(), t.start()))
    return out


def inner(src, attr='data-i18n'):
    """[(key, innerHTML)] for every element carrying `attr`."""
    return [(k, src[a:b]) for k, a, b in spans(src, attr)]


def script_ranges(src):
    """[(start, end)] of every <script> block — never a translation target."""
    return [(m.start(), m.end()) for m in SCRIPT.finditer(src)]


def strip_scripts(src):
    """The document with every <script> block removed."""
    return SCRIPT.sub('', src)


def text(fragment):
    """Visible innerHTML -> the plain string a search engine reads."""
    return htmlmod.unescape(re.sub(r'<[^>]+>', '', fragment)).strip()


def esc_attr(v):
    """Plain dictionary text -> safe for an HTML attribute or <title>."""
    return v.replace('&', '&amp;').replace('"', '&quot;').replace('<', '&lt;')
