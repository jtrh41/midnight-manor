// Midnight at the Manor: screens. The mystery itself comes from engine.js (window.Manor).
(function () {
'use strict';
const M = window.Manor;
const KEY = 'manor1';
const $app = document.getElementById('app'), $tabs = document.getElementById('tabs'), $modal = document.getElementById('modal');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- saves ----------
function load() {
  let d; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
  if (!d || typeof d !== 'object') d = {};
  if (!d.cases || typeof d.cases !== 'object') d.cases = {};
  if (!d.settings || typeof d.settings !== 'object') d.settings = { sound: 0 };
  if (!d.record || typeof d.record !== 'object') d.record = { solved: 0, stars: 0, played: 0 };
  for (const [code, c] of Object.entries(d.cases)) { if (M.readCode(code).error || !c || typeof c !== 'object') delete d.cases[code]; }
  if (d.cur && !d.cases[d.cur]) d.cur = null;
  return d;
}
let D = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }

// ---------- view state ----------
const V = { screen: 'home', tab: 'clues', nb: 'where', draft: { players: 0, lvl: -1 }, joinCode: '', err: '', acc: { s: -1, r: -1, i: -1 }, fresh: -1, searching: -1 };
let CS = null;           // the built case for D.cur
function curCase() { return D.cur ? D.cases[D.cur] : null; }
function openCase(code) {
  CS = M.buildCase(code); D.cur = code;
  if (!D.cases[code]) {
    const n = CS.n;
    D.cases[code] = { seat: -1, found: 0, searched: [], note: { sr: Array(n * n).fill(0), si: Array(n * n).fill(0), t: Array(n).fill(0) }, guesses: [], done: 0, stars: 0, help: CS.lvl === 0 ? 1 : 0, at: Date.now() };
    D.record.played++;
  }
  const c = D.cases[code];   // repair anything odd in an old save
  if (!(c.seat >= -1 && c.seat < CS.players)) c.seat = -1;
  c.found = Math.max(0, Math.min(CS.rounds, c.found | 0));
  if (!Array.isArray(c.searched)) c.searched = [];
  if (!c.note || !Array.isArray(c.note.sr) || c.note.sr.length !== CS.n * CS.n) c.note = { sr: Array(CS.n * CS.n).fill(0), si: Array(CS.n * CS.n).fill(0), t: Array(CS.n).fill(0) };
  if (!Array.isArray(c.guesses)) c.guesses = [];
  save();
}
if (D.cur) { try { CS = M.buildCase(D.cur); openCase(D.cur); } catch (e) { D.cur = null; CS = null; } }

// ---------- art ----------
function portrait(p, size) {
  const L = p.look, t = p.t, z = size || 56;
  let hair = '', hat = '', extra = '';
  const coat = L.hatC && L.hat !== 'chef' && L.hat !== 'sun' ? L.hatC : (L.fem ? '#5b3550' : '#2f3a4a');
  if (L.fem) hair = `<path d="M28 44 Q27 18 50 17 Q73 18 72 44 L72 58 Q66 50 66 40 L34 40 Q34 50 28 58 Z" fill="${L.hair}"/>`;
  else if (L.wild) hair = `<path d="M29 40 L26 26 L35 31 L37 18 L45 27 L50 15 L55 27 L63 18 L65 31 L74 26 L71 40 Z" fill="${L.hair}"/>`;
  else hair = `<path d="M30 40 Q30 19 50 19 Q70 19 70 40 Q66 28 50 27 Q34 28 30 40 Z" fill="${L.hair}"/>`;
  if (L.bun) hair += `<circle cx="50" cy="15" r="8" fill="${L.hair}"/>`;
  if (L.braid) hair += `<path d="M69 46 Q76 60 70 74" stroke="${L.hair}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (t.includes('h')) {
    if (L.hat === 'top') hat = `<rect x="35" y="2" width="30" height="22" rx="2" fill="${L.hatC}"/><rect x="35" y="18" width="30" height="4" fill="#7a1b22"/><rect x="26" y="23" width="48" height="5" rx="2.5" fill="${L.hatC}"/>`;
    else if (L.hat === 'cap') hat = `<path d="M30 30 Q30 13 50 13 Q70 13 70 30 Z" fill="${L.hatC}"/><path d="M50 28 L80 30 Q78 34 50 32 Z" fill="${L.hatC}"/>`;
    else if (L.hat === 'sun') hat = `<ellipse cx="50" cy="26" rx="34" ry="7" fill="${L.hatC}"/><path d="M34 26 Q34 10 50 10 Q66 10 66 26 Z" fill="${L.hatC}"/><circle cx="62" cy="19" r="4" fill="#f2b54a"/>`;
    else if (L.hat === 'chef') hat = `<path d="M33 26 Q24 14 36 10 Q40 2 50 6 Q60 2 64 10 Q76 14 67 26 Z" fill="${L.hatC}"/><rect x="34" y="22" width="32" height="7" fill="#e2ddd2"/>`;
    else if (L.hat === 'captain') hat = `<path d="M28 24 Q30 12 50 12 Q70 12 72 24 Z" fill="${L.hatC}"/><rect x="29" y="22" width="42" height="6" rx="2" fill="#0e1626"/><circle cx="50" cy="18" r="3" fill="#f2b54a"/>`;
  }
  if (L.beard) extra += `<path d="M33 46 Q35 70 50 70 Q65 70 67 46 Q60 58 50 58 Q40 58 33 46 Z" fill="${L.hair}"/>`;
  if (t.includes('m')) extra += `<path d="M40 52 Q45 48 50 51 Q55 48 60 52 Q55 55 50 53 Q45 55 40 52 Z" fill="${L.beard ? '#cfc8bb' : L.hair}"/>`;
  if (t.includes('g')) extra += `<g fill="none" stroke="#e8d7a8" stroke-width="2"><circle cx="42" cy="42" r="6"/><circle cx="58" cy="42" r="6"/><path d="M48 42 L52 42"/></g>`;
  let scarf = t.includes('s') ? `<path d="M30 72 Q50 82 70 72 L70 80 Q50 90 30 80 Z" fill="${L.scarfC}"/><path d="M58 78 L64 96 L56 96 Z" fill="${L.scarfC}"/>` : '';
  return `<svg width="${z}" height="${z}" viewBox="0 0 100 100" role="img" aria-label="${esc(p.name)}"><circle cx="50" cy="50" r="49" fill="#2c2118" stroke="#4a3626"/>
    <path d="M14 100 Q16 74 50 72 Q84 74 86 100 Z" fill="${coat}"/>
    <rect x="44" y="58" width="12" height="14" fill="${L.skin}"/>
    ${hair}<ellipse cx="50" cy="44" rx="19" ry="21" fill="${L.skin}"/>${L.fem || L.bun ? `<path d="M31 38 Q34 22 50 22 Q66 22 69 38 Q62 28 50 29 Q38 28 31 38 Z" fill="${L.hair}"/>` : ''}
    <circle cx="42" cy="42" r="2.2" fill="#1b120c"/><circle cx="58" cy="42" r="2.2" fill="#1b120c"/>
    <path d="M44 57 L56 57" stroke="#6a3b2a" stroke-width="2" stroke-linecap="round"/>
    ${extra}${scarf}${hat}</svg>`;
}
function manorArt() {
  return `<svg class="manor" viewBox="0 0 320 170" aria-hidden="true">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c2e"/><stop offset="1" stop-color="#15100c"/></linearGradient></defs>
  <rect width="320" height="170" fill="url(#sky)" rx="14"/>
  <circle cx="258" cy="36" r="18" fill="#efe3c2" opacity=".9"/><circle cx="266" cy="31" r="16" fill="#2a1c2e"/>
  <path d="M0 150 Q80 138 160 146 Q240 154 320 142 L320 170 L0 170 Z" fill="#0c0806"/>
  <g fill="#0f0a08">
    <rect x="70" y="70" width="180" height="80"/><polygon points="62,72 160,30 258,72"/>
    <rect x="140" y="20" width="40" height="70"/><polygon points="134,22 160,0 186,22"/>
    <rect x="40" y="88" width="40" height="62"/><polygon points="34,90 60,66 86,90"/>
    <rect x="240" y="88" width="40" height="62"/><polygon points="234,90 260,66 286,90"/>
  </g>
  <circle cx="160" cy="44" r="9" fill="#f2b54a" opacity=".85"/><path d="M160 38 L160 44 L164 47" stroke="#3a2616" stroke-width="2" fill="none"/>
  <g fill="#f2b54a"><rect x="88" y="86" width="14" height="18" rx="2" opacity=".9"/><rect x="118" y="86" width="14" height="18" rx="2" opacity=".35"/><rect x="188" y="86" width="14" height="18" rx="2" opacity=".75"/>
  <rect x="218" y="86" width="14" height="18" rx="2" opacity=".3"/><rect x="88" y="118" width="14" height="18" rx="2" opacity=".4"/><rect x="218" y="118" width="14" height="18" rx="2" opacity=".85"/>
  <rect x="52" y="104" width="12" height="16" rx="2" opacity=".6"/><rect x="256" y="104" width="12" height="16" rx="2" opacity=".5"/></g>
  <path d="M150 150 L150 124 Q160 114 170 124 L170 150 Z" fill="#3a2616"/>
  </svg>`;
}
function candle(left, total) {
  const f = total ? Math.max(0, left) / total : 0, h = 8 + 40 * f, y = 60 - h;
  return `<svg class="candle" viewBox="0 0 34 64" aria-label="${left} searches left">
    <ellipse cx="17" cy="61" rx="15" ry="3" fill="#3a2616"/>
    <rect x="9" y="${y}" width="16" height="${h}" rx="3" fill="#efe2c6"/><rect x="9" y="${y}" width="5" height="${h}" rx="2" fill="#fff6e4" opacity=".6"/>
    <path d="M17 ${y} L17 ${y - 4}" stroke="#222" stroke-width="1.5"/>
    ${left > 0 ? `<g class="flame"><path d="M17 ${y - 18} Q24 ${y - 8} 17 ${y - 3} Q10 ${y - 8} 17 ${y - 18} Z" fill="#f2b54a"/><path d="M17 ${y - 12} Q20 ${y - 7} 17 ${y - 4} Q14 ${y - 7} 17 ${y - 12} Z" fill="#fff3c4"/></g>` : `<path d="M17 ${y - 6} q3 -6 -1 -12 q5 4 2 12" stroke="#777" fill="none" opacity=".6"/>`}
  </svg>`;
}

// ---------- sound (made on the phone, nothing downloaded) ----------
let AC = null, rainNode = null;
function noiseBuf(sec) { const b = AC.createBuffer(1, AC.sampleRate * sec, AC.sampleRate), d = b.getChannelData(0); for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1; return b; }
function soundOn() {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    if (rainNode) return;
    const src = AC.createBufferSource(); src.buffer = noiseBuf(3); src.loop = true;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
    const g = AC.createGain(); g.gain.value = 0.045;
    src.connect(lp).connect(g).connect(AC.destination); src.start(); rainNode = { src, g };
  } catch (e) {}
}
function soundOff() { if (rainNode) { try { rainNode.src.stop(); } catch (e) {} rainNode = null; } }
function thunder() {
  if (!D.settings.sound || !AC) return;
  try {
    const src = AC.createBufferSource(); src.buffer = noiseBuf(4);
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const g = AC.createGain(), t = AC.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);
    src.connect(lp).connect(g).connect(AC.destination); src.start(); src.stop(t + 4);
  } catch (e) {}
}
function chime(ok) {
  if (!D.settings.sound || !AC) return;
  try {
    const notes = ok ? [523, 659, 784, 1046] : [330, 262];
    notes.forEach((f, k) => { const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + k * 0.16; o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.7); });
  } catch (e) {}
}
let nextFlash = Date.now() + 9000;
setInterval(() => {
  if (document.hidden || V.screen === 'home') return;
  if (Date.now() < nextFlash) return;
  nextFlash = Date.now() + 25000 + Math.random() * 35000;
  const f = document.getElementById('flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  setTimeout(thunder, 500 + Math.random() * 1200);
}, 1000);
function say(text) {
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.92; u.pitch = 1; speechSynthesis.speak(u); } catch (e) {}
}

// ---------- helpers ----------
const roomName = r => CS.rooms[r].name, itemName = i => CS.items[i].name;
function myClues() { const c = curCase(); if (!c || c.seat < 0) return []; return CS.piles[c.seat].slice(0, CS.start + c.found); }
function left() { const c = curCase(); return CS.rounds - c.found; }
function tagsOfSuspect(p) { return [...p.t].map(k => M.TRAITS[k].label); }
function tagsOfItem(it) { return [...it.t].map(k => M.TAGS[k].who); }
function clueCard(cl, idx, src, fresh) {
  const c = curCase(), txt = M.clueText(cl, CS), hint = c.help ? M.hintText(cl, CS) : '';
  return `<div class="clue${fresh ? ' new' : ''}">${src ? `<div class="src">${esc(src)}</div>` : ''}<div>${esc(txt)}</div>${hint ? `<div class="hint">💡 ${esc(hint)}</div>` : ''}
    <button class="say" data-a="say" data-v="${idx}" aria-label="Read aloud">🔊</button></div>`;
}
function topBar() {
  const c = curCase();
  return `<div class="top">${candle(left(), CS.rounds)}<div class="t"><h2>${esc(CS.crime.title)}</h2>
    <div class="muted small">${esc(M.BADGES[c.seat].e + ' ' + M.BADGES[c.seat].name)} · ${left() > 0 ? `${left()} search${left() === 1 ? '' : 'es'} left` : 'candle is out'}</div></div>
    <button class="iconbtn" data-a="sound" aria-label="Sound">${D.settings.sound ? '🔊' : '🔈'}</button><button class="iconbtn" data-a="home" aria-label="Home">🏠</button></div>`;
}

// ---------- screens ----------
const SCREENS = {
  home() {
    const c = curCase(), r = D.record;
    return `${manorArt()}<h1>Midnight at<br>the Manor</h1>
      <p class="center muted">A family mystery. Everyone gets secret clues. Solve it together before the candle burns out.</p>
      ${c && !c.done && c.seat >= 0 ? `<button class="btn" data-a="resume">🕯️ Continue: ${esc(CS.crime.title)}</button>` : ''}
      <button class="btn${c && !c.done && c.seat >= 0 ? ' ghost' : ''}" data-a="new">🔍 Start a new case</button>
      <button class="btn ghost" data-a="join">🗝️ Join a case</button>
      <button class="btn ghost" data-a="how">📜 How to play</button>
      <div class="card"><div class="toggle"><span>Rain &amp; thunder sounds</span><button class="${D.settings.sound ? 'on' : ''}" data-a="sound">${D.settings.sound ? 'On' : 'Off'}</button></div>
      <div class="muted small">Cases solved: <b>${r.solved}</b> · Stars earned: <b>${r.stars}</b> ⭐</div></div>`;
  },
  how() {
    return `<h2>How to play</h2>
      <div class="card"><p><b>1.</b> One person taps <b>Start a new case</b> and picks how many detectives are playing. They get a 5-letter code.</p>
      <p><b>2.</b> Everyone else taps <b>Join a case</b> and types the code. Each person picks a different badge.</p>
      <p><b>3.</b> Each phone shows <b>secret clues</b> only that detective can see. Read them out, or keep one back for a dramatic moment.</p>
      <p><b>4.</b> Each round, everyone <b>searches a room</b> for one more clue. The candle burns down with each search.</p>
      <p><b>5.</b> Mark what you learn in the <b>Notebook</b>: ✗ for "no", ✓ for "yes".</p>
      <p><b>6.</b> When the team agrees, one phone makes the <b>accusation</b>: WHO took it, WHERE they hid it, and WHAT they used. Three tries. Fewer tries, more stars.</p></div>
      <div class="card"><h3>The golden rule</h3><p>Every guest was in a <b>different room</b> and held a <b>different thing</b>. The thief hid the treasure in the room they were in, and used the thing they were holding.</p>
      <p class="muted small">Every clue is true. Nobody's clues alone are enough: you need each other. Works with no internet.</p></div>
      <button class="btn" data-a="home">Got it</button>`;
  },
  new() {
    const d = V.draft;
    return `<h2>New case</h2><div class="card"><h3>How many detectives?</h3><p class="muted small">Count everyone playing on their own phone or iPad.</p>
      <div class="pick">${[1, 2, 3, 4, 5].map(k => `<button class="opt${d.players === k ? ' on' : ''}" data-a="dp" data-v="${k}"><span class="big">${k}</span><b>${k === 1 ? 'Just me' : k + ' players'}</b></button>`).join('')}</div></div>
      <div class="card"><h3>How tricky?</h3>${M.LEVELS.map((L, k) => `<button class="opt${d.lvl === k ? ' on' : ''}" style="width:100%;text-align:left;margin:6px 0;padding:12px" data-a="dl" data-v="${k}"><b style="font-size:17px">${['🐣', '🔎', '🎩'][k]} ${esc(L.name)}</b><span class="muted small">${esc(L.blurb)}</span></button>`).join('')}</div>
      <button class="btn" data-a="create" ${d.players && d.lvl >= 0 ? '' : 'disabled'}>Open the case file</button>
      <button class="btn ghost" data-a="home">Back</button>`;
  },
  code() {
    return `<h2 class="center">${esc(CS.crime.e)} ${esc(CS.crime.title)}</h2>
      <div class="card center"><p>Your case code is</p><div class="code">${esc(CS.code)}</div>
      <p class="muted">${CS.players > 1 ? `Everyone else: tap <b>Join a case</b> and type this code. (${CS.players} detectives, ${esc(CS.level.name)})` : `${esc(CS.level.name)}, playing solo.`}</p></div>
      <button class="btn" data-a="tobadge">${CS.players > 1 ? 'Everyone has it, pick my badge' : 'Begin'}</button>`;
  },
  join() {
    return `<h2>Join a case</h2><div class="card"><p>Type the 5-letter code from the phone that started the case.</p>
      <input id="codein" class="code-in" maxlength="7" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" inputmode="text" value="${esc(V.joinCode)}" aria-label="Case code">
      <div class="err">${esc(V.err)}</div></div>
      <button class="btn" data-a="dojoin">Join</button><button class="btn ghost" data-a="home">Back</button>`;
  },
  badge() {
    const c = curCase();
    return `<h2 class="center">${esc(CS.crime.title)}</h2><p class="center muted">${CS.players > 1 ? `${CS.players} detectives · ${esc(CS.level.name)}<br>Each detective picks a <b>different</b> badge. Your badge decides your secret clues.` : esc(CS.level.name)}</p>
      <div class="pick">${M.BADGES.slice(0, CS.players).map((b, k) => `<button class="opt${c.seat === k ? ' on' : ''}" data-a="seat" data-v="${k}"><span class="big">${b.e}</span><b>${esc(b.name)}</b></button>`).join('')}</div>
      <button class="btn" data-a="tointro" ${c.seat >= 0 ? '' : 'disabled'}>Enter the manor</button>`;
  },
  intro() {
    const cr = CS.crime;
    return `<h2 class="center">${esc(cr.e)} ${esc(cr.title)}</h2>
      <div class="card"><p>Thunder rolls over Blackwood Manor. At the stroke of midnight the lights flicker out...</p>
      <p>When they come back on, <b>${esc(cr.what)}</b> is gone from ${esc(cr.from)}!</p>
      <p>${CS.n} guests were in the house. Each was in a <b>different room</b>, holding a <b>different thing</b>. One of them is the thief.</p>
      <p>Find out <b>WHO</b> took it, <b>WHERE</b> they hid it (the room they were in), and <b>WHAT</b> they used (the thing they were holding).</p>
      <p class="muted">Your candle lasts ${CS.rounds} searches. ${CS.players > 1 ? 'Share your clues and work it out together.' : ''}</p></div>
      <div class="card"><h3>The guests</h3>${CS.sus.map(p => `<div class="who">${portrait(p, 52)}<div><b>${esc(p.name)}</b><div class="muted small">${esc(p.role)}</div></div></div>`).join('')}</div>
      <button class="btn" data-a="start">Open my secret clues</button>`;
  },
  game() { return topBar() + TABS[V.tab](); },
  result() {
    const c = curCase(), st = M.storyText(CS), won = c.done === 1;
    return `<h2 class="center">${won ? 'Case closed!' : c.guesses.length >= 3 && c.guesses.every(g => g.right < 3) ? 'The thief got away...' : 'Here is what really happened'}</h2>
      ${won ? `<div class="stars reveal">${'⭐'.repeat(c.stars)}${'☆'.repeat(3 - c.stars)}</div>` : ''}
      <div class="card reveal center">${portrait(st.who, 120)}<h3>${esc(st.lines[0])}</h3></div>
      <div class="card">${st.lines.slice(1).map(l => `<p>${esc(l)}</p>`).join('')}
      <p class="muted small">${st.room.e} ${esc(st.room.name)} · ${st.item.e} the ${esc(st.item.name)}</p></div>
      ${won ? `<p class="center muted">Solved in ${c.guesses.length} ${c.guesses.length === 1 ? 'try' : 'tries'}${left() > 0 ? ` with ${left()} search${left() === 1 ? '' : 'es'} of candle to spare` : ''}.</p>` : ''}
      <button class="btn" data-a="new">New case</button><button class="btn ghost" data-a="tab" data-v="clues">Look back at my clues</button><button class="btn ghost" data-a="home">Home</button>`;
  },
};
const TABS = {
  clues() {
    const c = curCase(), mine = myClues();
    let h = `<div class="toggle"><span class="small">💡 Clue helper (explains what each clue means)</span><button class="${c.help ? 'on' : ''}" data-a="help">${c.help ? 'On' : 'Off'}</button></div>`;
    h += `<h3>Your secret starting clues</h3>`;
    mine.slice(0, CS.start).forEach((cl, k) => { h += clueCard(cl, k, '', false); });
    if (mine.length > CS.start) h += `<h3>Clues you found</h3>`;
    for (let k = mine.length - 1; k >= CS.start; k--) { const f = k - CS.start, r = c.searched[f]; h += clueCard(mine[k], k, (r >= 0 && r < CS.n ? CS.rooms[r].e + ' ' + CS.rooms[r].name + ': ' : '') + M.FINDS[CS.flavor[c.seat][f % M.FINDS.length]], V.fresh === k); }
    if (!c.done) h += left() > 0 ? `<button class="btn" data-a="tab" data-v="search">🔦 Search a room (${left()} left)</button>` : `<button class="btn red" data-a="tab" data-v="accuse">The candle is out: make the accusation</button>`;
    V.fresh = -1;
    return h;
  },
  search() {
    const c = curCase();
    if (V.searching >= 0) return `<div class="search-anim"><div class="glass">🔍</div><p>Searching the ${esc(roomName(V.searching))}...</p></div>`;
    if (c.done) return `<div class="card center"><p>This case is closed.</p></div>`;
    if (left() <= 0) return `<div class="card center"><p>🕯️ Your candle has burned out. No more searching!</p><p class="muted">Talk it over with the team, then make the accusation.</p></div><button class="btn red" data-a="tab" data-v="accuse">Make the accusation</button>`;
    const all = c.searched.length >= CS.n, roundNo = c.found + 1;
    let h = `<p class="center">Round <b>${roundNo}</b> of ${CS.rounds}. Pick a room to search.${CS.players > 1 ? '<br><span class="muted small">Everyone searches once, then share what you found.</span>' : ''}</p>`;
    for (const up of [1, 0]) {
      h += `<div class="floor">${up ? 'Upstairs' : 'Downstairs'}</div><div class="pick">`;
      CS.rooms.forEach((r, k) => { if (!!r.up !== !!up) return; const done = c.searched.includes(k) && !all;
        h += `<button class="opt${done ? ' done' : ''}" data-a="searchroom" data-v="${k}" ${done ? 'disabled' : ''}><span class="big">${r.e}</span><b>${esc(r.name)}</b>${r.fire ? '<span class="small">🔥 fireplace</span>' : ''}${done ? '<span class="small muted">searched</span>' : ''}</button>`; });
      h += `</div>`;
    }
    return h;
  },
  notebook() {
    const c = curCase(), n = CS.n, where = V.nb === 'where', key = where ? 'sr' : 'si', cols = where ? CS.rooms : CS.items;
    let h = `<div class="seg"><button class="${where ? 'on' : ''}" data-a="nb" data-v="where">Where (rooms)</button><button class="${where ? '' : 'on'}" data-a="nb" data-v="what">What (things)</button></div>
      <table class="nb"><tr><th class="nm"></th>${cols.map(x => `<th title="${esc(x.name)}"><span class="e">${x.e}</span>${esc(x.name.split(' ').pop())}</th>`).join('')}<th title="Thief?"><span class="e">🕵️</span>Thief?</th></tr>`;
    CS.sus.forEach((p, s) => {
      h += `<tr><td class="nm">${portrait(p, 30)}<span>${esc(p.name.replace(/^(The Great|Duchess|Professor|Mrs\.|Mr\.|Captain|Nana|Madame|Doctor) /, ''))}</span></td>`;
      for (let x = 0; x < n; x++) { const v = c.note[key][s * n + x]; h += `<td class="c ${v === 1 ? 'x' : v === 2 ? 'y' : ''}" data-a="cell" data-v="${key}:${s * n + x}">${v === 1 ? '✗' : v === 2 ? '✓' : ''}</td>`; }
      const tv = c.note.t[s]; h += `<td class="c thf ${tv === 1 ? 'x' : tv === 2 ? 'q' : ''}" data-a="cell" data-v="t:${s}">${tv === 1 ? '✗' : tv === 2 ? '❓' : ''}</td></tr>`;
    });
    h += `</table><p class="muted small center">Tap a box: ✗ means "no", tap again for ✓ "yes", again to clear. In the thief column: ✗ not the thief, ❓ suspicious.<br>Remember: one guest per room, one thing per guest.</p>
      <button class="btn ghost" data-a="clearnb">Clear notebook</button>`;
    return h;
  },
  file() {
    const cr = CS.crime;
    return `<div class="card"><h3>${esc(cr.e)} The crime</h3><p><b>${esc(cr.what)}</b> vanished from ${esc(cr.from)} at midnight.</p>
      <p class="small">Every guest was in a <b>different room</b> and held a <b>different thing</b>. The thief hid it in their room and used their thing.</p></div>
      <div class="card"><h3>Guests</h3>${CS.sus.map(p => `<div class="who">${portrait(p, 52)}<div><b>${esc(p.name)}</b><div class="muted small">${esc(p.role)}</div>${tagsOfSuspect(p).map(t => `<span class="tag">${esc(t)}</span>`).join('') || '<span class="tag">no hat, glasses, mustache or scarf</span>'}</div></div>`).join('')}</div>
      <div class="card"><h3>Rooms</h3>${CS.rooms.map(r => `<div class="who"><span style="font-size:28px">${r.e}</span><div><b>${esc(r.name)}</b><br><span class="tag">${r.up ? 'upstairs' : 'downstairs'}</span>${r.fire ? '<span class="tag">🔥 fireplace</span>' : '<span class="tag">no fireplace</span>'}</div></div>`).join('')}</div>
      <div class="card"><h3>Things the guests were holding</h3>${CS.items.map(it => `<div class="who"><span style="font-size:28px">${it.e}</span><div><b>${esc(it.name[0].toUpperCase() + it.name.slice(1))}</b><br>${tagsOfItem(it).map(t => `<span class="tag">${esc(t)}</span>`).join('') || '<span class="tag">nothing special</span>'}</div></div>`).join('')}</div>`;
  },
  accuse() {
    const c = curCase(), a = V.acc;
    if (c.done) return `<div class="card center"><p>This case is closed.</p></div><button class="btn" data-a="showresult">See the ending</button>`;
    const tries = 3 - c.guesses.length;
    let h = `<p class="center">Agree as a team first! <b>${tries}</b> ${tries === 1 ? 'try' : 'tries'} left.</p>`;
    if (c.guesses.length) { const g = c.guesses[c.guesses.length - 1]; h += `<div class="card center">Last try: <b>${g.right} of 3</b> right. The thief is still loose!</div>`; }
    h += `<h3>WHO took it?</h3><div class="pick">${CS.sus.map((p, s) => `<button class="opt${a.s === s ? ' on' : ''}" data-a="as" data-v="${s}">${portrait(p, 48)}<b>${esc(p.name)}</b></button>`).join('')}</div>`;
    h += `<h3>WHERE did they hide it?</h3><div class="pick">${CS.rooms.map((r, k) => `<button class="opt${a.r === k ? ' on' : ''}" data-a="ar" data-v="${k}"><span class="big">${r.e}</span><b>${esc(r.name)}</b></button>`).join('')}</div>`;
    h += `<h3>WHAT did they use?</h3><div class="pick">${CS.items.map((it, k) => `<button class="opt${a.i === k ? ' on' : ''}" data-a="ai" data-v="${k}"><span class="big">${it.e}</span><b>${esc(it.name)}</b></button>`).join('')}</div>`;
    h += `<button class="btn red" data-a="accuse" ${a.s >= 0 && a.r >= 0 && a.i >= 0 ? '' : 'disabled'}>⚖️ Accuse!</button>
      <button class="btn ghost small" data-a="giveup">Another phone already solved it? Show the answer</button>`;
    return h;
  },
};
const TABLIST = [['clues', '📜', 'Clues'], ['search', '🔦', 'Search'], ['notebook', '📓', 'Notebook'], ['file', '🗂️', 'Case file'], ['accuse', '⚖️', 'Accuse']];

function render() {
  if (V.screen === 'game' && (!CS || !curCase() || curCase().seat < 0)) V.screen = 'home';
  $app.innerHTML = SCREENS[V.screen]();
  const inGame = V.screen === 'game';
  $tabs.hidden = !inGame;
  if (inGame) $tabs.innerHTML = TABLIST.map(([k, e, l]) => `<button class="${V.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}"><span>${e}</span>${l}</button>`).join('');
  if (V.screen === 'join') { const i = document.getElementById('codein'); if (i) { i.addEventListener('input', () => { V.joinCode = i.value; }); i.addEventListener('keydown', e => { if (e.key === 'Enter') ACT.dojoin(); }); } }
}
function go(screen) { V.screen = screen; render(); window.scrollTo(0, 0); }
function modal(html) { $modal.innerHTML = `<div class="card">${html}</div>`; $modal.hidden = false; }
function closeModal() { $modal.hidden = true; $modal.innerHTML = ''; }

// ---------- actions ----------
const ACT = {
  home() { closeModal(); go('home'); },
  how() { go('how'); },
  new() { V.draft = { players: 0, lvl: -1 }; go('new'); },
  join() { V.err = ''; V.joinCode = ''; go('join'); setTimeout(() => { const i = document.getElementById('codein'); if (i) i.focus(); }, 50); },
  resume() { V.tab = 'clues'; go('game'); },
  dp(v) { V.draft.players = +v; render(); },
  dl(v) { V.draft.lvl = +v; render(); },
  create() {
    const d = V.draft; if (!d.players || d.lvl < 0) return;
    let code; do { code = M.makeCode(d.players, d.lvl); } while (D.cases[code]);
    openCase(code); go('code');
  },
  dojoin() {
    const i = document.getElementById('codein'); const raw = i ? i.value : V.joinCode; const info = M.readCode(raw);
    if (info.error) { V.err = info.error; V.joinCode = raw; render(); return; }
    openCase(info.code); const c = curCase();
    if (c.seat >= 0 && !c.done) { V.tab = 'clues'; go('game'); } else go(c.done ? 'result' : 'badge');
  },
  tobadge() { if (CS.players === 1) { curCase().seat = 0; save(); go('intro'); } else go('badge'); },
  seat(v) { curCase().seat = +v; save(); render(); },
  tointro() { if (curCase().seat >= 0) go('intro'); },
  start() { V.tab = 'clues'; go('game'); },
  tab(v) { if (!TABS[v]) return; V.tab = v; if (V.screen !== 'game') V.screen = 'game'; render(); window.scrollTo(0, 0); },
  help() { const c = curCase(); c.help = c.help ? 0 : 1; save(); render(); },
  say(v) { const cl = myClues()[+v]; if (!cl) return; const c = curCase(); say(M.clueText(cl, CS) + (c.help ? ' ' + M.hintText(cl, CS).replace('✗', 'a cross') : '')); },
  sound() { D.settings.sound = D.settings.sound ? 0 : 1; save(); if (D.settings.sound) soundOn(); else soundOff(); render(); },
  searchroom(v) {
    const c = curCase(), r = +v; if (c.done || left() <= 0 || V.searching >= 0 || !(r >= 0 && r < CS.n)) return;
    V.searching = r; render();
    setTimeout(() => { c.searched.push(r); c.found++; save(); V.searching = -1; V.fresh = CS.start + c.found - 1; V.tab = 'clues'; render(); window.scrollTo(0, 0); chime(true); }, 1300);
  },
  nb(v) { V.nb = v === 'what' ? 'what' : 'where'; render(); },
  cell(v) {
    const [k, idx] = v.split(':'), c = curCase(), arr = c.note[k]; if (!arr || !(+idx >= 0 && +idx < arr.length)) return;
    arr[+idx] = (arr[+idx] + 1) % 3; save(); render();
  },
  clearnb() { modal(`<h3>Clear the notebook?</h3><p>All your ✗ and ✓ marks for this case will be wiped.</p><div class="row"><button class="btn ghost" data-a="close">Keep them</button><button class="btn red" data-a="clearyes">Clear</button></div>`); },
  clearyes() { const c = curCase(), n = CS.n; c.note = { sr: Array(n * n).fill(0), si: Array(n * n).fill(0), t: Array(n).fill(0) }; save(); closeModal(); render(); },
  close() { closeModal(); },
  as(v) { V.acc.s = +v; render(); },
  ar(v) { V.acc.r = +v; render(); },
  ai(v) { V.acc.i = +v; render(); },
  accuse() {
    const a = V.acc; if (a.s < 0 || a.r < 0 || a.i < 0) return;
    modal(`<h3>Is the whole team agreed?</h3><p>${portrait(CS.sus[a.s], 40)} <b>${esc(CS.sus[a.s].name)}</b>, hid it in the <b>${esc(roomName(a.r))}</b>, using the <b>${esc(itemName(a.i))}</b>.</p>
      <div class="row"><button class="btn ghost" data-a="close">Not yet</button><button class="btn red" data-a="accuseyes">Accuse!</button></div>`);
  },
  accuseyes() {
    closeModal(); const c = curCase(), a = V.acc, t = CS.thief;
    const right = (a.s === t) + (a.r === CS.roomOf[t]) + (a.i === CS.itemOf[t]);
    c.guesses.push({ s: a.s, r: a.r, i: a.i, right });
    if (right === 3) { c.done = 1; c.stars = 4 - c.guesses.length; D.record.solved++; D.record.stars += c.stars; save(); chime(true); go('result'); return; }
    chime(false);
    if (c.guesses.length >= 3) { c.done = 2; save(); go('result'); return; }
    save(); V.acc = { s: -1, r: -1, i: -1 }; render(); window.scrollTo(0, 0);
  },
  giveup() { modal(`<h3>Show the answer?</h3><p>Only do this if your team already solved it on another phone, or you want to give up.</p><div class="row"><button class="btn ghost" data-a="close">Keep playing</button><button class="btn red" data-a="giveyes">Show it</button></div>`); },
  giveyes() { const c = curCase(); c.done = 2; save(); closeModal(); go('result'); },
  showresult() { go('result'); },
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.a]; if (f) { e.preventDefault(); f(el.dataset.v, el); }
});
$modal.addEventListener('click', e => { if (e.target === $modal) closeModal(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) soundOff(); else if (D.settings.sound && AC) soundOn(); });
document.addEventListener('pointerdown', () => { if (D.settings.sound && !rainNode) soundOn(); }, { passive: true });

render();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
