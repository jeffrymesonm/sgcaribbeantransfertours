// Dump the three i18n dictionaries as JSON on stdout.
//
// js/i18n.js touches the DOM as soon as it loads, so it cannot simply be
// require()d from Node. This pulls out only the object literal that holds the
// dictionaries and evaluates that, which keeps js/i18n.js the single source of
// truth for every translated string on the site.
//
// Usage: node tools/dump-dict.js   (run from the repository root)
const fs = require('fs');

const src = fs.readFileSync('js/i18n.js', 'utf8');
const m = src.match(/const\s+\w+\s*=\s*\{\s*\n\s*en:\s*\{[\s\S]*?\n\};/);
if (!m) {
  console.error('no dictionary literal found in js/i18n.js');
  process.exit(1);
}
const literal = m[0].replace(/^const\s+\w+\s*=\s*/, '').replace(/;$/, '');
const D = eval('(' + literal + ')');
process.stdout.write(JSON.stringify({ en: D.en, es: D.es, fr: D.fr }));
