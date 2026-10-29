// @font-face-Regeln mit eingebetteten woff2-Dateien (kein CDN, Seiten funktionieren offline und als Einzeldatei)
const fs = require('fs');
const path = require('path');

const ORDNER = path.join(__dirname, '..', '..', 'templates', 'fonts');
const SCHRIFTEN = [
  ['Montserrat', 'montserrat', [400, 600, 700]],
  ['Inter', 'inter', [400, 500, 600]],
  ['JetBrains Mono', 'jetbrains-mono', [400, 500]],
];

let cache;
function fontFaceCss() {
  if (cache) return cache;
  cache = SCHRIFTEN.flatMap(([familie, datei, gewichte]) =>
    gewichte.map((w) => {
      const b64 = fs.readFileSync(path.join(ORDNER, `${datei}-latin-${w}-normal.woff2`)).toString('base64');
      return `@font-face{font-family:'${familie}';font-weight:${w};font-style:normal;font-display:swap;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
    }),
  ).join('\n');
  return cache;
}

module.exports = { fontFaceCss };
