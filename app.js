// Midnight at the Manor: screens, profiles and saves. The mystery itself comes from engine.js (window.Manor).
(function () {
'use strict';
const M = window.Manor;
const KEY = 'manor2', SITE = 'https://jtrh41.github.io/midnight-manor/';
const $app = document.getElementById('app'), $tabs = document.getElementById('tabs'), $modal = document.getElementById('modal');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const AVATARS = ['🕵️', '🦉', '🦊', '🐶', '🐱', '🦇', '🐻', '🐰', '🦁', '🐸', '🐧', '🦄', '🐙', '🚀', '👑', '🌟'];
const NTH = M.THEMES.length;

// ---------- saves (autosaved after every action; one profile per person) ----------
const clampInt = (v, lo, hi, d) => (Number.isInteger(v) && v >= lo && v <= hi) ? v : d;
function cleanCase(code, c) {
  const info = M.readCode(code);
  if (!c || typeof c !== 'object' || info.error) return null;
  const n = M.LEVELS[info.level].n, P = info.players;
  const note = c.note && typeof c.note === 'object' ? c.note : {};
  const arr = (a, len) => Array.isArray(a) && a.length === len && a.every(x => x === 0 || x === 1 || x === 2) ? a : Array(len).fill(0);
  return { seat: clampInt(c.seat, -1, P - 1, -1), found: clampInt(c.found, 0, 6, 0), searched: Array.isArray(c.searched) ? c.searched.filter(x => Number.isInteger(x) && x >= 0 && x < n).slice(0, 6) : [],
    note: { sr: arr(note.sr, n * n), si: arr(note.si, n * n), t: arr(note.t, n) },
    guesses: Array.isArray(c.guesses) ? c.guesses.filter(g => g && typeof g === 'object').slice(0, M.DIFFS[info.diff].tries).map(g => ({ s: clampInt(g.s, 0, 5, 0), r: clampInt(g.r, 0, 5, 0), i: clampInt(g.i, 0, 5, 0), right: clampInt(g.right, 0, 3, 0) })) : [],
    done: clampInt(c.done, 0, 2, 0), stars: clampInt(c.stars, 0, 3, 0), help: c.help ? 1 : 0, at: Number.isFinite(c.at) ? c.at : Date.now() };
}
function newId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
function cleanProfile(p) {
  if (!p || typeof p !== 'object') return null;
  const name = String(p.name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20); if (!name) return null;
  const prog = {};
  const best = {};
  for (const T of M.THEMES) { const a = p.prog && Array.isArray(p.prog[T.key]) ? p.prog[T.key] : []; prog[T.key] = Array.from({ length: 10 }, (_, k) => clampInt(a[k], 0, 3, 0));
    const b = p.best && Array.isArray(p.best[T.key]) ? p.best[T.key] : []; best[T.key] = Array.from({ length: 10 }, (_, k) => clampInt(b[k], -1, 3, prog[T.key][k] > 0 ? 1 : -1)); }
  const cases = {};
  if (p.cases && typeof p.cases === 'object') for (const [code, c] of Object.entries(p.cases)) { const cc = cleanCase(code, c); if (cc) cases[code] = cc; }
  const r = p.record && typeof p.record === 'object' ? p.record : {};
  return { id: /^[a-z0-9]{6,16}$/.test(p.id) ? p.id : newId(), name, av: AVATARS.includes(p.av) ? p.av : '🕵️', junior: p.junior ? 1 : 0,
    record: { solved: clampInt(r.solved, 0, 1e6, 0), stars: clampInt(r.stars, 0, 1e7, 0), played: clampInt(r.played, 0, 1e6, 0) },
    prog, best, cases, cur: p.cur && cases[p.cur] ? p.cur : null, made: Number.isFinite(p.made) ? p.made : Date.now() };
}
function load() {
  let raw = null, d = null;
  try { raw = localStorage.getItem(KEY); d = JSON.parse(raw || 'null'); } catch (e) { try { localStorage.setItem(KEY + '-broken-' + Date.now(), raw); } catch (e2) {} d = null; }
  if (!d || typeof d !== 'object') d = {};
  const out = { v: 2, profiles: {}, me: null, settings: { sound: d.settings && d.settings.sound ? 1 : 0 } };
  if (d.profiles && typeof d.profiles === 'object') for (const p of Object.values(d.profiles)) { const c = cleanProfile(p); if (c) out.profiles[c.id] = c; }
  out.me = d.me && out.profiles[d.me] ? d.me : null;
  return out;
}
let D = load();
function save() {
  try { const prev = localStorage.getItem(KEY); if (prev) localStorage.setItem(KEY + '-prev', prev); localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {}
}
const me = () => D.me ? D.profiles[D.me] : null;

// ---------- view state ----------
const V = { screen: 'home', tab: 'clues', nb: 'where', theme: 0, draft: { players: 0, juniors: 0, level: 0, diff: 1 }, joinCode: '', err: '', acc: { s: -1, r: -1, i: -1 }, fresh: -1, searching: -1, newProf: { name: '', av: '🕵️', junior: 0 } };
let CS = null;
function curCase() { const p = me(); return p && p.cur ? p.cases[p.cur] : null; }
function openCase(code) {
  const p = me(); CS = M.buildCase(code); p.cur = code;
  if (!p.cases[code]) {
    p.cases[code] = cleanCase(code, { seat: -1, help: CS.juniors >= CS.players ? 1 : 0, at: Date.now() });
    p.record.played++;
    const keys = Object.keys(p.cases).sort((a, b) => p.cases[b].at - p.cases[a].at); for (const k of keys.slice(25)) delete p.cases[k];   // keep the last 25 cases
  }
  save();
}
function useProfile(id) { D.me = id; CS = null; const p = me(); if (p && p.cur) { try { CS = M.buildCase(p.cur); } catch (e) { p.cur = null; } } save(); }
if (D.me) useProfile(D.me);

// ---------- art ----------
function portrait(p, size) {
  const L = p.look, t = p.t, z = size || 56;
  let hair = '', hat = '', extra = '';
  const coat = L.hatC && !['chef', 'sun', 'beanie', 'elf'].includes(L.hat) ? L.hatC : (L.fem ? '#5b3550' : '#2f3a4a');
  if (L.fem) hair = `<path d="M28 44 Q27 18 50 17 Q73 18 72 44 L72 58 Q66 50 66 40 L34 40 Q34 50 28 58 Z" fill="${L.hair}"/>`;
  else if (L.wild) hair = `<path d="M29 40 L26 26 L35 31 L37 18 L45 27 L50 15 L55 27 L63 18 L65 31 L74 26 L71 40 Z" fill="${L.hair}"/>`;
  else hair = `<path d="M30 40 Q30 19 50 19 Q70 19 70 40 Q66 28 50 27 Q34 28 30 40 Z" fill="${L.hair}"/>`;
  if (L.bun) hair += `<circle cx="50" cy="15" r="8" fill="${L.hair}"/>`;
  if (L.braid) hair += `<path d="M69 46 Q76 60 70 74" stroke="${L.hair}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (t.includes('h')) {
    const c = L.hatC;
    if (L.hat === 'top') hat = `<rect x="35" y="2" width="30" height="22" rx="2" fill="${c}"/><rect x="35" y="18" width="30" height="4" fill="#7a1b22"/><rect x="26" y="23" width="48" height="5" rx="2.5" fill="${c}"/>`;
    else if (L.hat === 'cap') hat = `<path d="M30 30 Q30 13 50 13 Q70 13 70 30 Z" fill="${c}"/><path d="M50 28 L80 30 Q78 34 50 32 Z" fill="${c}"/>`;
    else if (L.hat === 'sun') hat = `<ellipse cx="50" cy="26" rx="34" ry="7" fill="${c}"/><path d="M34 26 Q34 10 50 10 Q66 10 66 26 Z" fill="${c}"/><circle cx="62" cy="19" r="4" fill="#f2b54a"/>`;
    else if (L.hat === 'chef') hat = `<path d="M33 26 Q24 14 36 10 Q40 2 50 6 Q60 2 64 10 Q76 14 67 26 Z" fill="${c}"/><rect x="34" y="22" width="32" height="7" fill="#e2ddd2"/>`;
    else if (L.hat === 'captain') hat = `<path d="M28 24 Q30 12 50 12 Q70 12 72 24 Z" fill="${c}"/><rect x="29" y="22" width="42" height="6" rx="2" fill="#0e1626"/><circle cx="50" cy="18" r="3" fill="#f2b54a"/>`;
    else if (L.hat === 'beanie') hat = `<path d="M29 31 Q29 10 50 10 Q71 10 71 31 Z" fill="${c}"/><rect x="28" y="26" width="44" height="7" rx="3" fill="#f4f1ea" opacity=".85"/><circle cx="50" cy="8" r="5" fill="#f4f1ea"/>`;
    else if (L.hat === 'beret') hat = `<ellipse cx="46" cy="22" rx="24" ry="9" fill="${c}"/><circle cx="46" cy="13" r="2.5" fill="${c}"/>`;
    else if (L.hat === 'tricorn') hat = `<path d="M22 26 Q50 4 78 26 Q64 20 50 24 Q36 20 22 26 Z" fill="${c}"/><path d="M30 22 Q50 8 70 22" stroke="#d8b060" stroke-width="2" fill="none"/><circle cx="50" cy="16" r="3" fill="#f4f1ea"/>`;
    else if (L.hat === 'elf') hat = `<path d="M29 30 Q34 12 52 10 Q70 4 84 18 Q70 14 68 30 Z" fill="${c}"/><rect x="28" y="26" width="42" height="6" rx="3" fill="#f4f1ea"/><circle cx="85" cy="19" r="4.5" fill="#f4f1ea"/>`;
  }
  if (L.beard) extra += `<path d="M33 46 Q35 70 50 70 Q65 70 67 46 Q60 58 50 58 Q40 58 33 46 Z" fill="${L.hair}"/>`;
  if (t.includes('m')) extra += `<path d="M40 52 Q45 48 50 51 Q55 48 60 52 Q55 55 50 53 Q45 55 40 52 Z" fill="${L.beard ? '#cfc8bb' : L.hair}"/>`;
  if (t.includes('g')) extra += `<g fill="none" stroke="#e8d7a8" stroke-width="2"><circle cx="42" cy="42" r="6"/><circle cx="58" cy="42" r="6"/><path d="M48 42 L52 42"/></g>`;
  const scarf = t.includes('s') ? `<path d="M30 72 Q50 82 70 72 L70 80 Q50 90 30 80 Z" fill="${L.scarfC}"/><path d="M58 78 L64 96 L56 96 Z" fill="${L.scarfC}"/>` : '';
  return `<svg width="${z}" height="${z}" viewBox="0 0 100 100" role="img" aria-label="${esc(p.name)}"><circle cx="50" cy="50" r="49" fill="#2c2118" stroke="#4a3626"/>
    <path d="M14 100 Q16 74 50 72 Q84 74 86 100 Z" fill="${coat}"/><rect x="44" y="58" width="12" height="14" fill="${L.skin}"/>
    ${hair}<ellipse cx="50" cy="44" rx="19" ry="21" fill="${L.skin}"/>${L.fem || L.bun ? `<path d="M31 38 Q34 22 50 22 Q66 22 69 38 Q62 28 50 29 Q38 28 31 38 Z" fill="${L.hair}"/>` : ''}
    <circle cx="42" cy="42" r="2.2" fill="#1b120c"/><circle cx="58" cy="42" r="2.2" fill="#1b120c"/><path d="M44 57 L56 57" stroke="#6a3b2a" stroke-width="2" stroke-linecap="round"/>
    ${extra}${scarf}${hat}</svg>`;
}
function manorArt() {
  return `<svg class="manor" viewBox="0 0 320 170" aria-hidden="true">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c2e"/><stop offset="1" stop-color="#15100c"/></linearGradient></defs>
  <rect width="320" height="170" fill="url(#sky)" rx="14"/>
  <circle cx="258" cy="36" r="18" fill="#efe3c2" opacity=".9"/><circle cx="266" cy="31" r="16" fill="#2a1c2e"/>
  <path d="M0 150 Q80 138 160 146 Q240 154 320 142 L320 170 L0 170 Z" fill="#0c0806"/>
  <g fill="#0f0a08"><rect x="70" y="70" width="180" height="80"/><polygon points="62,72 160,30 258,72"/><rect x="140" y="20" width="40" height="70"/><polygon points="134,22 160,0 186,22"/>
    <rect x="40" y="88" width="40" height="62"/><polygon points="34,90 60,66 86,90"/><rect x="240" y="88" width="40" height="62"/><polygon points="234,90 260,66 286,90"/></g>
  <circle cx="160" cy="44" r="9" fill="#f2b54a" opacity=".85"/><path d="M160 38 L160 44 L164 47" stroke="#3a2616" stroke-width="2" fill="none"/>
  <g fill="#f2b54a"><rect x="88" y="86" width="14" height="18" rx="2" opacity=".9"/><rect x="118" y="86" width="14" height="18" rx="2" opacity=".35"/><rect x="188" y="86" width="14" height="18" rx="2" opacity=".75"/>
  <rect x="218" y="86" width="14" height="18" rx="2" opacity=".3"/><rect x="88" y="118" width="14" height="18" rx="2" opacity=".4"/><rect x="218" y="118" width="14" height="18" rx="2" opacity=".85"/>
  <rect x="52" y="104" width="12" height="16" rx="2" opacity=".6"/><rect x="256" y="104" width="12" height="16" rx="2" opacity=".5"/></g>
  <path d="M150 150 L150 124 Q160 114 170 124 L170 150 Z" fill="#3a2616"/></svg>`;
}
function candle(left, total) {
  const f = total ? Math.max(0, left) / total : 0, h = 8 + 40 * f, y = 60 - h;
  return `<svg class="candle" viewBox="0 0 34 64" aria-label="${left} searches left"><ellipse cx="17" cy="61" rx="15" ry="3" fill="#3a2616"/>
    <rect x="9" y="${y}" width="16" height="${h}" rx="3" fill="#efe2c6"/><rect x="9" y="${y}" width="5" height="${h}" rx="2" fill="#fff6e4" opacity=".6"/><path d="M17 ${y} L17 ${y - 4}" stroke="#222" stroke-width="1.5"/>
    ${left > 0 ? `<g class="flame"><path d="M17 ${y - 18} Q24 ${y - 8} 17 ${y - 3} Q10 ${y - 8} 17 ${y - 18} Z" fill="#f2b54a"/><path d="M17 ${y - 12} Q20 ${y - 7} 17 ${y - 4} Q14 ${y - 7} 17 ${y - 12} Z" fill="#fff3c4"/></g>` : `<path d="M17 ${y - 6} q3 -6 -1 -12 q5 4 2 12" stroke="#777" fill="none" opacity=".6"/>`}</svg>`;
}
function qrSvg(text) {
  try {
    const q = qrcode(0, 'M'); q.addData(text); q.make(); const n = q.getModuleCount(); let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += 'M' + x + ' ' + y + 'h1v1h-1z';
    return `<svg class="qr" viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="QR code"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  } catch (e) { return ''; }
}
const starRow = (k, max) => '⭐'.repeat(k) + '<span class="dim">' + '☆'.repeat((max || 3) - k) + '</span>';

// ---------- sound (made on the device, nothing downloaded) ----------
let AC = null, rainNode = null;
function noiseBuf(sec) { const b = AC.createBuffer(1, AC.sampleRate * sec, AC.sampleRate), d = b.getChannelData(0); for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1; return b; }
function soundOn() {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    if (rainNode) return;
    const src = AC.createBufferSource(); src.buffer = noiseBuf(3); src.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    const g = AC.createGain(); g.gain.value = 0.045; src.connect(lp).connect(g).connect(AC.destination); src.start(); rainNode = { src, g };
  } catch (e) {}
}
function soundOff() { if (rainNode) { try { rainNode.src.stop(); } catch (e) {} rainNode = null; } }
function thunder() {
  if (!D.settings.sound || !AC) return;
  try { const src = AC.createBufferSource(); src.buffer = noiseBuf(4); const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const g = AC.createGain(), t = AC.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    src.connect(lp).connect(g).connect(AC.destination); src.start(); src.stop(t + 4); } catch (e) {}
}
function chime(ok) {
  if (!D.settings.sound || !AC) return;
  try { (ok ? [523, 659, 784, 1046] : [330, 262]).forEach((f, k) => { const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + k * 0.16; o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.7); }); } catch (e) {}
}
let nextFlash = Date.now() + 9000;
setInterval(() => {
  if (document.hidden || !['intro', 'game'].includes(V.screen) || Date.now() < nextFlash) return;
  nextFlash = Date.now() + 25000 + Math.random() * 35000;
  const f = document.getElementById('flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  setTimeout(thunder, 500 + Math.random() * 1200);
}, 1000);
function say(text) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.92; speechSynthesis.speak(u); } catch (e) {} }

// ---------- helpers ----------
const roomName = r => CS.rooms[r].name, itemName = i => CS.items[i].name;
const isJuniorSeat = () => { const c = curCase(); return c && c.seat >= 0 && c.seat < CS.juniors; };
function myClues() { const c = curCase(); if (!c || c.seat < 0) return []; return CS.piles[c.seat].slice(0, CS.start + c.found); }
function left() { return CS.rounds - curCase().found; }
function unlocked(p, t, lvl) { return lvl === 0 || p.prog[M.THEMES[t].key][lvl - 1] > 0; }
function themeStars(p, t) { return p.prog[M.THEMES[t].key].reduce((a, b) => a + b, 0); }
function levelBlurb(l) { const L = M.LEVELS[l]; return `${L.n} suspects`; }
const diffTag = d => d >= 0 ? `${M.DIFFS[d].e} ${esc(M.DIFFS[d].name)}` : '';
function clueCard(cl, idx, src, fresh, extra) {
  const c = curCase(), hint = c.help ? M.hintText(cl, CS) : '';
  return `<div class="clue${fresh ? ' new' : ''}${isJuniorSeat() ? ' big' : ''}">${src ? `<div class="src">${esc(src)}</div>` : ''}<div>${esc(M.clueText(cl, CS))}</div>${hint ? `<div class="hint">💡 ${esc(hint)}</div>` : ''}
    <button class="say" data-a="say" data-v="${idx}" aria-label="Read aloud">🔊</button>${extra || ''}</div>`;
}
const notes = () => isLive() ? teamState().note : curCase().note;
function notesPanel() {
  if (V.nbHide) return `<div class="cn-nb hid"><button class="nbshow" data-a="nbhide">📓 Show notes</button></div>`;
  const n = CS.n, where = V.nb === 'where', key = where ? 'sr' : 'si', cols = where ? CS.rooms : CS.items, N = notes();
  let h = `<div class="cn-nb"><div class="nbbar"><div class="seg sm"><button class="${where ? 'on' : ''}" data-a="nb" data-v="where">📍 Where</button><button class="${where ? '' : 'on'}" data-a="nb" data-v="what">🧰 What</button></div><button class="nbhide" data-a="nbhide" aria-label="Hide notes">Hide ▲</button></div>
    <table class="nb sm"><tr><th class="nm">${isLive() ? '<span class="small">👥 shared</span>' : ''}</th>${cols.map(x => `<th title="${esc(x.name)}"><span class="e">${x.e}</span>${esc(x.name.replace(/'s$/, '').split(' ').pop())}</th>`).join('')}<th><span class="e">🕵️</span>Thief?</th></tr>`;
  CS.sus.forEach((p, s) => {
    const words = p.name.split(' '), short = words.length > 1 ? words[words.length - 1] : p.name;
    h += `<tr><td class="nm">${portrait(p, 24)}<span>${esc(short)}</span></td>`;
    for (let x = 0; x < n; x++) { const v = N[key][s * n + x]; h += `<td class="c ${v === 1 ? 'x' : v === 2 ? 'y' : ''}" data-a="cell" data-v="${key}:${s * n + x}">${v === 1 ? '✗' : v === 2 ? '✓' : ''}</td>`; }
    const tv = N.t[s]; h += `<td class="c thf ${tv === 1 ? 'x' : tv === 2 ? 'q' : ''}" data-a="cell" data-v="t:${s}">${tv === 1 ? '✗' : tv === 2 ? '❓' : ''}</td></tr>`;
  });
  return h + `</table></div>`;
}
function notesHelp() {
  return `<p class="muted small center">📓 Notes: tap a box for ✗ "no", again for ✓ "yes", again to clear. Thief column: ✗ not the thief, ❓ suspicious.${isLive() ? ' Everyone on the team sees the same notes, so split up the work.' : ''}<br>Remember: one suspect per room, one thing per suspect.</p>
    <button class="btn ghost" data-a="clearnb">Clear the notes</button>`;
}
function topBar() {
  const c = curCase(), b = M.BADGES[c.seat];
  return `<div class="top">${candle(left(), CS.rounds)}<div class="t"><h2>${esc(CS.crime.title)}</h2>
    ${isLive() ? `<div class="liveline">${livePill()} ${voicePill()}</div>` : ''}<div class="muted small">${b.e} ${esc(b.name)}${isJuniorSeat() ? ' (junior)' : ''} · ${left() > 0 ? `${left()} search${left() === 1 ? '' : 'es'} left` : 'candle is out'}</div></div>
    <button class="iconbtn" data-a="sound" aria-label="Sound">${D.settings.sound ? '🔊' : '🔈'}</button><button class="iconbtn" data-a="home" aria-label="Home">🏠</button></div>`;
}
// ---------- live table (phones in different houses stay at the same pace; see live.js) ----------
const L = window.ManorLive, VC = window.ManorVoice;
const LIVE_SCREENS = ['code', 'badge', 'intro', 'game', 'result'];
const isLive = () => !!(CS && CS.players > 1 && L);
const myDev = () => L.dev() + '_' + me().id;
function whoAmI() { const p = me(), c = curCase(); return { dev: myDev(), seat: c ? c.seat : -1, name: p.name, av: p.av }; }
const AWAY_MS = 45000;
function online(dev) { if (dev === myDev()) return L.status() === 'live'; const h = L.here().find(x => x.dev === dev); return !!h && L.serverNow() - h.t < AWAY_MS; }
function range(n) { return Array.from({ length: n }, (_, i) => i); }
// everything the family has done in this case, worked out the same way on every phone from the shared log
function teamState() {
  const P = CS.players, evs = L.events(CS.code);
  const owner = Array(P).fill(null), searches = Array.from({ length: P }, () => ({})), skip = Array(P).fill(-1), feed = [], guesses = [], shared = {}, names = {};
  let done = 0, donePending = false;
  const nn = CS.n, note = { sr: Array(nn * nn).fill(0), si: Array(nn * nn).fill(0), t: Array(nn).fill(0) }, NK = ['sr', 'si', 't'];
  const ok = (v, hi) => Number.isInteger(v) && v >= 0 && v < hi;
  for (const e of evs) {
    const s = e.seat;
    if (e.k === 'seat') {
      if (!ok(s, P)) continue;
      names[e.dev] = { name: e.name || '?', av: e.av || '🕵️' };
      if (owner[s] && owner[s].dev !== e.dev && !e.take) continue;          // badge already taken
      for (let k = 0; k < P; k++) if (owner[k] && owner[k].dev === e.dev) owner[k] = null;   // moved badges
      owner[s] = { dev: e.dev, name: names[e.dev].name, av: names[e.dev].av };
    } else if (e.k === 'search') {
      if (!ok(s, P) || !owner[s] || owner[s].dev !== e.dev || !ok(e.round, CS.rounds) || !ok(e.room, CS.n) || searches[s][e.round] !== undefined) continue;
      searches[s][e.round] = e.room; feed.push({ k: 'found', seat: s, round: e.round, room: e.room, dev: e.dev, eid: e.eid });
    } else if (e.k === 'share') {
      if (!ok(s, P) || !owner[s] || owner[s].dev !== e.dev || !ok(e.idx, CS.start) || shared[s + ':' + e.idx]) continue;
      shared[s + ':' + e.idx] = 1; feed.push({ k: 'share', seat: s, idx: e.idx, dev: e.dev, eid: e.eid });
    } else if (e.k === 'skip') {
      if (ok(s, P) && ok(e.round, 7)) skip[s] = Math.max(skip[s], e.round);
    } else if (e.k === 'acc') {
      // two accusations at the same moment: the first one counts
      if (done || e.n !== guesses.length || guesses.length >= CS.tries || !ok(e.s, CS.n) || !ok(e.r, CS.n) || !ok(e.i, CS.n)) continue;
      const t = CS.thief, right = (e.s === t) + (e.r === CS.roomOf[t]) + (e.i === CS.itemOf[t]);
      guesses.push({ s: e.s, r: e.r, i: e.i, right }); feed.push({ k: 'acc', seat: s, s: e.s, r: e.r, i: e.i, right, dev: e.dev, eid: e.eid });
      if (right === 3) done = 1; else if (guesses.length >= CS.tries) done = 2;
      if (done) donePending = !!e.pending;
    } else if (e.k === 'note') {
      if (e.clear) { note.sr.fill(0); note.si.fill(0); note.t.fill(0); continue; }
      const arr = note[NK[e.g]]; if (arr && ok(e.x, arr.length) && ok(e.v, 3)) arr[e.x] = e.v;
    } else if (e.k === 'give') {
      if (!done) { done = 2; donePending = !!e.pending; feed.push({ k: 'give', seat: s, dev: e.dev, eid: e.eid }); }
    }
  }
  const found = searches.map(o => Object.keys(o).length);
  return { owner, searches, found, skip, feed, guesses, done, donePending, names, note };
}
const nameOf = (T, f) => { const n = T.names[f.dev]; return n ? n.name : 'Someone'; };
const badgeOf = s => M.BADGES[s] ? M.BADGES[s].e : '🕵️';
// detectives this phone waits for before its next search (away or offline players never hold anyone up)
function waitingFor(T) {
  const c = curCase(); if (!isLive() || L.status() !== 'live' || !c || c.seat < 0) return [];
  return range(CS.players).filter(s => s !== c.seat && T.owner[s] && T.found[s] < c.found && T.skip[s] < c.found && online(T.owner[s].dev));
}
let liveSeen = { code: null, eids: new Set() }, liveSig = '';
function finishCase(c, done, n) {
  const p = me();
  if (done === 1) {
    c.done = 1; c.stars = Math.max(1, 4 - n);
    const bk = p.best[CS.theme.key]; bk[CS.level] = Math.max(bk[CS.level], CS.diff); p.record.solved++; p.record.stars += c.stars;
    const pr = p.prog[CS.theme.key]; pr[CS.level] = Math.max(pr[CS.level], c.stars);
  } else c.done = 2;
  save();
}
// fold the shared log into this phone's copy of the case
function applyLive(quiet) {
  if (!isLive() || !me()) return;
  const c = curCase(); if (!c) return;
  const T = teamState(), meD = myDev();
  if (c.seat >= 0 && T.owner[c.seat] && T.owner[c.seat].dev !== meD) {
    const by = T.owner[c.seat].name; c.seat = -1; c.found = 0; c.searched = []; save();
    if (['game', 'intro'].includes(V.screen)) V.screen = 'badge';
    toast(`${by} has that badge now. Pick another one.`);
  }
  if (c.seat >= 0 && !c.done) {
    const mine = T.searches[c.seat], k = T.found[c.seat];
    if (k !== c.found && T.owner[c.seat]) { c.found = k; c.searched = range(k).map(r => mine[r] !== undefined ? mine[r] : 0); save(); }
  }
  if (!c.done) {
    const g = T.guesses.map(x => ({ s: x.s, r: x.r, i: x.i, right: x.right }));
    if (JSON.stringify(g) !== JSON.stringify(c.guesses)) { c.guesses = g; save(); }
    if (T.done && (!T.donePending || L.status() === 'offline')) { finishCase(c, T.done, T.guesses.length); if (V.screen === 'game') { if (!quiet) chime(T.done === 1); V.screen = 'result'; } }
  }
  // tell me what the others just did
  if (liveSeen.code !== CS.code) { liveSeen = { code: CS.code, eids: new Set(T.feed.map(f => f.eid)) }; return; }
  const fresh = T.feed.filter(f => !liveSeen.eids.has(f.eid)); fresh.forEach(f => liveSeen.eids.add(f.eid));
  const theirs = fresh.filter(f => f.dev !== meD);
  if (theirs.length && !quiet) {
    const f = theirs[theirs.length - 1], who = `${badgeOf(f.seat)} ${nameOf(T, f)}`;
    toast(f.k === 'found' ? `${who} found a clue in the ${roomName(f.room)}` : f.k === 'share' ? `${who} shared a clue` : f.k === 'give' ? `${who} gave up the case` : f.right === 3 ? `${who} solved it!` : `${who} accused ${CS.sus[f.s].name}: ${f.right} of 3 right`);
    if (f.k === 'found' || f.k === 'share') chime(true); else if (f.k === 'acc' && f.right < 3) chime(false);
  }
}
function onLive() {
  applyLive();
  if (VC) VC.tick(L.here(), L.serverNow());
  liveRefresh();
}
// redraw the case screens only when something the player can see has changed
function liveRefresh() {
  if (!CS || !LIVE_SCREENS.includes(V.screen)) return;
  const T = teamState();
  const sig = [L.status(), V.screen, curCase() && curCase().seat, T.owner.map(o => o ? o.dev + o.name : '-').join(), T.found.join(), T.guesses.length, T.feed.length, T.skip.join(),
    range(CS.players).map(s => T.owner[s] && online(T.owner[s].dev) ? 1 : 0).join(''), voiceSig(), L.pending(CS.code, myDev()) ? 1 : 0, T.donePending ? 1 : 0, T.note.sr.join('') + T.note.si.join('') + T.note.t.join('')].join('|');
  if (sig !== liveSig) { liveSig = sig; render(); }
}
let toastT = 0;
function toast(msg) { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3800); }
function voiceSig() { if (!VC) return ''; return [VC.isOn() ? 1 : 0, VC.isJoining() ? 1 : 0, VC.isMuted() ? 1 : 0, L.here().map(h => h.dev + ':' + (h.voice ? 1 : 0) + ':' + (VC.peerState(h.dev) || '')).join()].join('/'); }
function voicePill() {
  if (!isLive() || !VC || !VC.supported()) return '';
  if (VC.isJoining()) return `<button class="pill" data-a="voice">🎙️ Joining…</button>`;
  if (!VC.isOn()) return `<button class="pill" data-a="voice">🎙️ Voice</button>`;
  const n = VC.connectedCount();
  return `<button class="pill ${VC.isMuted() ? 'off' : 'ok'} vc" data-a="voice">${VC.isMuted() ? '🔇 Muted' : '🎙️ ' + (n ? n + ' talking' : 'On')}</button>`;
}
// who is in the voice call, and can I hear them
function voiceLine(dev) {
  if (!VC) return '';
  const h = L.here().find(x => x.dev === dev); if (!h || !h.voice) return '';
  if (dev === myDev()) return VC.isOn() ? (VC.isMuted() ? ' · 🔇 muted' : ' · 🎙️ in voice') : '';
  if (!VC.isOn()) return ' · 🎙️ in voice';
  const st = VC.peerState(dev);
  return st === 'connected' ? ' · 🔊 you can hear them' : st === 'lost' || st === 'failed' ? ' · 🎙️ reconnecting…' : ' · 🎙️ connecting…';
}
function livePill() {
  if (!isLive()) return '';
  const st = L.status(), pend = L.pending(CS.code, myDev());
  const [cls, txt] = st === 'live' ? ['ok', pend ? 'Sending…' : 'Live'] : st === 'trying' ? ['warn', 'Reconnecting…'] : ['off', 'No signal'];
  return `<button class="pill ${cls}" data-a="liveinfo"><i></i>${txt}</button>`;
}
function inviteText() { const c = CS.code; return `Join our Midnight at the Manor mystery! Open the game, tap Join a case and type ${c.slice(0, 3)} ${c.slice(3)}. Or tap this link: ${SITE}#join=${c}`; }

function profileChip() { const p = me(); return p ? `<button class="chip" data-a="who">${esc(p.av)} ${esc(p.name)} <span class="muted">· switch</span></button>` : ''; }

// ---------- screens ----------
const SCREENS = {
  home() {
    const p = me(); if (!p) return SCREENS.who();
    const c = curCase(), r = p.record, live = c && !c.done && c.seat >= 0;
    return `<div class="center">${profileChip()}</div>${manorArt()}<h1>Midnight at<br>the Manor</h1>
      <p class="center muted">A family mystery. Everyone gets secret clues. Solve it together before the candle burns out.</p>
      ${live ? `<button class="btn" data-a="resume">🕯️ Continue: ${esc(CS.crime.title)}</button>` : ''}
      <button class="btn${live ? ' ghost' : ''}" data-a="book">📖 Case book: start a case</button>
      <button class="btn ghost" data-a="join">🗝️ Join a case</button>
      <div class="row"><button class="btn ghost" data-a="how">📜 How to play</button><button class="btn ghost" data-a="share">📲 Share</button></div>
      <div class="card"><div class="toggle"><span>Rain &amp; thunder sounds</span><button class="${D.settings.sound ? 'on' : ''}" data-a="sound">${D.settings.sound ? 'On' : 'Off'}</button></div>
      <div class="muted small">${esc(p.name)}: ${r.solved} solved · ${r.stars} ⭐ · <a href="#" data-a="profile">profile &amp; backup</a></div></div>`;
  },
  who() {
    const list = Object.values(D.profiles).sort((a, b) => a.made - b.made);
    return `${manorArt()}<h1>Who's playing?</h1><p class="center muted">${V.pendingJoin ? `You were invited to case <b>${esc(V.pendingJoin)}</b>. Pick who you are first.` : 'Each detective keeps their own progress and stars on this device.'}</p>
      <div class="pick">${list.map(p => `<button class="opt${D.me === p.id ? ' on' : ''}" data-a="pickme" data-v="${p.id}"><span class="big">${esc(p.av)}</span><b>${esc(p.name)}</b><span class="small muted">${p.record.stars} ⭐${p.junior ? ' · junior' : ''}</span></button>`).join('')}
      <button class="opt" data-a="addprof"><span class="big">➕</span><b>New detective</b></button></div>
      <button class="btn ghost" data-a="restore">Restore from a backup code</button>`;
  },
  addprof() {
    const n = V.newProf;
    return `<h2>New detective</h2><div class="card"><label class="small muted" for="pname">Name</label>
      <input id="pname" class="text-in" maxlength="20" autocomplete="off" value="${esc(n.name)}" placeholder="e.g. Jude">
      <h3>Pick a picture</h3><div class="pick small-pick">${AVATARS.map(a => `<button class="opt${n.av === a ? ' on' : ''}" data-a="pav" data-v="${a}"><span class="big">${a}</span></button>`).join('')}</div>
      <div class="toggle"><span>🐣 Junior detective<br><span class="small muted">Gets the simpler clues, the clue helper and read-aloud.</span></span><button class="${n.junior ? 'on' : ''}" data-a="pjun">${n.junior ? 'Yes' : 'No'}</button></div>
      <div class="err">${esc(V.err)}</div></div>
      <button class="btn" data-a="saveprof">Save detective</button><button class="btn ghost" data-a="who">Back</button>`;
  },
  profile() {
    const p = me();
    const total = M.THEMES.reduce((a, T, t) => a + themeStars(p, t), 0);
    return `<h2>${esc(p.av)} ${esc(p.name)}</h2>
      <div class="card"><p>${p.record.solved} cases solved · ${total} of ${NTH * 30} case-book stars</p>
      <div class="toggle"><span>🐣 Junior detective</span><button class="${p.junior ? 'on' : ''}" data-a="togjun">${p.junior ? 'Yes' : 'No'}</button></div>
      <p class="small muted">Progress saves by itself after every move. It lives on this device only, so make a backup code now and then (or before getting a new device).</p></div>
      <button class="btn" data-a="backup">💾 Make a backup code</button>
      <button class="btn ghost" data-a="restore">Restore from a backup code</button>
      <button class="btn ghost" data-a="who">Switch detective</button>
      <button class="btn ghost red-text" data-a="delprof">Delete ${esc(p.name)}</button>
      <button class="btn ghost" data-a="home">Back</button>`;
  },
  how() {
    return `<h2>How to play</h2>
      <div class="card"><p><b>1.</b> One person opens the <b>Case book</b>, picks a place, a case and how hard (Easy, Medium, Hard or Very hard), and says how many detectives (and how many juniors) are playing. They get a 6-letter code.</p>
      <p><b>2.</b> Everyone else taps <b>Join a case</b> and types the code. Each person picks a different badge. <b>Junior detectives pick a 🐣 junior badge</b>: those get simpler clues.</p>
      <p><b>3.</b> Each device shows <b>secret clues</b> only that detective can see. Read them out, or keep one back for a dramatic moment.</p>
      <p><b>4.</b> Each round, everyone <b>searches a room</b> for one more clue. The candle burns down with each search.</p>
      <p><b>5.</b> Mark what you learn in the <b>Notebook</b>: ✗ for "no", ✓ for "yes".</p>
      <p><b>6.</b> When the team agrees, <b>everyone enters the team's answer</b> under Accuse: WHO took it, WHERE they hid it, WHAT they used. You get 3 tries (2 on Very hard); fewer tries, more stars. Solving a case on any difficulty unlocks the next one.</p></div>
      <div class="card"><h3>The golden rule</h3><p>Every suspect was in a <b>different room</b> and held a <b>different thing</b>. The thief hid the treasure in the room they were in, and used the thing they were holding.</p>
      <p class="muted small">Every clue is true. Nobody's clues alone are enough. Works with no internet.</p></div>
      <div class="card"><h3>📞 Playing with family far away</h3><p>Start a FaceTime or phone call, then tap <b>📨 Send the code</b> on the case code screen. When phones have a signal they play <b>live</b>: each round opens when everyone has searched, found clues appear on everyone's <b>👥 Team</b> page, and one accusation counts for the whole team.</p>
      <p class="small muted">If someone's signal drops, their game keeps working and catches up when it's back, and nobody is kept waiting for them.</p>
      <p>Tap <b>🎙️ Voice</b> at the top to talk with everyone right in the game (headphones work best). People in the same room should leave voice off.</p></div>
      <button class="btn" data-a="home">Got it</button>`;
  },
  share() {
    return `<h2 class="center">Get the game on another device</h2><div class="card center">${qrSvg(SITE)}
      <p>Point the camera at this code, tap the link, then in Safari tap <b>Share</b> → <b>Add to Home Screen</b>.</p><p class="small muted">${esc(SITE)}</p></div>
      <button class="btn ghost" data-a="home">Back</button>`;
  },
  book() {
    const p = me();
    return `<h2>📖 Case book</h2><p class="muted">Pick a place. Each has 10 cases that get harder. Solve one to unlock the next.</p>
      <div class="themes">${M.THEMES.map((T, t) => { const st = themeStars(p, t), solved = p.prog[T.key].filter(x => x > 0).length;
        return `<button class="theme" data-a="theme" data-v="${t}" style="--tc:${T.color}"><span class="te">${T.e}</span><b>${esc(T.name)}</b><span class="small muted">${solved}/10 solved · ${st} ⭐</span></button>`; }).join('')}</div>
      <button class="btn ghost" data-a="surprise">🎲 Surprise me</button><button class="btn ghost" data-a="home">Back</button>`;
  },
  levels() {
    const p = me(), T = M.THEMES[V.theme], pr = p.prog[T.key];
    return `<h2>${T.e} ${esc(T.name)}</h2><p class="muted small">${esc(T.intro)}</p>
      <div class="levels">${pr.map((s, l) => { const ok = unlocked(p, V.theme, l);
        return `<button class="lvl${ok ? '' : ' locked'}" data-a="level" data-v="${l}" ${ok ? '' : 'disabled'}><span class="ln">${ok ? l + 1 : '🔒'}</span><span class="small">${levelBlurb(l)}</span><span class="st">${starRow(s)}</span>${p.best[T.key][l] >= 0 ? `<span class="small">beat on ${diffTag(p.best[T.key][l])}</span>` : ''}</button>`; }).join('')}</div>
      <p class="small muted center">You choose Easy, Medium, Hard or Very hard when you start a case. Beating a case on any of them unlocks the next.</p>
      <button class="btn ghost" data-a="book">Back to the case book</button>`;
  },
  setup() {
    const d = V.draft, T = M.THEMES[V.theme];
    return `<h2>${T.e} Case ${d.level + 1}</h2><p class="muted">${esc(T.name)} · ${levelBlurb(d.level)}</p>
      <div class="card"><h3>How hard?</h3>${M.DIFFS.map((F, k) => `<button class="opt diffopt${d.diff === k ? ' on' : ''}" data-a="dd" data-v="${k}"><b>${F.e} ${esc(F.name)}</b><span class="small muted">${esc(F.blurb)}</span></button>`).join('')}
      <p class="small muted">Junior detectives always get simple clues, whatever you pick.</p></div>
      <div class="card"><h3>How many detectives?</h3><p class="muted small">Everyone playing on their own phone or iPad, including you.</p>
      <div class="pick">${[1, 2, 3, 4, 5, 6, 7, 8].map(k => `<button class="opt${d.players === k ? ' on' : ''}" data-a="dp" data-v="${k}"><span class="big">${k}</span><b>${k === 1 ? 'Just me' : k + ' players'}</b></button>`).join('')}</div></div>
      ${d.players ? `<div class="card"><h3>How many are junior detectives? 🐣</h3><p class="muted small">Juniors get simpler clues, with the helper and read-aloud. Grown-ups get the harder ones.</p>
      <div class="pick">${Array.from({ length: d.players + 1 }, (_, k) => `<button class="opt${d.juniors === k ? ' on' : ''}" data-a="dj" data-v="${k}"><span class="big">${k}</span><b>${k === 0 ? 'None' : k === d.players ? 'Everyone' : k + ' junior' + (k > 1 ? 's' : '')}</b></button>`).join('')}</div></div>` : ''}
      <button class="btn" data-a="create" ${d.players ? '' : 'disabled'}>Open the case file</button>
      <button class="btn ghost" data-a="theme" data-v="${V.theme}">Back</button>`;
  },
  code() {
    const code = CS.code;
    return `<h2 class="center">${esc(CS.crime.e)} ${esc(CS.crime.title)}</h2><p class="center muted">${CS.theme.e} ${esc(CS.theme.name)} · Case ${CS.level + 1} · ${diffTag(CS.diff)}</p>
      <div class="card center"><p>Case code</p><div class="code">${esc(code.slice(0, 3))} ${esc(code.slice(3))}</div>
      <p class="muted">${CS.players > 1 ? `Everyone else: tap <b>Join a case</b> and type this code.<br>${CS.players} detectives${CS.juniors ? `, ${CS.juniors} junior` : ''}.` : 'Playing solo.'}</p></div>
      ${CS.players > 1 ? `<p class="center">${livePill()} ${voicePill()}</p><button class="btn ghost" data-a="invite">📨 Send the code to family far away</button>
      <details class="card"><summary>Scan to join (same room)</summary><div class="center">${qrSvg(SITE + '#join=' + code)}<p class="small muted">Scanning opens the game in Safari. If they already have the app on their Home Screen, it is easier to open it and type the code.</p></div></details>` : ''}
      <button class="btn" data-a="tobadge">${CS.players > 1 ? 'Everyone has it, pick my badge' : 'Begin'}</button>`;
  },
  join() {
    return `<h2>Join a case</h2><div class="card"><p>Type the 6-letter code from the device that started the case.</p>
      <input id="codein" class="code-in" maxlength="8" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" value="${esc(V.joinCode)}" aria-label="Case code">
      <div class="err">${esc(V.err)}</div></div>
      <button class="btn" data-a="dojoin">Join</button><button class="btn ghost" data-a="home">Back</button>`;
  },
  badge() {
    const c = curCase(), p = me(), J = CS.juniors;
    return `<h2 class="center">${esc(CS.crime.title)}</h2><p class="center muted">${CS.theme.e} ${esc(CS.theme.name)} · Case ${CS.level + 1} · ${diffTag(CS.diff)}<br>
      Each detective picks a <b>different</b> badge.${J ? ` ${J === CS.players ? 'Every badge is a 🐣 junior badge.' : `The 🐣 badges are for junior detectives${p.junior ? ' (that\'s you!)' : ''}.`}` : ''}</p>
      ${(() => { const T = isLive() ? teamState() : null, meD = isLive() ? myDev() : '';
        return `<div class="pick">${M.BADGES.slice(0, CS.players).map((b, k) => { const o = T && T.owner[k], theirs = o && o.dev !== meD;
          return `<button class="opt${c.seat === k ? ' on' : ''}${theirs ? ' taken' : ''}${k < J && p.junior && c.seat < 0 && !theirs ? ' glow' : ''}" data-a="${theirs ? 'seattaken' : 'seat'}" data-v="${k}"><span class="big">${b.e}</span><b>${esc(b.name)}</b>${k < J ? '<span class="small">🐣 junior</span>' : ''}${o ? `<span class="small owner">${theirs ? esc(o.av) + ' ' + esc(o.name) : 'you'}</span>` : ''}</button>`; }).join('')}</div>
        ${T ? `<p class="center small muted">${livePill()} ${voicePill()} ${T.owner.filter(Boolean).length} of ${CS.players} detectives have joined.</p>` : ''}`; })()}
      <button class="btn" data-a="tointro" ${c.seat >= 0 ? '' : 'disabled'}>Enter</button>`;
  },
  intro() {
    const cr = CS.crime;
    return `<h2 class="center">${esc(cr.e)} ${esc(cr.title)}</h2>
      <div class="card"><p>${esc(CS.theme.intro)}</p><p>When the lights come back, <b>${esc(cr.what)}</b> is gone from ${esc(cr.from)}!</p>
      <p>${CS.n} suspects were there. Each was in a <b>different room</b>, holding a <b>different thing</b>. One of them is the thief.</p>
      <p>Find out <b>WHO</b> took it, <b>WHERE</b> they hid it (the room they were in), and <b>WHAT</b> they used (the thing they were holding).</p>
      <p class="muted">${diffTag(CS.diff)}. Your candle lasts ${CS.rounds} searches, and you get ${CS.tries} accusations.</p></div>
      <div class="card"><h3>The suspects</h3>${CS.sus.map(p => `<div class="who">${portrait(p, 52)}<div><b>${esc(p.name)}</b><div class="muted small">${esc(p.role)}</div></div></div>`).join('')}</div>
      <button class="btn" data-a="start">Open my secret clues</button>`;
  },
  game() { return topBar() + TABS[V.tab](); },
  result() {
    const c = curCase(), st = M.storyText(CS), won = c.done === 1, nextOk = won && CS.level < 9;
    return `<h2 class="center">${won ? 'Case closed!' : c.guesses.length >= CS.tries && c.guesses.every(g => g.right < 3) ? 'The thief got away...' : 'Here is what really happened'}</h2>
      ${won ? `<div class="stars reveal">${starRow(c.stars)}</div>` : ''}
      <div class="card reveal center">${portrait(st.who, 120)}<h3>${esc(st.lines[0])}</h3></div>
      <div class="card">${st.lines.slice(1).map(l => `<p>${esc(l)}</p>`).join('')}<p class="muted small">${st.room.e} ${esc(st.room.name)} · ${st.item.e} the ${esc(st.item.name)}</p></div>
      ${won ? `<p class="center muted">Solved on ${diffTag(CS.diff)} in ${c.guesses.length} ${c.guesses.length === 1 ? 'try' : 'tries'}${left() > 0 ? ` with ${left()} search${left() === 1 ? '' : 'es'} of candle to spare` : ''}.${nextOk ? ` Case ${CS.level + 2} is unlocked!` : ''}</p>` : ''}
      ${nextOk ? `<button class="btn" data-a="nextcase">Next case: ${CS.theme.e} Case ${CS.level + 2}</button>` : ''}
      <button class="btn${nextOk ? ' ghost' : ''}" data-a="book">Case book</button><button class="btn ghost" data-a="tab" data-v="clues">Look back at my clues</button><button class="btn ghost" data-a="home">Home</button>`;
  },
};
const TABS = {
  clues() {
    const c = curCase(), mine = myClues();
    let h = notesPanel() + `<div class="toggle"><span class="small">💡 Clue helper (explains what each clue means)</span><button class="${c.help ? 'on' : ''}" data-a="help">${c.help ? 'On' : 'Off'}</button></div><h3>Your secret starting clues</h3>`;
    const T = isLive() ? teamState() : null;
    if (T) h += `<p class="small muted">📣 Share a starting clue to put it on everyone's Team page. Clues you find are shared by themselves.</p>`;
    mine.slice(0, CS.start).forEach((cl, k) => { h += clueCard(cl, k, '', false, T ? (T.feed.some(f => f.k === 'share' && f.seat === c.seat && f.idx === k) ? '<span class="shared">📣 shared</span>' : `<button class="sharebtn" data-a="shareclue" data-v="${k}">📣 Share</button>`) : ''); });
    if (mine.length > CS.start) h += `<h3>Clues you found</h3>`;
    for (let k = mine.length - 1; k >= CS.start; k--) { const f = k - CS.start, r = c.searched[f]; h += clueCard(mine[k], k, (r >= 0 && r < CS.n ? CS.rooms[r].e + ' ' + CS.rooms[r].name + ': ' : '') + CS.finds[CS.flavor[c.seat][f % CS.finds.length]], V.fresh === k); }
    if (!c.done) h += left() > 0 ? `<button class="btn" data-a="tab" data-v="search">🔦 Search a room (${left()} left)</button>` : `<button class="btn red" data-a="tab" data-v="accuse">The candle is out: make the accusation</button>`;
    V.fresh = -1; return h + notesHelp();
  },
  search() {
    const c = curCase(), Z = CS.theme.zone, F = CS.theme.flag;
    if (V.searching >= 0) return `<div class="search-anim"><div class="glass">🔍</div><p>Searching the ${esc(roomName(V.searching))}...</p></div>`;
    if (c.done) return `<div class="card center"><p>This case is closed.</p></div>`;
    if (left() <= 0) return `<div class="card center"><p>🕯️ Your candle has burned out. No more searching!</p><p class="muted">Talk it over with the team, then make the accusation.</p></div><button class="btn red" data-a="tab" data-v="accuse">Make the accusation</button>`;
    const all = c.searched.length >= CS.n;
    if (isLive()) {
      const T = teamState(), w = waitingFor(T);
      if (w.length) return `<div class="card center wait"><div class="big">⏳</div><p>Waiting for ${w.map(s => `${badgeOf(s)} <b>${esc(T.owner[s].name)}</b>`).join(', ')} to search in round ${c.found}.</p>
        <p class="muted small">Talk over your clues while you wait. Their clue will pop up on the Team page.</p></div>
        <button class="btn ghost" data-a="tab" data-v="team">👥 See the team</button><button class="btn ghost small" data-a="nowait">Don't wait for them</button>`;
    }
    let h = `<p class="center">Round <b>${c.found + 1}</b> of ${CS.rounds}. Pick a room to search.${CS.players > 1 ? `<br><span class="muted small">${isLive() && L.status() === 'live' ? 'Everyone searches once, then the next round opens.' : 'Everyone searches once, then share what you found.'}</span>` : ''}</p>`;
    for (const up of [1, 0]) {
      h += `<div class="floor">${esc(up ? Z.up : Z.down)}</div><div class="pick">`;
      CS.rooms.forEach((r, k) => { if (!!r.up !== !!up) return; const done = c.searched.includes(k) && !all;
        h += `<button class="opt${done ? ' done' : ''}" data-a="searchroom" data-v="${k}" ${done ? 'disabled' : ''}><span class="big">${r.e}</span><b>${esc(r.name)}</b>${r.flag ? `<span class="small">${F.icon} ${esc(F.label)}</span>` : ''}${done ? '<span class="small muted">searched</span>' : ''}</button>`; });
      h += `</div>`;
    }
    return h;
  },
  notebook() {
    const c = curCase(), n = CS.n, where = V.nb === 'where', key = where ? 'sr' : 'si', cols = where ? CS.rooms : CS.items;
    let h = `<div class="seg"><button class="${where ? 'on' : ''}" data-a="nb" data-v="where">Where (rooms)</button><button class="${where ? '' : 'on'}" data-a="nb" data-v="what">What (things)</button></div>
      <table class="nb"><tr><th class="nm"></th>${cols.map(x => `<th title="${esc(x.name)}"><span class="e">${x.e}</span>${esc(x.name.replace(/'s$/, '').split(' ').pop())}</th>`).join('')}<th><span class="e">🕵️</span>Thief?</th></tr>`;
    CS.sus.forEach((p, s) => {
      const words = p.name.split(' '), short = words.length > 1 ? words[words.length - 1] : p.name;
      h += `<tr><td class="nm">${portrait(p, 30)}<span>${esc(short)}</span></td>`;
      for (let x = 0; x < n; x++) { const v = c.note[key][s * n + x]; h += `<td class="c ${v === 1 ? 'x' : v === 2 ? 'y' : ''}" data-a="cell" data-v="${key}:${s * n + x}">${v === 1 ? '✗' : v === 2 ? '✓' : ''}</td>`; }
      const tv = c.note.t[s]; h += `<td class="c thf ${tv === 1 ? 'x' : tv === 2 ? 'q' : ''}" data-a="cell" data-v="t:${s}">${tv === 1 ? '✗' : tv === 2 ? '❓' : ''}</td></tr>`;
    });
    return h + `</table><p class="muted small center">Tap a box: ✗ means "no", tap again for ✓ "yes", again to clear. In the thief column: ✗ not the thief, ❓ suspicious.<br>Remember: one suspect per room, one thing per suspect.</p>
      <button class="btn ghost" data-a="clearnb">Clear notebook</button>`;
  },
  file() {
    const cr = CS.crime, Z = CS.theme.zone, F = CS.theme.flag;
    return `<div class="card"><h3>${esc(cr.e)} The crime</h3><p><b>${esc(cr.what)}</b> vanished from ${esc(cr.from)} at midnight.</p>
      <p class="small">Every suspect was in a <b>different room</b> and held a <b>different thing</b>. The thief hid it in their room and used their thing.</p></div>
      <div class="card"><h3>Suspects</h3>${CS.sus.map(p => `<div class="who">${portrait(p, 52)}<div><b>${esc(p.name)}</b><div class="muted small">${esc(p.role)}</div>${[...p.t].map(k => `<span class="tag">${esc(M.TRAITS[k].label)}</span>`).join('') || '<span class="tag">no hat, glasses, mustache or scarf</span>'}</div></div>`).join('')}</div>
      <div class="card"><h3>Rooms</h3>${CS.rooms.map(r => `<div class="who"><span style="font-size:28px">${r.e}</span><div><b>${esc(r.name)}</b><br><span class="tag">${esc(r.up ? Z.up : Z.down)}</span><span class="tag">${r.flag ? F.icon + ' ' + esc(F.label) : 'no ' + esc(F.label)}</span></div></div>`).join('')}</div>
      <div class="card"><h3>Things the suspects were holding</h3>${CS.items.map(it => `<div class="who"><span style="font-size:28px">${it.e}</span><div><b>${esc(it.name[0].toUpperCase() + it.name.slice(1))}</b><br>${[...it.t].map(k => `<span class="tag">${esc(M.TAGS[k].who)}</span>`).join('') || '<span class="tag">nothing special</span>'}</div></div>`).join('')}</div>`;
  },
  team() {
    const c = curCase(), T = teamState(), st = L.status(), meD = myDev();
    let h = notesPanel() + `<div class="card livecard ${st}">${st === 'live' ? '🟢 <b>Live.</b> Everyone\'s searches and shared clues show up here.' : st === 'trying' ? '🟡 <b>Reconnecting…</b> Keep playing: your moves are saved on this device and sent when the signal is back.' : '⚪ <b>No signal right now.</b> The game still works. Keep talking on your call; your moves are sent as soon as the signal is back.'}</div>`;
    h += `<h3>Detectives</h3><div class="team">`;
    for (let s = 0; s < CS.players; s++) {
      const o = T.owner[s], mineS = s === c.seat, on = o && online(o.dev), done = o ? T.found[s] : 0;
      h += `<div class="mate${mineS ? ' me' : ''}"><span class="b">${badgeOf(s)}</span><div><b>${o ? esc(o.av) + ' ' + esc(o.name) : '<span class="muted">waiting to join…</span>'}</b>${s < CS.juniors ? ' <span class="tag">🐣 junior</span>' : ''}
        <div class="small muted">${o ? `<span class="dot${on ? ' on' : ''}"></span>${on ? (mineS ? 'you' : 'here') : 'away'} · ${done} of ${CS.rounds} searches${!mineS && done >= c.found && done > 0 ? ' ✓' : ''}${esc(voiceLine(o.dev))}` : 'has not picked a badge yet'}</div></div></div>`;
    }
    h += `</div>`;
    if (VC && VC.supported()) h += VC.isOn() ? `<div class="row"><button class="btn ghost" data-a="vmute">${VC.isMuted() ? '🎙️ Unmute' : '🔇 Mute me'}</button><button class="btn ghost" data-a="vleave">Leave voice</button></div>`
      : `<button class="btn ghost" data-a="voice">🎙️ Talk with everyone (voice chat)</button>`;
    const feed = T.feed.filter(f => f.k === 'found' || f.k === 'share').slice().reverse();
    h += `<h3>Shared clues (${feed.length})</h3>`;
    if (!feed.length) h += `<p class="muted small">Nothing yet. Found clues and 📣 shared clues appear here for everyone.</p>`;
    for (const f of feed) {
      const k = f.k === 'found' ? CS.start + f.round : f.idx, cl = CS.piles[f.seat][k]; if (!cl) continue;
      const src = `${badgeOf(f.seat)} ${nameOf(T, f)}${f.dev === meD ? ' (you)' : ''} · ${f.k === 'found' ? 'found in the ' + roomName(f.room) : 'shared a starting clue'}`;
      h += `<div class="clue${isJuniorSeat() ? ' big' : ''}"><div class="src">${esc(src)}</div><div>${esc(M.clueText(cl, CS))}</div>${c.help ? `<div class="hint">💡 ${esc(M.hintText(cl, CS))}</div>` : ''}<button class="say" data-a="sayteam" data-v="${f.seat}:${k}" aria-label="Read aloud">🔊</button></div>`;
    }
    return h;
  },
  accuse() {
    const c = curCase(), a = V.acc;
    if (c.done) return `<div class="card center"><p>This case is closed.</p></div><button class="btn" data-a="showresult">See the ending</button>`;
    if (isLive() && teamState().donePending) return `<div class="card center wait"><div class="big">⏳</div><p>Sending the accusation to the team…</p><p class="muted small">The answer shows on every phone as soon as it arrives.</p></div>`;
    const tries = CS.tries - c.guesses.length;
    let h = isLive() ? `<p class="center">Agree as a team, then <b>one person</b> makes the accusation: it counts for everyone. <b>${tries}</b> team ${tries === 1 ? 'try' : 'tries'} left.</p>`
      : `<p class="center">Agree as a team, then <b>everyone</b> enters the same answer. <b>${tries}</b> ${tries === 1 ? 'try' : 'tries'} left.</p>`;
    if (c.guesses.length) h += `<div class="card center">Last try: <b>${c.guesses[c.guesses.length - 1].right} of 3</b> right. The thief is still loose!</div>`;
    h += `<h3>WHO took it?</h3><div class="pick">${CS.sus.map((p, s) => `<button class="opt${a.s === s ? ' on' : ''}" data-a="as" data-v="${s}">${portrait(p, 48)}<b>${esc(p.name)}</b></button>`).join('')}</div>`;
    h += `<h3>WHERE did they hide it?</h3><div class="pick">${CS.rooms.map((r, k) => `<button class="opt${a.r === k ? ' on' : ''}" data-a="ar" data-v="${k}"><span class="big">${r.e}</span><b>${esc(r.name)}</b></button>`).join('')}</div>`;
    h += `<h3>WHAT did they use?</h3><div class="pick">${CS.items.map((it, k) => `<button class="opt${a.i === k ? ' on' : ''}" data-a="ai" data-v="${k}"><span class="big">${it.e}</span><b>${esc(it.name)}</b></button>`).join('')}</div>`;
    return h + `<button class="btn red" data-a="accuse" ${a.s >= 0 && a.r >= 0 && a.i >= 0 ? '' : 'disabled'}>⚖️ Accuse!</button>
      <button class="btn ghost small" data-a="giveup">Give up and show the answer</button>`;
  },
};
const TABLIST = [['clues', '📜', 'Clues+Notes'], ['search', '🔦', 'Search'], ['team', '👥', 'Team'], ['file', '🗂️', 'File'], ['accuse', '⚖️', 'Accuse']];

function render() {
  if (!me() && !['who', 'addprof'].includes(V.screen)) V.screen = 'who';
  if (V.screen === 'game' && (!CS || !curCase() || curCase().seat < 0)) V.screen = CS && curCase() && isLive() ? 'badge' : 'home';
  if (V.screen === 'game' && V.tab === 'team' && !isLive()) V.tab = 'clues';
  if (L) { if (isLive() && me() && LIVE_SCREENS.includes(V.screen)) L.start(CS.code, whoAmI(), onLive); else { if (VC) VC.leave(); L.stop(); } }
  $app.innerHTML = SCREENS[V.screen]();
  const inGame = V.screen === 'game';
  $tabs.hidden = !inGame;
  if (inGame) $tabs.innerHTML = TABLIST.filter(([k]) => k !== 'team' || isLive()).map(([k, e, l]) => `<button class="${V.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}"><span>${e}</span>${l}</button>`).join('');
  const ci = document.getElementById('codein'); if (ci) { ci.addEventListener('input', () => { V.joinCode = ci.value; }); ci.addEventListener('keydown', e => { if (e.key === 'Enter') ACT.dojoin(); }); }
  const pn = document.getElementById('pname'); if (pn) pn.addEventListener('input', () => { V.newProf.name = pn.value; });
}
function go(screen) { V.screen = screen; V.err = ''; render(); window.scrollTo(0, 0); }
function modal(html) { $modal.innerHTML = `<div class="card">${html}</div>`; $modal.hidden = false; }
function closeModal() { $modal.hidden = true; $modal.innerHTML = ''; }

// ---------- backup codes ----------
function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
function b64d(s) { return decodeURIComponent(escape(atob(s))); }
function backupCode(p) { return 'MMB1.' + b64e(JSON.stringify(p)); }
function readBackup(txt) {
  const t = String(txt || '').replace(/\s+/g, ''); const i = t.indexOf('MMB1.'); if (i < 0) return null;
  try { return cleanProfile(JSON.parse(b64d(t.slice(i + 5)))); } catch (e) { return null; }
}
function mergeProfile(inc) {
  const old = D.profiles[inc.id] || Object.values(D.profiles).find(p => p.name.toLowerCase() === inc.name.toLowerCase());
  if (!old) { D.profiles[inc.id] = inc; return inc; }
  for (const k of Object.keys(old.prog)) { old.prog[k] = old.prog[k].map((v, j) => Math.max(v, inc.prog[k][j])); old.best[k] = old.best[k].map((v, j) => Math.max(v, inc.best[k][j])); }   // restoring never loses stars
  for (const r of ['solved', 'stars', 'played']) old.record[r] = Math.max(old.record[r], inc.record[r]);
  for (const [code, c] of Object.entries(inc.cases)) if (!old.cases[code]) old.cases[code] = c;
  return old;
}

// ---------- actions ----------
const ACT = {
  home() { closeModal(); go('home'); },
  how() { go('how'); }, share() { go('share'); }, book() { go('book'); },
  who() { closeModal(); go('who'); },
  pickme(v) { if (D.profiles[v]) { useProfile(v); if (!runPendingJoin()) go('home'); } },
  addprof() { V.newProf = { name: '', av: AVATARS[Object.keys(D.profiles).length % AVATARS.length], junior: 0 }; go('addprof'); setTimeout(() => { const i = document.getElementById('pname'); if (i) i.focus(); }, 50); },
  pav(v) { if (AVATARS.includes(v)) V.newProf.av = v; render(); },
  pjun() { V.newProf.junior = V.newProf.junior ? 0 : 1; render(); },
  saveprof() {
    const n = V.newProf, name = n.name.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20);
    if (!name) { V.err = 'Type a name first.'; render(); return; }
    if (Object.values(D.profiles).some(p => p.name.toLowerCase() === name.toLowerCase())) { V.err = 'There is already a detective with that name here.'; render(); return; }
    const p = cleanProfile({ id: newId(), name, av: n.av, junior: n.junior, made: Date.now() }); D.profiles[p.id] = p; useProfile(p.id); if (!runPendingJoin()) go('home');
  },
  profile() { go('profile'); },
  togjun() { const p = me(); p.junior = p.junior ? 0 : 1; save(); render(); },
  delprof() { const p = me(); modal(`<h3>Delete ${esc(p.name)}?</h3><p>Their stars and progress on this device will be gone for good (unless you have a backup code).</p><div class="row"><button class="btn ghost" data-a="close">Keep</button><button class="btn red" data-a="delyes">Delete</button></div>`); },
  delyes() { delete D.profiles[D.me]; D.me = null; CS = null; save(); closeModal(); go('who'); },
  backup() {
    const p = me();
    modal(`<h3>💾 Backup code for ${esc(p.name)}</h3><p class="small">Keep this somewhere safe (Notes, or a text to yourself). On any device, tap <b>Restore from a backup code</b> and paste it in.</p>
      <textarea class="text-in" rows="5" readonly id="bk">${esc(backupCode(p))}</textarea><div class="err" id="bkmsg"></div>
      <div class="row"><button class="btn ghost" data-a="close">Done</button><button class="btn" data-a="copybk">${navigator.share ? 'Share' : 'Copy'}</button></div>`);
  },
  copybk() {
    const t = document.getElementById('bk').value, msg = document.getElementById('bkmsg');
    if (navigator.share) { navigator.share({ title: 'Midnight at the Manor backup', text: t }).catch(() => {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { msg.textContent = 'Copied!'; }, () => { document.getElementById('bk').select(); msg.textContent = 'Selected: copy it now.'; });
  },
  restore() {
    modal(`<h3>Restore from a backup code</h3><p class="small">Paste the whole code (it starts with MMB1.). Nothing is lost: stars are only ever added.</p>
      <textarea class="text-in" rows="5" id="rs" placeholder="MMB1...."></textarea><div class="err" id="rsmsg"></div>
      <div class="row"><button class="btn ghost" data-a="close">Cancel</button><button class="btn" data-a="restoreyes">Restore</button></div>`);
  },
  restoreyes() {
    const p = readBackup(document.getElementById('rs').value);
    if (!p) { document.getElementById('rsmsg').textContent = 'That is not a backup code. Paste the whole thing, starting with MMB1.'; return; }
    const got = mergeProfile(p); useProfile(got.id); closeModal(); go('home');
  },
  join() { V.joinCode = ''; go('join'); setTimeout(() => { const i = document.getElementById('codein'); if (i) i.focus(); }, 50); },
  resume() { V.tab = 'clues'; go('game'); },
  theme(v) { const t = +v; if (!(t >= 0 && t < NTH)) return; V.theme = t; go('levels'); },
  level(v) { const l = +v; if (!(l >= 0 && l < 10) || !unlocked(me(), V.theme, l)) return; V.draft = { players: 0, juniors: 0, level: l, diff: V.draft.diff >= 0 ? V.draft.diff : 1 }; go('setup'); },
  surprise() {
    const p = me(), t = Math.floor(Math.random() * NTH), pr = p.prog[M.THEMES[t].key];
    let l = pr.findIndex(s => s === 0); if (l < 0) l = Math.floor(Math.random() * 10);
    V.theme = t; V.draft = { players: 0, juniors: 0, level: l, diff: V.draft.diff >= 0 ? V.draft.diff : 1 }; go('setup');
  },
  dp(v) { V.draft.players = +v; V.draft.juniors = Math.min(V.draft.juniors, +v); render(); },
  dj(v) { V.draft.juniors = Math.min(+v, V.draft.players); render(); },
  dd(v) { const k = +v; if (k >= 0 && k < M.DIFFS.length) V.draft.diff = k; render(); },
  async create(v, el) {
    const d = V.draft; if (!d.players || V.creating) return; const p = me();
    const mk = () => { let code; do { code = M.makeCode({ theme: V.theme, level: d.level, diff: d.diff, players: d.players, juniors: d.juniors }); } while (p.cases[code]); return code; };
    let code = mk();
    if (d.players > 1 && L) {      // make sure no other family is using this code today
      V.creating = 1; if (el) { el.disabled = true; el.textContent = 'Opening the case file…'; }
      for (let k = 0; k < 4; k++) { const busy = await L.peek(code, L.dev() + '_' + p.id); if (busy !== true) break; code = mk(); }
      V.creating = 0;
      if (V.screen !== 'setup') return;
    }
    openCase(code); go('code');
  },
  nextcase() { V.theme = CS.themeIdx; V.draft = { players: CS.players, juniors: CS.juniors, level: CS.level + 1, diff: CS.diff }; go('setup'); },
  dojoin() {
    const i = document.getElementById('codein'); const raw = i ? i.value : V.joinCode; const info = M.readCode(raw);
    if (info.error) {
      const clean = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '');
      let tried = ''; try { tried = sessionStorage.getItem('mmfix') || ''; } catch (e) {}
      if (info.kind === 'check' && navigator.onLine !== false && tried !== clean) {      // maybe this phone has an old version: fetch the new one and try again
        try { sessionStorage.setItem('mmfix', clean); } catch (e) {}
        V.joinCode = raw; V.screen = 'join'; V.err = 'Checking for a newer version of the game…'; render();
        const reload = () => location.replace(location.pathname + '?u=' + Date.now() + '#join=' + clean);
        (navigator.serviceWorker && navigator.serviceWorker.getRegistration ? navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {}) : Promise.resolve()).then(reload, reload);
        return;
      }
      V.joinCode = raw; V.screen = 'join'; V.err = info.error + (tried === clean ? ' (This phone already has the newest version.)' : ''); render(); return;
    }
    const old = me().cases[info.code];
    if (old && (old.done || Date.now() - old.at > 12 * 3600e3)) { delete me().cases[info.code]; if (me().cur === info.code) me().cur = null; if (L) L.forget(info.code); }
    openCase(info.code); const c = curCase();
    if (c.seat >= 0 && !c.done) { V.tab = 'clues'; go('game'); } else go(c.done ? 'result' : 'badge');
  },
  tobadge() { if (CS.players === 1) { ACT.seat('0'); go('intro'); } else go('badge'); },
  seat(v, el, take) {
    const c = curCase(), s = +v; if (!(s >= 0 && s < CS.players)) return;
    if (isLive()) { const o = teamState().owner[s]; if (o && o.dev !== myDev() && !take) return ACT.seattaken(v); }
    if (c.seat !== s) { c.found = 0; c.searched = []; }
    c.seat = s; if (s < CS.juniors) c.help = 1; save();
    if (isLive()) { const p = me(); L.send(CS.code, Object.assign({ k: 'seat', seat: s, name: p.name, av: p.av }, take ? { take: 1 } : {}), myDev()); L.setWho(whoAmI()); }
    if (V.screen === 'badge') render();
  },
  seattaken(v) {
    const o = teamState().owner[+v]; if (!o) return;
    modal(`<h3>${badgeOf(+v)} ${esc(M.BADGES[+v].name)} is taken</h3><p><b>${esc(o.av)} ${esc(o.name)}</b> picked this badge${online(o.dev) ? ' and is playing now' : ''}. Pick a different one.</p>
      <p class="small muted">Is it you on a new phone or iPad? Then you can take it back, and its searches come with it.</p>
      <div class="row"><button class="btn" data-a="close">Pick another</button><button class="btn ghost" data-a="seattake" data-v="${+v}">It's me, take it</button></div>`);
  },
  seattake(v) { closeModal(); ACT.seat(v, null, true); },
  voice() {
    if (!VC || !VC.supported()) { modal(`<h3>Voice chat</h3><p>This device can't do voice chat. Use a FaceTime or phone call instead.</p><button class="btn" data-a="close">OK</button>`); return; }
    if (VC.isJoining()) return;
    if (!VC.isOn()) {
      modal(`<h3>🎙️ Voice chat</h3><p>Talk with everyone in this case, wherever they are.</p>
        <p class="small muted">🎧 Headphones work best. Only for detectives in <b>different houses</b>: people in the same room should leave voice off, or it echoes.</p>
        <div class="err" id="vmsg"></div>
        <div class="row"><button class="btn ghost" data-a="close">Not now</button><button class="btn" data-a="vjoin">Join voice</button></div>`);
      return;
    }
    const T = teamState(), meD = myDev();
    const list = L.here().filter(h => h.voice && h.dev !== meD).map(h => { const s = T.owner.findIndex(o => o && o.dev === h.dev); return `<div>${s >= 0 ? badgeOf(s) : '🕵️'} <b>${esc(h.name || '?')}</b>${esc(voiceLine(h.dev))}</div>`; }).join('');
    modal(`<h3>🎙️ Voice chat</h3>${list || '<p class="muted">Nobody else has joined voice yet.</p>'}
      <p class="small muted">${VC.relay() ? 'Using the Cloudflare relay when a direct line is blocked.' : 'Direct connection between devices.'}</p>
      <div class="row"><button class="btn ghost" data-a="vmute">${VC.isMuted() ? '🎙️ Unmute' : '🔇 Mute me'}</button><button class="btn red" data-a="vleave">Leave voice</button></div>
      <button class="btn ghost" data-a="close">Close</button>`);
  },
  async vjoin() {
    const msg = document.getElementById('vmsg');
    try { await VC.join(myDev()); closeModal(); toast('You joined voice chat'); render(); }
    catch (e) {
      const t = e && e.message === 'denied' ? 'The microphone is blocked. On iPhone or iPad: open Settings, scroll to Safari, tap Microphone and pick Ask or Allow. Then try again.' : 'No microphone was found on this device.';
      if (msg) msg.textContent = t; else toast(t);
    }
  },
  vmute() { if (VC && VC.isOn()) { VC.mute(!VC.isMuted()); if (!$modal.hidden) ACT.voice(); render(); } },
  vleave() { if (VC) VC.leave(); closeModal(); toast('You left voice chat'); render(); },
  liveinfo() {
    const st = L.status(), pend = L.pending(CS.code, myDev());
    modal(`<h3>${st === 'live' ? '🟢 Live' : st === 'trying' ? '🟡 Reconnecting' : '⚪ No signal'}</h3>
      <p>Everyone's phone builds the same mystery from the code, so <b>the game never needs the internet</b> to work.</p>
      <p>When there is a signal, phones share searches, shared clues and accusations, and each round waits until everyone has searched. Anyone who drops out is not waited for, and catches up when they are back.</p>
      <p class="small muted">${pend ? `${pend} move${pend > 1 ? 's' : ''} waiting to be sent.` : 'Nothing waiting to be sent.'} Playing far apart? Stay on a FaceTime or phone call to talk it through.</p>
      <button class="btn" data-a="close">OK</button>`);
  },
  invite() {
    const t = inviteText();
    if (navigator.share) { navigator.share({ title: 'Midnight at the Manor', text: t }).catch(() => {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Invite copied. Paste it in a text.'), () => modal(`<h3>Send this</h3><textarea class="text-in" rows="4" readonly>${esc(t)}</textarea><button class="btn" data-a="close">Done</button>`));
  },
  shareclue(v) { const c = curCase(), k = +v; if (!isLive() || c.seat < 0 || !(k >= 0 && k < CS.start)) return; L.send(CS.code, { k: 'share', seat: c.seat, idx: k }, myDev()); applyLive(true); toast('Shared with the team'); render(); },
  sayteam(v) { const [s, k] = String(v).split(':').map(Number), cl = CS.piles[s] && CS.piles[s][k]; if (cl) say(M.clueText(cl, CS) + (curCase().help ? ' ' + M.hintText(cl, CS).replace(/✗/g, 'a cross') : '')); },
  nowait() {
    const T = teamState(), w = waitingFor(T); if (!w.length) { render(); return; }
    modal(`<h3>Go on without them?</h3><p>${w.map(s => `${badgeOf(s)} ${esc(T.owner[s].name)}`).join(', ')} can still search when they are ready.</p><div class="row"><button class="btn ghost" data-a="close">Keep waiting</button><button class="btn" data-a="nowaityes">Go on</button></div>`);
  },
  nowaityes() { closeModal(); const c = curCase(); for (const s of waitingFor(teamState())) L.send(CS.code, { k: 'skip', seat: s, round: c.found }, myDev()); applyLive(true); render(); },
  tointro() { if (curCase().seat >= 0) go('intro'); },
  start() { V.tab = 'clues'; go('game'); },
  tab(v) { if (!TABS[v]) return; V.tab = v; V.screen = 'game'; render(); window.scrollTo(0, 0); },
  help() { const c = curCase(); c.help = c.help ? 0 : 1; save(); render(); },
  say(v) { const cl = myClues()[+v]; if (!cl) return; say(M.clueText(cl, CS) + (curCase().help ? ' ' + M.hintText(cl, CS).replace(/✗/g, 'a cross') : '')); },
  sound() { D.settings.sound = D.settings.sound ? 0 : 1; save(); if (D.settings.sound) soundOn(); else soundOff(); render(); },
  searchroom(v) {
    const c = curCase(), r = +v; if (c.done || left() <= 0 || V.searching >= 0 || !(r >= 0 && r < CS.n)) return;
    if (isLive() && waitingFor(teamState()).length) { render(); return; }
    V.searching = r; render();
    setTimeout(() => { if (isLive()) L.send(CS.code, { k: 'search', seat: c.seat, round: c.found, room: r }, myDev()); c.searched.push(r); c.found++; save(); applyLive(true); V.searching = -1; V.fresh = CS.start + c.found - 1; V.tab = 'clues'; render(); window.scrollTo(0, 0); chime(true); }, 1300);
  },
  nb(v) { V.nb = v === 'what' ? 'what' : 'where'; render(); },
  nbhide() { V.nbHide = !V.nbHide; render(); },
  cell(v) {
    const [k, idx] = String(v).split(':'), i = +idx, N = notes(), arr = N[k], mine = curCase().note[k];
    if (!arr || !mine || !(i >= 0 && i < arr.length)) return;
    const nv = (arr[i] + 1) % 3; mine[i] = nv; save();
    if (isLive()) L.send(CS.code, { k: 'note', g: ['sr', 'si', 't'].indexOf(k), x: i, v: nv }, myDev());
    render();
  },
  clearnb() { modal(`<h3>Clear the notebook?</h3><p>All the ✗ and ✓ marks for this case will be wiped${isLive() ? ' for the whole team' : ''}.</p><div class="row"><button class="btn ghost" data-a="close">Keep them</button><button class="btn red" data-a="clearyes">Clear</button></div>`); },
  clearyes() { const c = curCase(), n = CS.n; c.note = { sr: Array(n * n).fill(0), si: Array(n * n).fill(0), t: Array(n).fill(0) }; save(); if (isLive()) L.send(CS.code, { k: 'note', clear: 1 }, myDev()); closeModal(); render(); },
  close() { closeModal(); },
  as(v) { V.acc.s = +v; render(); }, ar(v) { V.acc.r = +v; render(); }, ai(v) { V.acc.i = +v; render(); },
  accuse() {
    const a = V.acc; if (a.s < 0 || a.r < 0 || a.i < 0) return;
    modal(`<h3>Is the whole team agreed?</h3>${isLive() ? '<p class="small muted">This counts for everyone.</p>' : ''}<p>${portrait(CS.sus[a.s], 40)} <b>${esc(CS.sus[a.s].name)}</b>, hid it in the <b>${esc(roomName(a.r))}</b>, using the <b>${esc(itemName(a.i))}</b>.</p>
      <div class="row"><button class="btn ghost" data-a="close">Not yet</button><button class="btn red" data-a="accuseyes">Accuse!</button></div>`);
  },
  accuseyes() {
    closeModal(); const c = curCase(), a = V.acc, t = CS.thief;
    if (c.done || a.s < 0 || a.r < 0 || a.i < 0) return;
    if (isLive()) {
      L.send(CS.code, { k: 'acc', seat: Math.max(0, c.seat), s: a.s, r: a.r, i: a.i, n: teamState().guesses.length }, myDev()); V.acc = { s: -1, r: -1, i: -1 };
      applyLive(true);
      if (c.done) { chime(c.done === 1); go('result'); return; }
      if (!teamState().done) chime(false);
      render(); window.scrollTo(0, 0); return;
    }
    const right = (a.s === t) + (a.r === CS.roomOf[t]) + (a.i === CS.itemOf[t]);
    c.guesses.push({ s: a.s, r: a.r, i: a.i, right }); V.acc = { s: -1, r: -1, i: -1 };
    if (right === 3) { finishCase(c, 1, c.guesses.length); chime(true); go('result'); return; }
    chime(false);
    if (c.guesses.length >= CS.tries) { c.done = 2; save(); go('result'); return; }
    save(); render(); window.scrollTo(0, 0);
  },
  giveup() { modal(`<h3>Show the answer?</h3><p>The case ends with no stars${isLive() ? ' for the whole team' : ''}.</p><div class="row"><button class="btn ghost" data-a="close">Keep playing</button><button class="btn red" data-a="giveyes">Show it</button></div>`); },
  giveyes() { const c = curCase(); if (isLive() && !c.done) { L.send(CS.code, { k: 'give', seat: Math.max(0, c.seat) }, myDev()); applyLive(true); } c.done = 2; save(); closeModal(); go('result'); },
  showresult() { go('result'); },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.a]; if (f) { e.preventDefault(); f(el.dataset.v, el); }
});
$modal.addEventListener('click', e => { if (e.target === $modal) closeModal(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) soundOff(); else if (D.settings.sound && AC) soundOn(); });
document.addEventListener('pointerdown', () => { if (D.settings.sound && !rainNode) soundOn(); }, { passive: true });

if (VC) VC.onChange(() => { if (CS && LIVE_SCREENS.includes(V.screen)) liveRefresh(); });
V.screen = me() ? 'home' : 'who';
const hashJoin = (location.hash.match(/join=([A-Za-z]{6})/) || [])[1];
if (hashJoin) { V.pendingJoin = hashJoin.toUpperCase(); try { history.replaceState(null, '', location.pathname); } catch (e) {} }
function runPendingJoin() { if (!V.pendingJoin || !me()) return false; V.joinCode = V.pendingJoin; V.pendingJoin = ''; V.screen = 'join'; render(); ACT.dojoin(); return true; }
if (!runPendingJoin()) render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
