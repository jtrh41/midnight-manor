// Midnight at the Manor: the mystery engine. No DOM, so Node can test it.
// Every phone runs this same code, so the same 6-letter code builds the same case everywhere.
// RULE: any change that alters a generated case (themes.js lists, levels, generator, random order) must bump GEN,
// so a phone on an old version refuses a new code instead of quietly building a different mystery.
(function (root) {
'use strict';
const TH = (typeof module !== 'undefined' && module.exports) ? require('./themes.js') : root.ManorThemes;
const GEN = 4;
const ALPHA = 'BCDFGHJKLMNPQRSTVWXZ';          // no vowels: codes never spell words, no 0/O or 1/I mix-ups
const THEME_SLOTS = 12, LEVEL_SLOTS = 10, MAX_PLAYERS = 8;
const JUN_SLOTS = MAX_PLAYERS + 1;   // 0..8 juniors
const DIFF_SLOTS = 4;
const COMBOS = THEME_SLOTS * LEVEL_SLOTS * DIFF_SLOTS * MAX_PLAYERS * JUN_SLOTS;
const SEEDS = Math.floor(Math.pow(20, 5) / COMBOS);
const START = 2, MIN_ROUNDS = 3, MAX_ROUNDS = 6;
// 10 levels per theme. n = suspects, w = clue style (0 simple, 1 tricky, 2 toughest), extra = bonus helper clues
const LEVELS = [
  { n: 4, w: 0, extra: 3 }, { n: 4, w: 0, extra: 2 }, { n: 4, w: 1, extra: 2 }, { n: 5, w: 0, extra: 2 }, { n: 5, w: 1, extra: 1 },
  { n: 5, w: 1, extra: 0 }, { n: 5, w: 2, extra: 0 }, { n: 6, w: 1, extra: 1 }, { n: 6, w: 2, extra: 0 }, { n: 6, w: 2, extra: 0 },
];
const STYLE = ['Easy clues', 'Tricky clues', 'Toughest clues'];
// difficulty chosen per case. style: clue kinds; extra: change to helper clues; minRounds: fewer spare clues = shorter candle; tries: accusations allowed
const DIFFS = [
  { key: 'easy',   name: 'Easy',      e: '🟢', style: () => 0,                    extra: L => L.extra + 3, minRounds: 4, tries: 3, blurb: 'simplest clues, extra helper clues, longest candle' },
  { key: 'medium', name: 'Medium',    e: '🟡', style: L => L.w,                   extra: L => L.extra,     minRounds: 3, tries: 3, blurb: 'the usual mix of clues for this case' },
  { key: 'hard',   name: 'Hard',      e: '🟠', style: L => Math.min(2, L.w + 1),  extra: () => 0,          minRounds: 2, tries: 3, blurb: 'trickier clues, no helper clues, shorter candle' },
  { key: 'vhard',  name: 'Very hard', e: '🔴', style: () => 2,                    extra: () => 0,          minRounds: 2, tries: 2, blurb: 'toughest clues, no spare clues, only 2 accusations' },
];
const BADGES = [
  { e: '🦉', name: 'Owl' }, { e: '🦊', name: 'Fox' }, { e: '🐶', name: 'Hound' }, { e: '🐱', name: 'Cat' }, { e: '🦇', name: 'Bat' },
  { e: '🐻', name: 'Bear' }, { e: '🐰', name: 'Rabbit' }, { e: '🦝', name: 'Raccoon' },
];
const TRAITS = {
  h: { label: 'hat',      yes: 'The thief was wearing a hat.',        no: 'The thief was not wearing a hat.' },
  g: { label: 'glasses',  yes: 'The thief was wearing glasses.',      no: 'The thief was not wearing glasses.' },
  m: { label: 'mustache', yes: 'The thief had a mustache.',           no: 'The thief had no mustache.' },
  s: { label: 'scarf',    yes: 'A scarf thread was left behind: the thief wore a scarf.', no: 'The thief was not wearing a scarf.' },
};
const TAGS = {
  l: { yes: 'Something long was seen poking out of the thief\'s coat: their thing was long.', no: 'The thief\'s thing was not long.', who: 'long' },
  n: { yes: 'A loud CLANG echoed: the thief\'s thing makes noise.', no: 'Not a sound was heard: the thief\'s thing is quiet.', who: 'noisy' },
  s: { yes: 'Something glinted in the dark: the thief\'s thing is shiny.', no: 'Nothing glinted in the dark: the thief\'s thing is not shiny.', who: 'shiny' },
  p: { yes: 'The thief\'s thing fits in a pocket.', no: 'The thief\'s thing is too big for a pocket.', who: 'pocket-sized' },
};

// ---------- random ----------
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(n) { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return n >>> 0; }
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function range(n) { return Array.from({ length: n }, (_, i) => i); }

// ---------- codes: 5 letters of data + 1 check letter ----------
function checkLetter(v) { return ALPHA[hash(v * 31 + GEN * 977) % 20]; }
function pack(o) { return ((((o.seed * THEME_SLOTS + o.theme) * LEVEL_SLOTS + o.level) * DIFF_SLOTS + o.diff) * MAX_PLAYERS + (o.players - 1)) * JUN_SLOTS + o.juniors; }
function makeCode(o, rnd) {
  const seed = Math.floor((rnd || Math.random)() * SEEDS);
  let v = pack({ seed, theme: o.theme, level: o.level, diff: o.diff | 0, players: o.players, juniors: Math.min(o.juniors | 0, o.players) }), s = '';
  const check = checkLetter(v);
  for (let k = 0; k < 5; k++) { s = ALPHA[v % 20] + s; v = Math.floor(v / 20); }
  return s + check;
}
function readCode(raw) {
  const c = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (c.length !== 6) return { error: 'A case code has 6 letters.' };
  let v = 0;
  for (let k = 0; k < 5; k++) { const d = ALPHA.indexOf(c[k]); if (d < 0) return { error: 'That code has a letter that is never used in codes (codes have no vowels). Check it again.' }; v = v * 20 + d; }
  if (checkLetter(v) !== c[5]) return { error: 'That code does not match. Check each letter. If it is right, close and reopen the game on both devices so they have the same version.', kind: 'check' };
  let x = v; const juniors = x % JUN_SLOTS; x = Math.floor(x / JUN_SLOTS); const players = x % MAX_PLAYERS + 1; x = Math.floor(x / MAX_PLAYERS);
  const diff = x % DIFF_SLOTS; x = Math.floor(x / DIFF_SLOTS); const level = x % LEVEL_SLOTS; x = Math.floor(x / LEVEL_SLOTS); const theme = x % THEME_SLOTS; const seed = Math.floor(x / THEME_SLOTS);
  if (seed >= SEEDS || theme >= TH.THEMES.length || juniors > players) return { error: 'That code does not match. Check each letter.' };
  return { code: c, seed, theme, level, diff, players, juniors };
}

// ---------- the solver: only deductions a person can make with the notebook ----------
function newState(n) { return { n, SR: new Uint8Array(n * n).fill(1), SI: new Uint8Array(n * n).fill(1), T: new Uint8Array(n).fill(1) }; }
function rowOnly(M, n, s) { let k = -1; for (let x = 0; x < n; x++) if (M[s * n + x]) { if (k >= 0) return -1; k = x; } return k; }
function setOnly(M, n, s, x) { for (let y = 0; y < n; y++) if (y !== x) M[s * n + y] = 0; }
function count(st) { let c = 0; for (const v of st.SR) c += v; for (const v of st.SI) c += v; for (const v of st.T) c += v; return c; }
function thiefOf(st) { let k = -1; for (let s = 0; s < st.n; s++) if (st.T[s]) { if (k >= 0) return -1; k = s; } return k; }
function applyClue(st, cl, cs) {
  const n = st.n, SR = st.SR, SI = st.SI, T = st.T;
  switch (cl.t) {
    case 'at': if (cl.neg) SR[cl.s * n + cl.r] = 0; else setOnly(SR, n, cl.s, cl.r); break;
    case 'has': if (cl.neg) SI[cl.s * n + cl.i] = 0; else setOnly(SI, n, cl.s, cl.i); break;
    case 'ri':
      for (let s = 0; s < n; s++) {
        if (!cl.neg) { if (!SR[s * n + cl.r]) SI[s * n + cl.i] = 0; if (!SI[s * n + cl.i]) SR[s * n + cl.r] = 0; }
        else { if (rowOnly(SR, n, s) === cl.r) SI[s * n + cl.i] = 0; if (rowOnly(SI, n, s) === cl.i) SR[s * n + cl.r] = 0; }
      }
      break;
    case 'either': case 'eitherHas': {
      const M = cl.t === 'either' ? SR : SI, x = cl.t === 'either' ? cl.r : cl.i;
      for (let s = 0; s < n; s++) if (s !== cl.a && s !== cl.b) M[s * n + x] = 0;
      if (!M[cl.a * n + x]) setOnly(M, n, cl.b, x);
      if (!M[cl.b * n + x]) setOnly(M, n, cl.a, x);
      break;
    }
    case 'same': {
      const fl = s => { let f = 0; for (let r = 0; r < n; r++) if (SR[s * n + r]) f |= cs.rooms[r].up ? 2 : 1; return f; };
      for (const [a, b] of [[cl.a, cl.b], [cl.b, cl.a]]) {
        const fa = fl(a);
        for (let r = 0; r < n; r++) {
          const fr = cs.rooms[r].up ? 2 : 1;
          if (!cl.neg && !(fa & fr)) SR[b * n + r] = 0;
          if (cl.neg && fa === fr) SR[b * n + r] = 0;
        }
      }
      break;
    }
    case 'tnot': T[cl.s] = 0; break;
    case 'ttrait': for (let s = 0; s < n; s++) if (cs.sus[s].t.includes(cl.k) !== cl.v) T[s] = 0; break;
    case 'tfloor': case 'tfire': case 'ttag': {
      const isRoom = cl.t !== 'ttag', M = isRoom ? SR : SI;
      const ok = x => cl.t === 'tfloor' ? !!cs.rooms[x].up === cl.v : cl.t === 'tfire' ? !!cs.rooms[x].flag === cl.v : cs.items[x].t.includes(cl.k) === cl.v;
      for (let s = 0; s < n; s++) { let any = 0; for (let x = 0; x < n; x++) if (M[s * n + x] && ok(x)) any = 1; if (!any) T[s] = 0; }
      const th = thiefOf(st); if (th >= 0) for (let x = 0; x < n; x++) if (!ok(x)) M[th * n + x] = 0;
      break;
    }
  }
}
function bijection(M, n) {
  for (let s = 0; s < n; s++) { const x = rowOnly(M, n, s); if (x >= 0) for (let o = 0; o < n; o++) if (o !== s) M[o * n + x] = 0; }
  for (let x = 0; x < n; x++) { let k = -1, c = 0; for (let s = 0; s < n; s++) if (M[s * n + x]) { c++; k = s; } if (c === 1) setOnly(M, n, k, x); }
}
function solve(cs, clues) {
  const st = newState(cs.n);
  for (let guard = 0; guard < 60; guard++) {
    const before = count(st);
    for (const cl of clues) applyClue(st, cl, cs);
    bijection(st.SR, st.n); bijection(st.SI, st.n);
    if (count(st) === before) break;
  }
  return st;
}
function isSolved(st) { const t = thiefOf(st); return t >= 0 && rowOnly(st.SR, st.n, t) >= 0 && rowOnly(st.SI, st.n, t) >= 0; }

// ---------- all true clues about a world ----------
function trueClues(cs, style) {
  const n = cs.n, out = [], { roomOf, itemOf, thief } = cs;
  const add = (w, cl) => { cl.w = w; out.push(cl); };
  for (let s = 0; s < n; s++) for (let x = 0; x < n; x++) {
    add(roomOf[s] === x ? 'atY' : 'atN', { t: 'at', s, r: x, neg: roomOf[s] !== x });
    add(itemOf[s] === x ? 'hasY' : 'hasN', { t: 'has', s, i: x, neg: itemOf[s] !== x });
  }
  for (let r = 0; r < n; r++) for (let i = 0; i < n; i++) { const s = roomOf.indexOf(r); add(itemOf[s] === i ? 'riY' : 'riN', { t: 'ri', r, i, neg: itemOf[s] !== i }); }
  for (let s = 0; s < n; s++) for (let b = 0; b < n; b++) if (b !== s) {
    add('either', { t: 'either', a: s, b, r: roomOf[s] });
    add('either', { t: 'eitherHas', a: s, b, i: itemOf[s] });
    if (b > s) add('same', { t: 'same', a: s, b, neg: cs.rooms[roomOf[s]].up !== cs.rooms[roomOf[b]].up });
  }
  for (let s = 0; s < n; s++) if (s !== thief) add('tnot', { t: 'tnot', s });
  const narrows = (list, f) => { const c = list.filter(f).length; return c > 0 && c < list.length; };
  for (const k of 'hgms') {
    const v = cs.sus[thief].t.includes(k), left = cs.sus.filter(p => p.t.includes(k) === v).length;
    if (left < n && (left > 1 || style === 0)) add('ttrait', { t: 'ttrait', k, v });
  }
  const tr = cs.rooms[roomOf[thief]], ti = cs.items[itemOf[thief]];
  if (narrows(cs.rooms, r => !!r.up === !!tr.up)) add('tfloor', { t: 'tfloor', v: !!tr.up });
  if (narrows(cs.rooms, r => !!r.flag === !!tr.flag)) add('tfire', { t: 'tfire', v: !!tr.flag });
  for (const k of 'lnsp') { const v = ti.t.includes(k); if (narrows(cs.items, it => it.t.includes(k) === v)) add('ttag', { t: 'ttag', k, v }); }
  return out;
}
const WEIGHTS = [
  { atY: 3, atN: 2, hasY: 3, hasN: 2, tnot: 3, ttrait: 2, tfloor: 1, tfire: 1, ttag: 1 },
  { atY: .6, atN: 3, hasY: .6, hasN: 3, riY: 1.5, riN: 2, tnot: 1, ttrait: 2, tfloor: 1.5, tfire: 1.5, ttag: 1.5, same: .5 },
  { atY: .2, atN: 2, hasY: .2, hasN: 2, riY: 1.5, riN: 2.5, either: 2.5, same: 1.5, tnot: .4, ttrait: 2, tfloor: 1.5, tfire: 1.5, ttag: 1.5 },
];
const KID = { atY: 1, atN: 1, hasY: 1, hasN: 1, tnot: 1, ttrait: 1 };   // clues a young detective can use alone
const EASY = Object.assign({ tfloor: 1, tfire: 1, ttag: 1 }, KID);
const giveaway = (c, thief) => (c.t === 'at' || c.t === 'has') && !c.neg && c.s === thief;

// ---------- build a case ----------
function buildCase(code) {
  const info = typeof code === 'string' ? readCode(code) : code;
  if (info.error) throw new Error(info.error);
  const T = TH.THEMES[info.theme], LV = LEVELS[info.level], n = LV.n, P = info.players, J = info.juniors;
  const DF = DIFFS[info.diff | 0], style = J >= P ? 0 : DF.style(LV);   // all juniors: keep every clue simple
  const rnd = mulberry(hash(info.seed * 7919 + GEN * 104729 + info.theme * 131 + info.level * 31 + (info.diff | 0) * 7));
  const crime = T.crimes[Math.floor(rnd() * T.crimes.length)];
  const sus = shuffle(range(T.sus.length), rnd).slice(0, n).map(k => T.sus[k]);
  let rooms;
  for (let tries = 0; ; tries++) {
    rooms = shuffle(range(T.rooms.length), rnd).slice(0, n).map(k => T.rooms[k]);
    const up = rooms.filter(r => r.up).length, fl = rooms.filter(r => r.flag).length, need = n > 4 ? 2 : 1;
    if ((up >= need && n - up >= need && fl >= 1 && fl <= n - 1) || tries > 200) break;
  }
  rooms.sort((a, b) => b.up - a.up);
  const items = shuffle(T.items.slice(), rnd).slice(0, n).map(k => TH.ITEMS[k]);
  const roomOf = shuffle(range(n), rnd), itemOf = shuffle(range(n), rnd), thief = Math.floor(rnd() * n);
  const cs = { code: info.code, gen: GEN, seed: info.seed, theme: T, themeIdx: info.theme, level: info.level, levelInfo: LV, diff: info.diff | 0, diffInfo: DF, tries: DF.tries, style, players: P, juniors: J, n, crime, sus, rooms, items, roomOf, itemOf, thief };

  const W = WEIGHTS[style], all = trueClues(cs, style), pool = all.filter(c => W[c.w]);
  for (const c of pool) c.key = -Math.log(1 - rnd()) / W[c.w];
  pool.sort((a, b) => a.key - b.key);
  // each junior seat gets two easy clues that are always part of the solution
  let chosen = [], last = count(newState(n));
  const kidPool = shuffle(all.filter(c => KID[c.w] && !giveaway(c, thief)), rnd);
  for (const c of kidPool) {
    if (chosen.length >= 2 * J) break;
    const st = solve(cs, chosen.concat([c])), k = count(st);
    if (k < last && !isSolved(st)) { c.kid = 1; chosen.push(c); last = k; }
  }
  for (const c of pool) {
    if (chosen.includes(c)) continue;
    const st = solve(cs, chosen.concat([c])), k = count(st);
    if (k < last) { chosen.push(c); last = k; if (isSolved(st)) break; }
  }
  for (let k = chosen.length - 1; k >= 0; k--) {
    if (chosen[k].kid) continue;
    const without = chosen.slice(0, k).concat(chosen.slice(k + 1));
    if (isSolved(solve(cs, without))) chosen = without;
  }
  const essential = chosen.length;
  const unused = all.filter(c => !chosen.includes(c) && !giveaway(c, thief) && (W[c.w] || KID[c.w]));
  const helpers = shuffle(unused.filter(c => EASY[c.w]), rnd);
  for (let k = 0; k < DF.extra(LV) && helpers.length; k++) chosen.push(helpers.shift());

  // deal: easy clues can go to anyone, harder ones only to grown-up seats; keep piles even
  const piles = range(P).map(() => []), isKid = s => s < J;
  shuffle(chosen, rnd);
  chosen.sort((a, b) => (b.kid | 0) - (a.kid | 0));
  for (const c of chosen) {
    let seats = range(P).filter(s => EASY[c.w] || !isKid(s));
    if (!seats.length) seats = range(P);
    if (c.kid && seats.some(isKid)) seats = seats.filter(isKid);
    seats.sort((a, b) => piles[a].length - piles[b].length || (isKid(b) - isKid(a)) || a - b);
    piles[seats[0]].push(c);
  }
  const per = Math.max(START + DF.minRounds, ...piles.map(p => p.length));
  const rest = unused.filter(c => !chosen.includes(c));
  const spareKid = shuffle(rest.filter(c => KID[c.w]), rnd), spareAny = shuffle(rest.slice(), rnd);
  for (let s = 0; s < P; s++) {
    const p = piles[s];
    while (p.length < per) {
      const src = isKid(s) ? (spareKid.length ? spareKid : spareAny) : (spareAny.length ? spareAny : spareKid);
      const c = src.shift();
      if (!c) {
        // big groups on small cases run out of fresh clues: hand out a second copy of one (two witnesses saw the same thing)
        const again = shuffle(unused.concat(chosen.filter(x => !x.kid)).filter(x => !p.includes(x) && (!isKid(s) || J >= P || EASY[x.w])), rnd);
        if (!again.length) break;
        p.push(again[0]); continue;
      }
      const other = src === spareKid ? spareAny : spareKid, j = other.indexOf(c); if (j >= 0) other.splice(j, 1);
      p.push(c);
    }
    shuffle(p, rnd);
  }
  cs.clues = chosen; cs.essential = essential; cs.piles = piles;
  cs.rounds = Math.min(per - START, MAX_ROUNDS); cs.start = per - cs.rounds;
  const finds = T.finds.concat(TH.GENERIC_FINDS);
  cs.finds = finds; cs.flavor = range(P).map(() => shuffle(range(finds.length), rnd));
  return cs;
}

// ---------- words ----------
const the = r => 'the ' + r.name;
const pair = (cs, a, b) => [cs.sus[Math.min(a, b)].name, cs.sus[Math.max(a, b)].name];
function clueText(cl, cs) {
  const S = s => cs.sus[s].name, R = r => the(cs.rooms[r]), I = i => the(cs.items[i]), Z = cs.theme.zone, F = cs.theme.flag;
  switch (cl.t) {
    case 'at': return cl.neg ? `${S(cl.s)} was NOT in ${R(cl.r)} at midnight.` : `${S(cl.s)} was in ${R(cl.r)} at midnight.`;
    case 'has': return cl.neg ? `${S(cl.s)} did NOT have ${I(cl.i)}.` : `${S(cl.s)} was holding ${I(cl.i)}.`;
    case 'ri': return cl.neg ? `Whoever was in ${R(cl.r)} did NOT have ${I(cl.i)}.` : `Whoever was in ${R(cl.r)} had ${I(cl.i)}.`;
    case 'either': { const [x, y] = pair(cs, cl.a, cl.b); return `Either ${x} or ${y} was in ${R(cl.r)}.`; }
    case 'eitherHas': { const [x, y] = pair(cs, cl.a, cl.b); return `Either ${x} or ${y} had ${I(cl.i)}.`; }
    case 'same': return `${S(cl.a)} and ${S(cl.b)} ${cl.neg ? Z.diff : Z.same}.`;
    case 'tnot': return `${S(cl.s)} did NOT take it. Three people saw them somewhere else all through midnight.`;
    case 'ttrait': return TRAITS[cl.k][cl.v ? 'yes' : 'no'];
    case 'tfloor': return cl.v ? Z.upClue : Z.downClue;
    case 'tfire': return cl.v ? F.yes : F.no;
    case 'ttag': return TAGS[cl.k][cl.v ? 'yes' : 'no'];
  }
  return '';
}
function list(xs) { return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]; }
function hintText(cl, cs) {
  const S = s => cs.sus[s].name, R = r => the(cs.rooms[r]), I = i => the(cs.items[i]), n = cs.n, Z = cs.theme.zone, F = cs.theme.flag;
  const others = (f) => list(range(n).filter(f).map(S));
  const zoneList = () => `${Z.up}: ${list(cs.rooms.filter(r => r.up).map(r => r.name))}. ${Z.down}: ${list(cs.rooms.filter(r => !r.up).map(r => r.name))}.`;
  switch (cl.t) {
    case 'at': return cl.neg ? `Put an ✗ where ${S(cl.s)} meets ${cs.rooms[cl.r].name}.` : `Tick it. Now ${S(cl.s)} was nowhere else, and nobody else was in ${R(cl.r)}.`;
    case 'has': return cl.neg ? `Put an ✗ where ${S(cl.s)} meets the ${cs.items[cl.i].name}.` : `Tick it. Now ${S(cl.s)} had nothing else, and nobody else had ${I(cl.i)}.`;
    case 'ri': return cl.neg ? `Once you know who was in ${R(cl.r)}, cross ${I(cl.i)} off for them (and the other way round).` : `Whoever you find in ${R(cl.r)} gets ${I(cl.i)}. And whoever had ${I(cl.i)} was in ${R(cl.r)}.`;
    case 'either': return `Nobody else was in ${R(cl.r)}: cross it off for ${others(s => s !== cl.a && s !== cl.b)}.`;
    case 'eitherHas': return `Nobody else had ${I(cl.i)}: cross it off for ${others(s => s !== cl.a && s !== cl.b)}.`;
    case 'same': return zoneList();
    case 'tnot': return `Cross ${S(cl.s)} off the thief list.`;
    case 'ttrait': { const out = range(n).filter(s => cs.sus[s].t.includes(cl.k) !== cl.v); return out.length ? `So it was not ${list(out.map(S))}.` : 'That does not rule anyone out by itself.'; }
    case 'tfloor': return `${cl.v ? Z.up : Z.down}: ${list(cs.rooms.filter(r => !!r.up === cl.v).map(r => r.name))}.`;
    case 'tfire': return `Rooms ${cl.v ? 'with' : 'without'} a ${F.label}: ${list(cs.rooms.filter(r => !!r.flag === cl.v).map(r => r.name))}.`;
    case 'ttag': return `${cl.v ? '' : 'Not '}${TAGS[cl.k].who}: ${list(cs.items.filter(it => it.t.includes(cl.k) === cl.v).map(it => it.name))}.`;
  }
  return '';
}
function storyText(cs) {
  const t = cs.thief, p = cs.sus[t], r = cs.rooms[cs.roomOf[t]], it = cs.items[cs.itemOf[t]];
  return { who: p, room: r, item: it, lines: [
    `It was ${p.name}!`,
    `At the stroke of midnight, ${p.name} slipped out of ${the(r)} and took ${cs.crime.what} from ${cs.crime.from}. How? They ${it.use}.`,
    `Then they tiptoed back to ${the(r)} and hid it ${r.hide}. It is safe and sound.`,
    `Why? ${p.motive}`,
  ] };
}

const API = { GEN, ALPHA, LEVELS, STYLE, DIFFS, BADGES, TRAITS, TAGS, THEMES: TH.THEMES, ITEMS: TH.ITEMS, START,
  makeCode, readCode, buildCase, solve, isSolved, clueText, hintText, storyText, trueClues, mulberry, hash, KID };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Manor = API;
})(this);
