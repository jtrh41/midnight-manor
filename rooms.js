// Midnight at the Manor: the inside of each room, shown when a detective searches it.
// Rooms are drawn as a small picture (SVG 320 x 220): back wall, floor, furniture that belongs in that room, and a few emoji extras.
// A room's special feature (fireplace, window, lantern...) is drawn only when the room really has one: it is a clue.
(function (root) {
'use strict';
const WOOD = '#7a4a28', DARK = '#4a2c16', LIGHT = '#a8703e', METAL = '#8a8f98', STEEL = '#5a5f68';
const COL = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22', '#16a085', '#d35400', '#7f8c8d', '#e84393'];
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const R = (x, y, w, h, f, ex) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
const C = (x, y, r, f, ex) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
const E = (x, y, rx, ry, f, ex) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
const P = (d, f, ex) => `<path d="${d}" fill="${f}"${ex ? ' ' + ex : ''}/>`;
const T = (x, y, s, t) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle">${t}</text>`;

// every piece is drawn with its bottom-left corner at 0,0 (it grows upward)
const PIECES = {
  shelf(a) {
    let h = R(0, -104, 70, 104, DARK) + R(3, -101, 64, 98, '#2a1a0e');
    for (const y of [-6, -38, -70]) {
      h += R(0, y, 70, 5, WOOD);
      let x = 5;
      while (x < 62) {
        if (a === 'jars') { const w = 9; h += R(x, y - 16, w, 16, pick(COL), 'rx="3" opacity=".85"') + R(x + 1, y - 19, w - 2, 4, METAL); x += w + 3; }
        else if (a === 'toys') { h += rnd() < .5 ? C(x + 5, y - 7, 6, pick(COL)) : R(x, y - 13, 11, 13, pick(COL), 'rx="2"'); x += 14; }
        else if (a === 'bottles') { h += R(x + 2, y - 22, 6, 22, pick(['#2e7d32', '#6d4c41', '#1565c0']), 'rx="2"') + R(x + 3.5, y - 27, 3, 6, '#ccc'); x += 10; }
        else if (a === 'boots') { h += P(`M${x} ${y}h12v-6h-5v-12h-7z`, pick(['#5d4037', '#37474f', '#b71c1c'])); x += 15; }
        else if (a === 'gifts') { const c = pick(COL); h += R(x, y - 14, 13, 14, c) + R(x + 5, y - 14, 3, 14, '#ffeb3b'); x += 16; }
        else { const w = 4 + Math.floor(rnd() * 4), hh = 18 + Math.floor(rnd() * 9); h += rnd() < .12 ? P(`M${x} ${y}l${w} 0l${hh * .45} ${-hh}l-${w} 0z`, pick(COL)) : R(x, y - hh, w, hh, pick(COL)); x += w + 1; }
      }
    }
    return h;
  },
  stove() {
    return P('M-4 -96h64l-10 22h-44z', STEEL) + R(18, -116, 20, 22, STEEL) +
      R(0, -58, 56, 58, '#3a3d44', 'rx="3"') + R(-2, -60, 60, 6, '#22252b') + E(14, -61, 9, 2.5, '#111') + E(42, -61, 9, 2.5, '#111') +
      R(6, -46, 44, 34, '#22252b', 'rx="3"') + R(12, -40, 32, 18, '#ff8a3c', 'opacity=".55" rx="2"') + R(10, -50, 36, 3, METAL) +
      C(12, -6, 2.5, '#ddd') + C(28, -6, 2.5, '#ddd') + C(44, -6, 2.5, '#ddd') + `<g transform="translate(30 -66)">${E(0, 0, 13, 4, '#555')}${R(-11, -14, 22, 14, '#666')}</g>`;
  },
  sink() {
    return R(0, -48, 64, 48, WOOD) + R(-2, -52, 68, 6, '#d9cbb0') + R(4, -40, 26, 36, LIGHT) + R(34, -40, 26, 36, LIGHT) + C(27, -22, 2, DARK) + C(37, -22, 2, DARK) +
      E(32, -51, 18, 3, '#6a7580') + P('M30 -52v-14q0 -6 8 -6h6v4h-6q-3 0 -3 3v13z', METAL) + R(-4, -102, 72, 40, '#9ec5dc', 'stroke="' + DARK + '" stroke-width="4"') + R(30, -102, 4, 40, DARK);
  },
  counter(a) {
    let h = R(0, -44, 80, 44, WOOD) + R(-2, -48, 84, 6, '#d9cbb0') + R(6, -38, 30, 10, LIGHT) + R(44, -38, 30, 10, LIGHT) + R(6, -24, 68, 18, LIGHT);
    if (a === 'mugs') for (let i = 0; i < 4; i++) h += R(6 + i * 19, -60, 11, 12, pick(COL), 'rx="2"') + P(`M${17 + i * 19} -57a4 4 0 0 1 0 7`, 'none', 'stroke="#ddd" stroke-width="2"');
    else if (a === 'cookies') for (let i = 0; i < 5; i++) h += C(10 + i * 15, -53, 6, '#c68642') + C(8 + i * 15, -55, 1.5, '#5a3') + C(12 + i * 15, -52, 1.5, '#a33');
    else h += E(20, -52, 12, 4, '#ddd') + R(48, -66, 14, 18, '#c9a46a', 'rx="3"') + R(66, -60, 8, 12, '#e8e0d0');
    return h;
  },
  bed(a) {
    const c = a || pick(COL);
    return R(0, -62, 10, 62, DARK) + R(0, -30, 100, 16, '#f2efe6') + R(10, -36, 22, 10, '#fff', 'rx="5"') + R(34, -32, 64, 20, c, 'rx="4"') + R(94, -40, 8, 40, DARK) + R(4, -14, 6, 14, DARK) + R(92, -14, 6, 14, DARK);
  },
  bunks() { return PIECES.bed('#5c6bc0').replace(/^/, '<g transform="translate(0 -46) scale(1 .9)">') + '</g>' + PIECES.bed('#c0392b'); },
  table(a) {
    let h = R(8, -26, 6, 26, DARK) + R(86, -26, 6, 26, DARK) + R(0, -34, 100, 10, a === 'plain' ? WOOD : '#f4ead2') + (a === 'plain' ? '' : P('M0 -24l6 10l6 -10l6 10l6 -10l6 10l6 -10l6 10l6 -10l6 10l6 -10l6 10l6 -10l6 10l6 -10l6 10l6 -10l4 10', '#e8dcc0'));
    if (a === 'feast') h += E(26, -36, 9, 3, '#ddd') + E(74, -36, 9, 3, '#ddd') + R(47, -52, 5, 16, '#f4f1e0') + P('M49.5 -58q3 3 0 6q-3 -3 0 -6z', '#ffb84a') + T(26, -38, 13, '🍗') + T(74, -38, 13, '🍰');
    if (a === 'games') h += R(24, -40, 26, 6, '#eee') + T(70, -36, 14, '🎲');
    return h + R(-18, -48, 6, 48, DARK) + R(-18, -24, 20, 5, WOOD) + R(112, -48, 6, 48, DARK) + R(98, -24, 20, 5, WOOD);
  },
  desk() {
    return R(0, -40, 80, 8, WOOD) + R(2, -32, 24, 32, DARK) + R(54, -32, 24, 32, DARK) + R(6, -26, 16, 8, LIGHT) + R(6, -14, 16, 8, LIGHT) + R(58, -26, 16, 8, LIGHT) +
      R(30, -46, 22, 6, '#f4ead2', 'transform="rotate(-6 40 -43)"') + R(60, -70, 3, 30, '#c9a227') + P('M50 -70h24l-6 -14h-12z', '#2e7d32') + C(62, -66, 5, '#ffe08a', 'opacity=".6"') + T(24, -44, 14, '✒️');
  },
  piano() {
    let h = R(0, -80, 90, 80, '#1b1b1f', 'rx="3"') + R(0, -40, 90, 6, '#2b2b30') + R(4, -34, 82, 12, '#f5f5f0');
    for (let i = 0; i < 13; i++) if (i % 7 !== 2 && i % 7 !== 6) h += R(8 + i * 6, -34, 3.5, 7, '#111');
    return h + R(6, -22, 6, 22, '#1b1b1f') + R(78, -22, 6, 22, '#1b1b1f') + R(30, -100, 3, 20, '#c9a227') + R(56, -100, 3, 20, '#c9a227') + C(31.5, -102, 3, '#ffb84a') + C(57.5, -102, 3, '#ffb84a');
  },
  clock() {
    return R(0, -110, 30, 110, DARK, 'rx="3"') + C(15, -90, 12, '#f4ead2', `stroke="${'#c9a227'}" stroke-width="3"`) + P('M15 -90v-8M15 -90l6 3', 'none', 'stroke="#222" stroke-width="2"') +
      R(8, -70, 14, 50, '#2a1a0e') + `<g class="swing">${P('M15 -70v34', 'none', 'stroke="#c9a227" stroke-width="2"')}${C(15, -34, 5, '#c9a227')}</g>`;
  },
  painting(a) {
    const w = 56, h = 42;
    return R(0, -h, w, h, '#c9a227') + R(5, 5 - h, w - 10, h - 10, a === 'night' ? '#1a2a4a' : '#7fb3d5') + P(`M5 -5 L22 ${-h + 18} L34 -18 L42 -26 L${w - 5} -5z`, a === 'night' ? '#2d4a3a' : '#4e8a3e') + C(40, -h + 14, 5, a === 'night' ? '#f5f5dc' : '#f1c40f');
  },
  portrait() { const c = pick(['#7b3f8c', '#1d2c4a', '#7a2a2a']); return R(0, -52, 40, 52, '#c9a227') + R(4, -48, 32, 44, '#2a2a3a') + E(20, -12, 12, 10, c) + C(20, -28, 8, '#e8b58f') + P('M12 -32q8 -10 16 0', '#3b2a20'); },
  chandelier() { return P('M0 0v18', 'none', 'stroke="#c9a227" stroke-width="2"') + E(0, 26, 24, 6, '#c9a227') + [-18, -6, 6, 18].map(x => R(x - 2, 14, 4, 10, '#f4f1e0') + C(x, 11, 3, '#ffd27a')).join('') + C(0, 34, 4, '#a8e0ff'); },
  crates() { let h = ''; for (const [x, y] of [[0, 0], [40, 0], [20, -36]]) h += `<g transform="translate(${x} ${y})">${R(0, -36, 38, 36, LIGHT, `stroke="${DARK}" stroke-width="3"`)}${P('M2 -2L36 -34M2 -34L36 -2', 'none', `stroke="${DARK}" stroke-width="3"`)}</g>`; return h; },
  barrels() { let h = ''; for (const x of [0, 34]) h += `<g transform="translate(${x} 0)">${P('M2 0q-6 -24 0 -48h28q6 24 0 48z', WOOD)}${R(-1, -40, 34, 4, STEEL)}${R(-1, -12, 34, 4, STEEL)}</g>`; return h; },
  plants() { let h = ''; for (const x of [0, 30, 60]) { const s = .8 + rnd() * .5; h += `<g transform="translate(${x} 0) scale(${s})">${P('M4 0l-3 -20h26l-3 20z', '#b5652c')}${E(14, -32, 8, 16, '#2e7d32', 'transform="rotate(-25 14 -32)"')}${E(14, -32, 8, 16, '#43a047', 'transform="rotate(25 14 -32)"')}${E(14, -40, 6, 14, '#66bb6a')}</g>`; } return h; },
  telescope() { return P('M10 0l14 -40l14 40', 'none', `stroke="${DARK}" stroke-width="4"`) + `<g transform="rotate(-35 24 -44)">${R(-4, -52, 60, 14, '#c9a227', 'rx="4"')}${R(48, -55, 10, 20, '#a07e1a', 'rx="3"')}</g>`; },
  console(a) {
    let h = P('M0 0v-34l10 -12h80l10 12v34z', '#3a4050') + R(10, -40, 80, 6, '#22262f');
    for (let i = 0; i < 6; i++) h += C(16 + i * 13, -24, 3.5, pick(['#e74c3c', '#2ecc71', '#f1c40f', '#3498db']));
    for (const x of [8, 54]) h += R(x, -86, 40, 34, '#1b2230', `stroke="${STEEL}" stroke-width="3"`) + R(x + 5, -80, 30, 22, a === 'radio' ? '#2a3a1a' : '#163a5a') + P(`M${x + 6} -68q6 -10 12 0t12 0`, 'none', `stroke="${a === 'radio' ? '#7cfc00' : '#5ad1ff'}" stroke-width="2"`);
    return h;
  },
  lab() {
    let h = R(0, -40, 100, 8, '#e0e0e0') + R(4, -32, 8, 32, '#9e9e9e') + R(88, -32, 8, 32, '#9e9e9e') + R(4, -10, 92, 4, '#9e9e9e');
    h += P('M14 -40l4 -14v-10h6v10l4 14z', '#7ed6df', 'opacity=".85"') + R(40, -64, 6, 24, '#badc58', 'rx="3"') + R(50, -60, 6, 20, '#ff7979', 'rx="3"') + C(76, -50, 10, '#e056fd', 'opacity=".8"') + R(73, -66, 6, 8, '#ccc');
    return h;
  },
  case(a) { return R(6, -40, 48, 40, '#d8cfbf') + R(2, -44, 56, 6, '#bdb2a0') + R(6, -96, 48, 52, '#bde3ff', 'opacity=".28" stroke="#e8f6ff" stroke-width="2"') + T(30, -56, 30, a || '🏺'); },
  sofa(a) { const c = a || '#8e3b46'; return R(0, -46, 100, 28, c, 'rx="8"') + R(-6, -34, 18, 30, c, 'rx="6"') + R(88, -34, 18, 30, c, 'rx="6"') + R(8, -24, 84, 16, c, 'rx="4" style="filter:brightness(1.15)"') + R(4, -8, 6, 8, DARK) + R(90, -8, 6, 8, DARK); },
  workbench() { let h = R(0, -100, 100, 52, '#b08050') ; for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) h += C(8 + i * 12, -92 + j * 12, 1.5, '#5a3a1a'); h += T(22, -66, 20, '🔨') + T(52, -66, 20, '🪚') + T(80, -66, 20, '🔧'); return h + R(0, -42, 100, 8, WOOD) + R(4, -34, 8, 34, DARK) + R(88, -34, 8, 34, DARK) + T(30, -44, 16, '🧸') + T(66, -44, 16, '🪀'); },
  wheel() { let h = R(26, -30, 8, 30, DARK) + C(30, -62, 26, 'none', `stroke="${WOOD}" stroke-width="6"`) + C(30, -62, 6, DARK); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, x = 30 + Math.cos(a) * 36, y = -62 + Math.sin(a) * 36; h += P(`M30 -62L${x.toFixed(1)} ${y.toFixed(1)}`, 'none', `stroke="${WOOD}" stroke-width="4" stroke-linecap="round"`); } return h; },
  hay() { return R(0, -28, 60, 28, '#e0b84a', 'rx="4"') + P('M4 -20h52M4 -10h52', 'none', 'stroke="#b8902a" stroke-width="2"') + R(70, -60, 6, 60, WOOD) + R(130, -60, 6, 60, WOOD) + R(70, -50, 66, 6, WOOD) + R(70, -30, 66, 6, WOOD); },
  seats(a) { const c = a || '#8e2b2b'; return R(0, -70, 16, 70, c, 'rx="5"') + R(0, -30, 40, 14, c, 'rx="4"') + R(84, -70, 16, 70, c, 'rx="5"') + R(60, -30, 40, 14, c, 'rx="4"') + R(44, -40, 12, 40, DARK) + R(36, -44, 28, 5, WOOD); },
  cubbies() { let h = R(0, -100, 90, 100, DARK); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { h += R(4 + i * 21.5, -96 + j * 24, 18, 20, '#2a1a0e'); if (rnd() < .7) h += R(6 + i * 21.5, -88 + j * 24, 14, 10, '#f4ead2', `transform="rotate(${(rnd() * 16 - 8).toFixed(0)} ${13 + i * 21.5} ${-83 + j * 24})"`); } return h; },
  sacks() { let h = ''; for (const x of [0, 28, 14]) h += `<g transform="translate(${x} ${x === 14 ? -22 : 0})">${P('M2 0q-4 -20 6 -28l-3 -6h20l-3 6q10 8 6 28z', '#c8a878')}${T(14, -8, 10, '✉️')}</g>`; return h; },
  rack() { let h = R(0, -90, 90, 6, WOOD) + R(0, -10, 90, 6, WOOD) + R(0, -90, 6, 90, DARK) + R(84, -90, 6, 90, DARK); for (let i = 0; i < 6; i++) h += R(12 + i * 12, -100, 6, 96, pick(COL), 'rx="3"'); return h; },
  benches() { let h = ''; for (let i = 0; i < 3; i++) h += R(i * 10, -16 - i * 26, 110 - i * 20, 8, LIGHT) + R(i * 10, -8 - i * 26, 110 - i * 20, 8 + i * 26, '#8a5a30'); return h + `<g class="steam">${T(30, -96, 22, '💨')}${T(80, -86, 18, '💨')}</g>`; },
  gauges() { let h = R(0, -90, 100, 90, '#2b2b2f', 'rx="6"') + R(10, -30, 80, 22, '#ff6a2a', 'opacity=".7"') + R(10, -30, 80, 22, 'none', 'stroke="#111" stroke-width="3"'); for (const x of [22, 50, 78]) h += C(x, -66, 11, '#f4ead2', 'stroke="#c9a227" stroke-width="3"') + P(`M${x} -66l${(rnd() * 14 - 7).toFixed(0)} -7`, 'none', 'stroke="#c0392b" stroke-width="2"'); return h; },
  coal() { let h = P('M0 0q20 -50 50 -46q30 -4 50 46z', '#1c1c1c'); for (let i = 0; i < 14; i++) h += C(10 + rnd() * 80, -4 - rnd() * 34, 5, '#2e2e2e'); return h; },
  pool() { return R(4, -30, 8, 30, DARK) + R(88, -30, 8, 30, DARK) + R(0, -40, 100, 14, WOOD) + R(4, -42, 92, 6, '#1e8449') + C(30, -44, 3, '#fff') + C(60, -44, 3, '#c0392b') + C(68, -45, 3, '#f1c40f'); },
  mat() { return E(50, -6, 54, 8, '#2e86c1') + T(20, -12, 22, '🏋️') + T(80, -12, 22, '🏀'); },
  pods() { let h = ''; for (const x of [0, 46]) h += R(x, -74, 40, 74, '#cfd8e3', 'rx="18"') + R(x + 6, -64, 28, 46, '#5ad1ff', 'rx="12" opacity=".5"') + C(x + 20, -10, 3, '#2ecc71'); return h; },
  lens() { let h = R(30, -20, 40, 20, STEEL); for (let i = 0; i < 5; i++) h += R(18 + i * 2, -100 + i * 14, 64 - i * 4, 12, '#ffe58a', `opacity="${(.9 - i * .1).toFixed(2)}" rx="6"`); return h + C(50, -64, 46, '#fff6c0', 'opacity=".25"'); },
  hammocks() { let h = R(0, -80, 6, 80, WOOD) + R(104, -80, 6, 80, WOOD); for (const y of [-70, -36]) h += P(`M6 ${y}q49 30 98 0q-49 18 -98 0z`, pick(['#d9c79e', '#c4a574'])); return h; },
  vault() { let h = C(50, -56, 50, '#8a8f98', 'stroke="#5a5f68" stroke-width="6"') + C(50, -56, 14, STEEL); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; h += P(`M50 -56L${(50 + Math.cos(a) * 30).toFixed(1)} ${(-56 + Math.sin(a) * 30).toFixed(1)}`, 'none', 'stroke="#d0d4da" stroke-width="5" stroke-linecap="round"'); } return h; },
  armor() { return R(18, -12, 24, 12, STEEL) + R(22, -60, 16, 50, METAL, 'rx="4"') + R(12, -76, 36, 22, METAL, 'rx="8"') + C(30, -88, 12, METAL) + R(24, -90, 12, 3, '#222') + P('M30 -100l4 -10h-8z', '#c0392b'); },
  easel() { return P('M10 0l20 -90l20 90M30 -90v90', 'none', `stroke="${WOOD}" stroke-width="4"`) + R(6, -84, 48, 40, '#fff') + C(22, -70, 6, '#f1c40f') + P('M8 -46l14 -14l10 8l12 -12l8 18z', '#3498db') + R(4, -44, 52, 4, WOOD); },
  tree() { let h = R(26, -14, 10, 14, DARK); for (let i = 0; i < 3; i++) h += P(`M${31 - 30 + i * 6} ${-12 - i * 24}l${30 - i * 6} -34l${30 - i * 6} 34z`, '#1e7a3a'); for (let i = 0; i < 7; i++) h += C(14 + rnd() * 34, -20 - rnd() * 60, 3, pick(COL)); return h + T(31, -86, 16, '⭐'); },
  gifts() { let h = ''; for (const [x, w, hh, y] of [[0, 30, 26, 0], [32, 26, 34, 0], [8, 22, 18, -26], [60, 30, 22, 0]]) { const c = pick(COL); h += R(x, y - hh, w, hh, c) + R(x + w / 2 - 2, y - hh, 4, hh, '#ffeb3b') + R(x, y - hh / 2 - 2, w, 4, '#ffeb3b'); } return h; },
  stools() { let h = ''; for (const x of [0, 30, 60]) h += E(x + 10, -34, 11, 4, '#c0392b') + R(x + 8, -32, 4, 32, METAL); return h; },
  rover() { return T(50, -4, 70, '🚙') + R(0, -2, 100, 4, '#333'); },
  sled() { return T(50, -2, 70, '🛷'); },
  big(a) { return T(40, -4, 64, a); },
  rug(a) { return E(0, 0, 70, 12, a || '#7a2a2a') + E(0, 0, 58, 8, 'none', 'stroke="#c9a227" stroke-width="2" opacity=".7"'); },
  fence() { return R(0, -36, 320, 4, WOOD) + R(0, -20, 320, 4, WOOD) + [0, 60, 120, 180, 240, 300].map(x => R(x, -40, 6, 40, DARK)).join(''); },
  rope() { return P('M0 -40q40 16 80 0', 'none', 'stroke="#c0392b" stroke-width="4"') + R(-3, -44, 6, 44, '#c9a227') + R(77, -44, 6, 44, '#c9a227'); },
  e(a) { return T(0, 0, 30, a); },
};
// features, only when the room really has one
const FEATURE = {
  fire: () => R(-10, -78, 100, 78, '#6a3a2a') + R(-14, -84, 108, 10, '#4a2618') + P('M8 0v-46q0 -12 12 -12h40q12 0 12 12v46z', '#1a0c06') +
    `<g class="flame">${P('M40 -4q-20 -6 -8 -30q2 10 8 8q-4 -14 8 -26q0 16 10 22q6 16 -18 26z', '#ff8a2a')}${P('M40 -4q-10 -4 -4 -16q4 6 8 2q4 8 -4 14z', '#ffd24a')}</g>` + R(4, -4, 72, 4, '#333'),
  win: icon => R(0, -76, 84, 66, '#0e1a36', `stroke="${DARK}" stroke-width="6"`) + T(42, -30, 28, icon) + R(39, -76, 6, 66, DARK) + R(0, -46, 84, 5, DARK) + R(-6, -12, 96, 6, WOOD),
  sky: icon => R(0, -36, 100, 30, '#0e1a36', `stroke="${DARK}" stroke-width="5"`) + T(50, -12, 20, icon) + P('M33 -36v30M66 -36v30', 'none', `stroke="${DARK}" stroke-width="4"`),
  hang: icon => P('M30 -60v26', 'none', 'stroke="#333" stroke-width="2"') + C(30, -16, 24, '#ffb84a', 'opacity=".25"') + T(30, -6, 30, icon),
};
function featureKind(flag) { return flag.label === 'fireplace' ? 'fire' : flag.label === 'lantern' ? 'hang' : flag.label === 'skylight' ? 'sky' : 'win'; }

// layout: "piece:arg@x,y,scale | ..."  (y = where its bottom sits: about 150 for the back wall, 200-216 for the front)
// F@x,y,scale = the special feature if the room has one, otherwise the piece after "/" (or nothing)
const L = {
  'Library': 'shelf@6,150,1|shelf@244,150,1|F@120,150,1/painting|rug@160,206|table:plain@118,212,.8|e:📚@140,182',
  'Kitchen@manor': 'stove@8,150,1|sink@232,150,1|F@120,150,.9/painting|counter@110,212,1|e:🥖@150,166',
  'Conservatory': 'plants@4,150,1|plants@222,150,1|F@120,150,1/painting|plants@100,214,1.3|e:🦋@60,60|e:🌺@270,70',
  'Ballroom': 'chandelier@160,0|F@120,150,1/painting|painting@18,108,1|painting@246,108,1|rug:#3a2a6a@160,208|e:💃@110,200|e:🕺@210,200',
  'Dining Hall': 'chandelier@160,0|F@14,150,.9/portrait|portrait@262,110,1|table:feast@108,212,1.05',
  'Music Room': 'piano@14,150,1|F@138,150,.9/painting|e:🎻@270,140|e:🎺@250,100|rug@200,208|e:🎼@200,198',
  'Study': 'shelf@246,150,1|F@10,150,.9/painting|desk@120,212,1.1|clock@200,150,.9',
  'Attic': 'crates@6,150,1|e:🕸️@40,40|e:🕸️@290,30|e:🦇@250,60|F@140,150,.8/painting:night|e:🧳@120,206|crates@220,214,.9',
  'Portrait Gallery': 'portrait@20,110,1|portrait@80,104,1.1|F@150,150,.9/portrait|portrait@250,110,1|rope@120,214,1|e:🗿@40,206',
  'Nursery': 'shelf:toys@244,150,1|F@10,150,.9/painting|bed:#e84393@110,212,1|e:🧸@60,204|e:🚂@230,206',
  'Observatory': 'F@20,150,.9/painting:night|shelf@244,150,1|telescope@110,212,1.6|e:🌌@180,60',
  'Clock Tower': 'clock@20,150,1|clock@268,150,1|F@120,150,.9/painting:night|e:⚙️@70,60|e:⚙️@240,90|e:🔔@160,200|e:🦇@200,40',
  'Lamp Room': 'lens@110,150,1.2|F@14,150,.9|e:🧰@270,206|e:🛢️@60,206',
  'Watch Gallery': 'F@20,150,.9/painting|telescope@170,150,1.2|fence@0,214,1|e:🧭@260,206|e:🐦@250,60',
  'Keeper\'s Bedroom': 'F@200,150,.9/painting|bed:#2e86c1@20,210,1.1|e:🥾@180,206|portrait@140,110,.9',
  'Log Room': 'shelf@8,150,1|F@230,150,.9/painting|desk@120,212,1.1|clock@90,150,.8',
  'Boathouse': 'F@24,150,.9/painting|e:⛵@180,140|barrels@220,212,1|e:🎣@60,204|e:🛟@120,110',
  'Kitchen@lighthouse': 'stove@10,150,1|shelf:jars@244,150,1|F@120,150,.9/painting|table:plain@110,212,.9|e:🐟@150,174',
  'Storm Cellar': 'barrels@10,150,1|shelf:boots@240,150,1|crates@120,214,.9|e:🕸️@60,40|F@140,150,.8',
  'Radio Shack': 'console:radio@100,150,1.1|F@14,150,.9/painting|e:📡@270,80|e:🎧@150,170|shelf:jars@250,150,.9',
  'Loft': 'F@14,150,.9/painting|bed:#c0392b@140,210,1.1|e:🦌@250,80|e:🧺@60,206',
  'Guest Suite': 'F@210,150,.9/painting|bed:#27ae60@20,210,1.1|e:🧳@180,206|e:🛎️@240,190',
  'Games Room': 'pool@100,212,1.2|F@20,150,.9/painting|e:🎯@250,80|shelf:toys@244,150,1',
  'Sauna': 'benches@100,150,1.2|F@14,150,.8|e:🪣@250,206|e:🌡️@280,80',
  'Great Hall': 'F@120,150,1/painting|e:🦌@60,80|e:🐻@260,206|sofa@110,212,1|rug@160,214|e:🪵@60,206',
  'Cocoa Bar': 'counter:mugs@110,150,1.1|F@14,150,.9/painting|shelf:jars@244,150,1|stools@120,212,1|e:☕@60,206',
  'Boot Room': 'shelf:boots@10,150,1|shelf:boots@244,150,1|F@120,150,.9/painting|e:🧥@140,200|e:🧤@180,206',
  'Ski Shop': 'rack@10,150,1|rack@220,150,1|F@120,150,.9/painting|e:🏂@160,206|e:🥽@120,206',
  'Engine Cab': 'gauges@100,150,1.1|F@14,150,.9/painting|coal@220,214,.9|e:🕹️@80,206',
  'Coal Car': 'coal@40,214,1.6|e:⛏️@60,80|F@120,150,.9|e:🪔@270,80|e:🪣@270,206',
  'Dining Car': 'F@30,150,.9/painting|F@200,150,.9/painting|table:feast@108,212,1.05',
  'Lounge Car': 'F@120,150,.9/painting|sofa@16,212,.9|sofa@200,212,.9|e:🪴@160,206|e:📰@150,170',
  'Sleeper Car': 'bunks@16,212,1.1|F@200,150,.9/painting|e:🧳@250,206|e:🧦@180,190',
  'Baggage Car': 'crates@10,150,1|crates@230,150,1|F@120,150,.9/painting|e:🧳@120,206|e:🎒@170,206|e:🏷️@200,80',
  'Observation Car': 'F@20,150,.9/painting:night|F@200,150,.9/painting:night|seats@110,212,1|e:📷@160,170',
  'Mail Car': 'cubbies@10,150,1|cubbies@226,150,1|F@120,150,.9/painting|sacks@130,212,1',
  'Dinosaur Hall': 'big:🦖@70,150,1.6|big:🦕@190,150,1.3|F@120,50,.6|rope@110,214,1.4',
  'Egyptian Room': 'case:⚱️@20,150,1|case:🐈@240,150,1|F@120,150,.9/painting|big:🏺@120,214,.9|rope@40,214,.8',
  'Space Gallery': 'big:🚀@120,150,1.4|F@20,150,.8/painting:night|case:🪐@240,150,1|e:🛰️@60,50|rope@110,214,1.3',
  'Insect House': 'case:🦋@20,150,1|case:🐞@130,150,1|case:🐝@240,150,1|F@120,60,.6|rope@110,214,1.3',
  'Gem Vault': 'vault@110,150,1.1|case:💍@14,150,1|case:👑@250,150,1|F@110,40,.5|e:🪙@60,206',
  'Knight\'s Armory': 'armor@30,150,1.1|armor@250,150,1.1|F@120,150,.9/painting|e:⚔️@160,80|e:🛡️@120,200|rope@120,214,1',
  'Art Gallery': 'painting@20,110,1|painting@244,110,1|F@120,150,.9/painting|easel@130,214,1|e:🗿@60,206',
  'Gift Shop': 'shelf:toys@10,150,1|shelf:gifts@244,150,1|F@120,150,.9/painting|counter@110,212,1|e:🎈@150,150',
  'Crow\'s Nest': 'e:🏴‍☠️@200,50|e:🐦@260,90|e:🌙@120,70|fence@0,214,1|e:🔭@160,200',
  'Ship\'s Wheel': 'wheel@130,214,1.4|F@20,150,.9/painting:night|e:🧭@260,206|e:🦜@260,80',
  'Bow': 'F@120,150,.9/painting:night|e:⚓@50,206|e:🪢@260,206|e:🐬@80,80|fence@0,214,1',
  'Rope Locker': 'e:🪢@60,120|e:🪢@120,100|e:🪢@260,120|F@160,150,.8|barrels@200,212,1|e:🪝@40,60',
  'Galley': 'stove@10,150,1|shelf:jars@244,150,1|F@120,150,.8/painting|table:plain@110,212,.9|e:🍌@150,174',
  'Crew Hammocks': 'hammocks@100,150,1|F@14,150,.8/painting|e:🎒@260,206|e:🧦@40,206',
  'Cargo Hold': 'crates@10,150,1|barrels@230,150,1|F@130,150,.8|crates@110,214,.9|e:🐀@260,206',
  'Captain\'s Cabin': 'F@20,150,.8/painting|shelf@244,150,1|desk@110,212,1.1|e:🗺️@150,168|e:🪙@60,206',
  'Control Room': 'console@20,150,1|console@200,150,1|F@130,150,.7/painting:night|e:🪑@160,206',
  'Star Observatory': 'F@20,150,.9/painting:night|telescope@140,212,1.6|e:🌌@240,70|e:☄️@170,40',
  'Greenhouse': 'plants@10,150,1|plants@230,150,1|F@120,150,.9/painting|plants@110,214,1.3|e:💧@200,60',
  'Zero-G Gym': 'mat@110,206,1.1|F@20,150,.9/painting|e:🤸@160,120|e:🏀@250,70|e:🎾@60,60',
  'Rover Garage': 'rover@100,206,1.4|F@20,150,.9/painting|e:🔧@260,100|e:🛞@260,206|e:🔋@60,206',
  'Sleeping Pods': 'pods@20,150,1|pods@200,150,1|F@120,150,.8/painting:night|e:🧸@160,206',
  'Science Lab': 'lab@100,212,1.2|shelf:jars@10,150,1|shelf:bottles@244,150,1|F@120,150,.8/painting',
  'Space Kitchen': 'stove@10,150,1|sink@232,150,1|F@120,150,.9/painting|counter@110,212,1|e:🍕@150,166',
  'Toy Workshop': 'workbench@110,150,1|F@14,150,.9/painting|shelf:toys@250,150,1|e:🪁@60,206|e:🚂@260,206',
  'Wrapping Room': 'gifts@20,150,1|shelf:gifts@244,150,1|F@130,150,.8/painting|table:plain@110,212,.9|e:🎀@160,174|e:✂️@130,176',
  'Tinsel Loft': 'tree@120,150,1.3|F@20,150,.8/painting:night|crates@230,150,.8|e:✨@60,60|e:✨@270,40|gifts@110,214,.7',
  'Mail Room': 'cubbies@10,150,1|cubbies@226,150,1|F@120,150,.9/painting|sacks@130,212,1|e:📮@220,206',
  'Cookie Kitchen': 'stove@10,150,1|counter:cookies@110,150,1|F@230,150,.9/painting|table:plain@110,212,.9|e:🥛@140,174',
  'Reindeer Stable': 'hay@20,150,1|F@230,150,.9/painting:night|big:🦌@120,212,1|e:🥕@60,206|e:🔔@270,90',
  'Sleigh Garage': 'sled@120,212,1.4|F@20,150,.9/painting:night|gifts@230,150,.9|e:🔔@170,80|e:🧰@270,206',
  'Cocoa Lounge': 'F@120,150,1/painting|sofa@14,212,.9|sofa@204,212,.9|e:☕@170,190|e:🫖@150,190|rug@160,216',
};

function draw(spec, room, flag) {
  let h = '';
  seed = 7; for (const ch of room.name) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647; if (seed <= 0) seed += 2147483646;
  for (const part of spec.split('|')) {
    const [main, alt] = part.split('/'), [what, pos] = main.split('@'); let [x, y, s] = (pos || '0,150,1').split(',').map(Number);
    let name = what, arg = '';
    if (what === 'F') {
      if (room.flag) { const k = featureKind(flag); h += `<g transform="translate(${k === 'sky' ? 180 : x} ${k === 'sky' ? 44 : y}) scale(${k === 'sky' ? .9 : s || 1})">${FEATURE[k](flag.icon)}</g>`; continue; }   // a skylight is always up high
      if (!alt) continue;
      [name, arg] = alt.split(':'); y -= 34;              // no feature here: hang a picture on the wall instead
    } else { const i = what.indexOf(':'); if (i > 0) { name = what.slice(0, i); arg = what.slice(i + 1); } }
    const f = PIECES[name]; if (!f) continue;
    h += `<g transform="translate(${x} ${y}) scale(${s || 1})">${f(arg)}</g>`;
  }
  return h;
}
// wall top, wall bottom, floor, floor lines
const PAINT = {
  manor: ['#4a2e2a', '#24150f', '#5a3a22', '#3e2716'], lighthouse: ['#2d4c5c', '#16252e', '#6a5a44', '#4a3e2e'],
  lodge: ['#6a4428', '#3a2414', '#7a5a3a', '#5a3e24'], train: ['#5c2a2a', '#331616', '#4a3226', '#2e1e16'],
  museum: ['#4e4838', '#29251c', '#8a7d62', '#6a5e48'], ship: ['#4e3820', '#291c0e', '#6e4e2c', '#4e341a'],
  moon: ['#2c3456', '#13172c', '#4c5062', '#34384a'], workshop: ['#6e2a2a', '#381212', '#6e4c2c', '#4e3218'],
};
// elapsed: seconds since the detective walked in, so redraws carry on the animation instead of restarting it
function scene(themeKey, room, flag, zoneLabel, elapsed) {
  const c = PAINT[themeKey] || PAINT.manor, spec = L[room.name + '@' + themeKey] || L[room.name] || 'F@120,150,1/painting|table:plain@110,212,1';
  let floor = ''; for (let i = -6; i <= 16; i++) floor += `<path d="M${160 + (i * 24 - 160) * .55} 150L${160 + (i * 24 - 160) * 1.25} 220" stroke="${c[3]}" stroke-width="2"/>`;
  return `<div class="rscene" style="--el:${-Math.max(0, elapsed || 0)}s">
    <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="rw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs>
      <rect width="320" height="150" fill="url(#rw)"/><rect y="118" width="320" height="4" fill="#000" opacity=".2"/>
      <rect y="150" width="320" height="70" fill="${c[2]}"/>${floor}<rect y="148" width="320" height="4" fill="#000" opacity=".35"/>
      ${draw(spec, room, flag)}
    </svg>
    <div class="plaque">${room.e} ${room.name}<small>${zoneLabel}</small></div>
    <span class="spark">✨</span>
    <div class="beam"></div>
    <div class="door l"></div><div class="door r"></div>
  </div>`;
}
root.ManorRooms = { scene, LAYOUT: L, PIECES };
})(window);
