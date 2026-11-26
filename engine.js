// Midnight at the Manor: the mystery engine. No DOM, so Node can test it.
// Every phone runs this same code, so the same 5-letter code builds the same case everywhere.
// RULE: any change that alters a generated case (lists below, generator, random order) must bump GEN,
// so a phone on an old version refuses a new code instead of quietly building a different mystery.
(function (root) {
'use strict';
const GEN = 1;
const ALPHA = 'BCDFGHJKLMNPQRSTVWXZ';          // no vowels: codes never spell words, no 0/O or 1/I mix-ups
const SEEDS = 10666;                             // 20^4 / 15
const LEVELS = [
  { key: 'junior',    name: 'Junior Detective', n: 4, extra: 3, blurb: '4 suspects, simple clues, extra help' },
  { key: 'detective', name: 'Detective',        n: 5, extra: 1, blurb: '5 suspects, trickier clues' },
  { key: 'master',    name: 'Master Detective', n: 6, extra: 0, blurb: '6 suspects, the toughest clues' },
];
const START = 2;       // secret clues each detective holds at the start
const MIN_ROUNDS = 3;  // candle length is never shorter than this
const BADGES = [
  { e: '🦉', name: 'Owl' }, { e: '🦊', name: 'Fox' }, { e: '🐶', name: 'Hound' }, { e: '🐱', name: 'Cat' }, { e: '🦇', name: 'Bat' },
];

// traits: h = hat, g = glasses, m = mustache, s = scarf
const SUSPECTS = [
  { id: 'duchess',  name: 'Duchess Fizzwick',   role: 'a grand lady who loves sparkly things', t: 'hs', look: { skin: '#f1c9a5', hair: '#b8b8c8', hat: 'sun', hatC: '#7b3f8c', scarfC: '#c8a2e8', fem: 1 },
    motive: 'She wanted to wear it to her own birthday party and was sure nobody would notice.' },
  { id: 'prof',     name: 'Professor Bramble',  role: 'an inventor with ink on his fingers', t: 'gm', look: { skin: '#e8b58f', hair: '#6b6b6b', wild: 1 },
    motive: 'He wanted to measure it for a top-secret invention and meant to put it back by breakfast.' },
  { id: 'cook',     name: 'Mrs. Crumb',         role: 'the manor cook', t: 'h', look: { skin: '#c98e6a', hair: '#3b2a20', hat: 'chef', hatC: '#f4f1ea', fem: 1 },
    motive: 'She thought it was cursed and wanted to hide it until the full moon passed.' },
  { id: 'butler',   name: 'Mr. Hollis',         role: 'the very proper butler', t: 'm', look: { skin: '#f0cfb0', hair: '#1f1f1f', slick: 1 },
    motive: 'After forty years of polishing it, he simply wanted one night to admire it alone.' },
  { id: 'captain',  name: 'Captain Rook',       role: 'a retired sea captain', t: 'hm', look: { skin: '#b87a55', hair: '#e8e2d6', hat: 'captain', hatC: '#1d2c4a', beard: 1 },
    motive: 'He was certain it was the lost treasure of his old ship, the Salty Gull.' },
  { id: 'gardener', name: 'Juniper Moss',       role: 'the gardener', t: 'gs', look: { skin: '#8d5a3c', hair: '#2b1a10', scarfC: '#4f8a4a', fem: 1, braid: 1 },
    motive: 'She read that roses grow "fancier" if you sing to something sparkly all night, and she wanted to try.' },
  { id: 'magician', name: 'The Great Pocketti', role: 'a stage magician', t: 'hs', look: { skin: '#e3ad86', hair: '#111', hat: 'top', hatC: '#141414', scarfC: '#b0242c' },
    motive: 'He was practising a vanishing trick and forgot the part where it comes back.' },
  { id: 'nana',     name: 'Nana Thistle',       role: 'everyone\'s grandmother', t: 'gs', look: { skin: '#f3d3bd', hair: '#f4f4f4', bun: 1, scarfC: '#d98a3a', fem: 1 },
    motive: 'She was hiding it to start a treasure hunt for the grandchildren in the morning.' },
  { id: 'paperboy', name: 'Ozzie Quill',        role: 'the newspaper kid', t: 'h', look: { skin: '#d9a27a', hair: '#c0602a', hat: 'cap', hatC: '#2f6f9a' },
    motive: 'He wanted the scoop of the century for tomorrow\'s front page.' },
  { id: 'singer',   name: 'Madame Velour',      role: 'a famous opera singer', t: 's', look: { skin: '#a8704f', hair: '#5a1a2a', bun: 1, scarfC: '#e0c060', fem: 1 },
    motive: 'She believed holding it would help her hit the highest note in the world.' },
  { id: 'doctor',   name: 'Doctor Fenn',        role: 'the family doctor', t: 'gm', look: { skin: '#7a4a32', hair: '#222', slick: 1 },
    motive: 'He thought it looked "a bit poorly" and wanted to keep an eye on it overnight.' },
  { id: 'clock',    name: 'Tilly Sprocket',     role: 'the clockmaker\'s apprentice', t: 'g', look: { skin: '#f0c4a0', hair: '#8a5a2a', fem: 1, braid: 1 },
    motive: 'She needed one tiny shiny piece to fix the grandfather clock and borrowed the whole thing.' },
];
const TRAITS = {
  h: { label: 'hat',      yes: 'The thief was wearing a hat.',        no: 'The thief was not wearing a hat.',       who: 'wears a hat' },
  g: { label: 'glasses',  yes: 'The thief was wearing glasses.',      no: 'The thief was not wearing glasses.',     who: 'wears glasses' },
  m: { label: 'mustache', yes: 'The thief had a mustache.',           no: 'The thief had no mustache.',             who: 'has a mustache' },
  s: { label: 'scarf',    yes: 'A scarf thread was caught on the case: the thief wore a scarf.', no: 'The thief was not wearing a scarf.', who: 'wears a scarf' },
};
const ROOMS = [
  { name: 'Library',      e: '📚', up: 0, fire: 1, hide: 'inside a hollow book on the top shelf' },
  { name: 'Kitchen',      e: '🍳', up: 0, fire: 0, hide: 'in the flour bin, under a mountain of flour' },
  { name: 'Conservatory', e: '🌿', up: 0, fire: 0, hide: 'inside a giant flowerpot' },
  { name: 'Ballroom',     e: '💃', up: 0, fire: 1, hide: 'up inside the crystal chandelier' },
  { name: 'Dining Hall',  e: '🍽️', up: 0, fire: 1, hide: 'under the silver soup lid' },
  { name: 'Music Room',   e: '🎹', up: 0, fire: 0, hide: 'inside the grand piano' },
  { name: 'Study',        e: '✒️', up: 1, fire: 1, hide: 'in the secret drawer of the desk' },
  { name: 'Attic',        e: '📦', up: 1, fire: 0, hide: 'in an old hatbox under the cobwebs' },
  { name: 'Portrait Gallery', e: '🖼️', up: 1, fire: 0, hide: 'behind the painting of Great-Uncle Bartholomew' },
  { name: 'Nursery',      e: '🧸', up: 1, fire: 1, hide: 'stuffed inside a teddy bear' },
  { name: 'Observatory',  e: '🔭', up: 1, fire: 0, hide: 'inside the telescope case' },
  { name: 'Clock Tower',  e: '🕰️', up: 1, fire: 0, hide: 'behind the big clock\'s pendulum' },
];
// item tags: l = long, n = noisy, s = shiny, p = fits in a pocket
const ITEMS = [
  { name: 'umbrella',        e: '☂️', t: 'l',   use: 'hooked it with the curved handle of the umbrella' },
  { name: 'ladder',          e: '🪜', t: 'ln',  use: 'climbed up on the rickety ladder' },
  { name: 'fishing rod',     e: '🎣', t: 'l',   use: 'reeled it in with the fishing rod' },
  { name: 'butterfly net',   e: '🦋', t: 'l',   use: 'scooped it up with the butterfly net' },
  { name: 'magnet',          e: '🧲', t: 'sp',  use: 'pulled it free with the giant magnet' },
  { name: 'roller skates',   e: '🛼', t: 'n',   use: 'zoomed in and out on the roller skates' },
  { name: 'trumpet',         e: '🎺', t: 'ns',  use: 'blew a big blast on the trumpet so everyone looked the other way' },
  { name: 'rope',            e: '🪢', t: 'l',   use: 'swung across the hall on the rope' },
  { name: 'honey jar',       e: '🍯', t: 'p',   use: 'used sticky honey so it came away in one swipe' },
  { name: 'feather duster',  e: '🪶', t: '',    use: 'tickled the alarm bell quiet with the feather duster' },
  { name: 'bicycle bell',    e: '🔔', t: 'nsp', use: 'rang the bicycle bell in the hallway as a distraction' },
  { name: 'mirror',          e: '🪞', t: 's',   use: 'used the mirror to peek round the corner first' },
  { name: 'kite',            e: '🪁', t: '',    use: 'floated it out of the window on the kite string' },
  { name: 'toy robot',       e: '🤖', t: 'n',   use: 'sent the clanking toy robot to carry it away' },
];
const TAGS = {
  l: { yes: 'Something long was seen poking out of the thief\'s coat: their thing was long.', no: 'The thief\'s thing was not long.', who: 'long' },
  n: { yes: 'A loud CLANG echoed down the hall: the thief\'s thing makes noise.', no: 'Not a sound was heard: the thief\'s thing is quiet.', who: 'noisy' },
  s: { yes: 'Something glinted in the dark: the thief\'s thing is shiny.', no: 'Nothing glinted in the dark: the thief\'s thing is not shiny.', who: 'shiny' },
  p: { yes: 'The thief\'s thing fits in a pocket.', no: 'The thief\'s thing is too big for a pocket.', who: 'pocket-sized' },
};
const CRIMES = [
  { title: 'The Vanishing Moonstone',    what: 'the Moonstone Necklace',      from: 'its glass case in the front hall', e: '💎' },
  { title: 'The Purloined Pie',          what: 'Nana\'s prize-winning plum pie', from: 'the windowsill where it was cooling', e: '🥧' },
  { title: 'The Missing Golden Key',     what: 'the Golden Key to the clock tower', from: 'its velvet cushion', e: '🗝️' },
  { title: 'The Bottled Ship Mystery',   what: 'the ship in a bottle',         from: 'the mantelpiece in the front hall', e: '⛵' },
  { title: 'The Tiara Caper',            what: 'the Duchess\'s diamond tiara', from: 'its silk pillow', e: '👑' },
  { title: 'The Case of the Quiet Parrot', what: 'Admiral, the manor parrot (cage and all)', from: 'his perch by the stairs', e: '🦜' },
  { title: 'The Secret Recipe Riddle',   what: 'the Manor\'s secret recipe book', from: 'the locked cookbook stand', e: '📕' },
  { title: 'The Music Box Muddle',       what: 'the silver music box',         from: 'the hall table', e: '🎶' },
];
const FINDS = [
  'Behind a dusty curtain you find a crumpled note:',
  'The parrot swoops down and squawks in your ear:',
  'A mouse drops a tiny scrap of paper at your feet:',
  'Scratched into the wallpaper, very small:',
  'Inside a teacup, a folded note:',
  'A ghostly whisper drifts out of the fireplace... or was it the wind?',
  'Under the rug, a page torn from a diary:',
  'You find a muddy footprint, and next to it a clue:',
  'A maid tiptoes over and whispers:',
  'Tucked into a picture frame, a note in curly writing:',
  'The cat knocks over a vase. Inside it:',
  'Your magnifying glass spots something odd:',
];

// ---------- random ----------
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(n) { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return n >>> 0; }
function shuffle(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function range(n) { return Array.from({ length: n }, (_, i) => i); }

// ---------- codes ----------
function checkLetter(v) { return ALPHA[hash(v * 31 + GEN * 977) % 20]; }
function makeCode(players, lvl, rnd) {
  const seed = Math.floor((rnd || Math.random)() * SEEDS);
  let v = seed * 15 + (players - 1) * 3 + lvl, s = '';
  for (let k = 0; k < 4; k++) { s = ALPHA[v % 20] + s; v = Math.floor(v / 20); }
  return s + checkLetter(seed * 15 + (players - 1) * 3 + lvl);
}
// returns {seed, players, lvl} or {error}
function readCode(raw) {
  const c = String(raw || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (c.length !== 5) return { error: 'A case code has 5 letters.' };
  let v = 0;
  for (let k = 0; k < 4; k++) { const d = ALPHA.indexOf(c[k]); if (d < 0) return { error: 'That code has a letter that is never used in codes. Check it again.' }; v = v * 20 + d; }
  if (checkLetter(v) !== c[4]) return { error: 'That code does not match. Check each letter, or, if it is right, close and reopen the game on both phones so they have the same version.' };
  const seed = Math.floor(v / 15), r = v % 15;
  if (seed >= SEEDS) return { error: 'That code does not match.' };
  return { code: c, seed, players: Math.floor(r / 3) + 1, lvl: r % 3 };
}

// ---------- the solver: only deductions a person can make with the notebook ----------
// state: SR[s*n+r] suspect s could have been in room r; SI[s*n+i] could have held item i; T[s] could be the thief
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
          if (!cl.neg && !(fa & fr)) SR[b * n + r] = 0;           // same floor: b only where a could be
          if (cl.neg && fa === fr) SR[b * n + r] = 0;            // different floors: a's floor is known, b is not on it
        }
      }
      break;
    }
    case 'tnot': T[cl.s] = 0; break;
    case 'ttrait': for (let s = 0; s < n; s++) if (cs.sus[s].t.includes(cl.k) !== cl.v) T[s] = 0; break;
    case 'tfloor': case 'tfire': case 'ttag': {
      const isRoom = cl.t !== 'ttag', M = isRoom ? SR : SI;
      const ok = x => cl.t === 'tfloor' ? !!cs.rooms[x].up === cl.v : cl.t === 'tfire' ? !!cs.rooms[x].fire === cl.v : cs.items[x].t.includes(cl.k) === cl.v;
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
function trueClues(cs) {
  const n = cs.n, out = [], { roomOf, itemOf, thief } = cs;
  const add = (w, cl) => { cl.w = w; out.push(cl); };
  for (let s = 0; s < n; s++) for (let x = 0; x < n; x++) {
    add(roomOf[s] === x ? 'atY' : 'atN', { t: 'at', s, r: x, neg: roomOf[s] !== x });
    add(itemOf[s] === x ? 'hasY' : 'hasN', { t: 'has', s, i: x, neg: itemOf[s] !== x });
  }
  for (let r = 0; r < n; r++) for (let i = 0; i < n; i++) {
    const s = roomOf.indexOf(r);
    add(itemOf[s] === i ? 'riY' : 'riN', { t: 'ri', r, i, neg: itemOf[s] !== i });
  }
  for (let s = 0; s < n; s++) for (let b = 0; b < n; b++) if (b !== s) {
    add('either', { t: 'either', a: s, b, r: roomOf[s] });
    add('either', { t: 'eitherHas', a: s, b, i: itemOf[s] });
    if (b > s) add('same', { t: 'same', a: s, b, neg: cs.rooms[roomOf[s]].up !== cs.rooms[roomOf[b]].up });
  }
  for (let s = 0; s < n; s++) if (s !== thief) add('tnot', { t: 'tnot', s });
  const narrows = (list, f) => { const c = list.filter(f).length; return c > 0 && c < list.length; };
  for (const k of 'hgms') {
    const v = cs.sus[thief].t.includes(k), left = cs.sus.filter(p => p.t.includes(k) === v).length;
    if (left < n && (left > 1 || cs.lvl === 0)) add('ttrait', { t: 'ttrait', k, v });
  }
  const tr = cs.rooms[roomOf[thief]], ti = cs.items[itemOf[thief]];
  if (narrows(cs.rooms, r => !!r.up === !!tr.up)) add('tfloor', { t: 'tfloor', v: !!tr.up });
  if (narrows(cs.rooms, r => !!r.fire === !!tr.fire)) add('tfire', { t: 'tfire', v: !!tr.fire });
  for (const k of 'lnsp') { const v = ti.t.includes(k); if (narrows(cs.items, it => it.t.includes(k) === v)) add('ttag', { t: 'ttag', k, v }); }
  return out;
}
const WEIGHTS = [
  { atY: 3, atN: 2, hasY: 3, hasN: 2, tnot: 3, ttrait: 2, tfloor: 1, tfire: 1, ttag: 1 },
  { atY: .6, atN: 3, hasY: .6, hasN: 3, riY: 1.5, riN: 2, tnot: 1, ttrait: 2, tfloor: 1.5, tfire: 1.5, ttag: 1.5, same: .5 },
  { atY: .2, atN: 2, hasY: .2, hasN: 2, riY: 1.5, riN: 2.5, either: 2.5, same: 1.5, tnot: .4, ttrait: 2, tfloor: 1.5, tfire: 1.5, ttag: 1.5 },
];
const SIMPLE = { atY: 1, atN: 1, hasY: 1, hasN: 1, tnot: 1, ttrait: 1, tfloor: 1, tfire: 1, ttag: 1 };

// ---------- build a case ----------
function buildCase(code) {
  const info = typeof code === 'string' ? readCode(code) : code;
  if (info.error) throw new Error(info.error);
  const L = LEVELS[info.lvl], n = L.n, rnd = mulberry(hash(info.seed * 7919 + GEN * 104729 + info.lvl * 31));
  const crime = CRIMES[Math.floor(rnd() * CRIMES.length)];
  const sus = shuffle(range(SUSPECTS.length), rnd).slice(0, n).map(k => SUSPECTS[k]);
  let rooms;
  for (;;) {
    rooms = shuffle(range(ROOMS.length), rnd).slice(0, n).map(k => ROOMS[k]);
    const up = rooms.filter(r => r.up).length, fire = rooms.filter(r => r.fire).length, half = Math.floor(n / 2);
    if (up >= half - (n > 4 ? 1 : 0) && n - up >= half - (n > 4 ? 1 : 0) && fire >= 1 && fire <= n - 1) break;
  }
  rooms.sort((a, b) => b.up - a.up);   // upstairs first, like a house map
  const items = shuffle(range(ITEMS.length), rnd).slice(0, n).map(k => ITEMS[k]);
  const roomOf = shuffle(range(n), rnd), itemOf = shuffle(range(n), rnd), thief = Math.floor(rnd() * n);
  const cs = { code: info.code, gen: GEN, seed: info.seed, lvl: info.lvl, level: L, players: info.players, n, crime, sus, rooms, items, roomOf, itemOf, thief };

  // pick clues: weighted random order, keep each one that teaches the notebook something, until solvable
  const W = WEIGHTS[info.lvl], pool = trueClues(cs).filter(c => W[c.w]);
  for (const c of pool) c.key = -Math.log(1 - rnd()) / W[c.w];
  pool.sort((a, b) => a.key - b.key);
  let chosen = [], last = count(newState(n));
  for (const c of pool) {
    const st = solve(cs, chosen.concat([c])), k = count(st);
    if (k < last) { chosen.push(c); last = k; if (isSolved(st)) break; }
  }
  // drop any clue the others make unnecessary, so every clue matters
  for (let k = chosen.length - 1; k >= 0; k--) {
    const without = chosen.slice(0, k).concat(chosen.slice(k + 1));
    if (isSolved(solve(cs, without))) chosen = without;
  }
  const essential = chosen.length;
  const unused = pool.filter(c => !chosen.includes(c));
  const helpers = unused.filter(c => SIMPLE[c.w] && !(c.t === 'at' && !c.neg && c.s === thief) && !(c.t === 'has' && !c.neg && c.s === thief));
  for (let k = 0; k < L.extra && helpers.length; k++) chosen.push(helpers.shift());

  // deal: essential clues go round the table so every detective's clues matter, then top up to equal piles
  const P = info.players, per = Math.max(START + MIN_ROUNDS, Math.ceil(chosen.length / P));
  shuffle(chosen, rnd);
  const piles = range(P).map(() => []);
  chosen.forEach((c, k) => piles[k % P].push(c));
  const spare = unused.filter(c => !chosen.includes(c) && !(c.t === 'at' && !c.neg && c.s === thief) && !(c.t === 'has' && !c.neg && c.s === thief));
  shuffle(spare, rnd);
  for (const p of piles) while (p.length < per && spare.length) p.push(spare.shift());
  for (const p of piles) shuffle(p, rnd);
  // long solo piles: hand more clues out at the start so the candle stays at most 6 searches
  cs.clues = chosen; cs.essential = essential; cs.piles = piles; cs.rounds = Math.min(per - START, 6); cs.start = per - cs.rounds;
  cs.flavor = range(P).map(() => shuffle(range(FINDS.length), rnd));
  return cs;
}

// ---------- words ----------
const the = r => 'the ' + r.name;
function clueText(cl, cs) {
  const S = s => cs.sus[s].name, R = r => the(cs.rooms[r]), I = i => the(cs.items[i]);
  switch (cl.t) {
    case 'at': return cl.neg ? `${S(cl.s)} was NOT in ${R(cl.r)} at midnight.` : `${S(cl.s)} was in ${R(cl.r)} at midnight.`;
    case 'has': return cl.neg ? `${S(cl.s)} did NOT have ${I(cl.i)}.` : `${S(cl.s)} was holding ${I(cl.i)}.`;
    case 'ri': return cl.neg ? `Whoever was in ${R(cl.r)} did NOT have ${I(cl.i)}.` : `Whoever was in ${R(cl.r)} had ${I(cl.i)}.`;
    case 'either': return `Either ${S(cl.a < cl.b ? cl.a : cl.b)} or ${S(cl.a < cl.b ? cl.b : cl.a)} was in ${R(cl.r)}.`;
    case 'eitherHas': return `Either ${S(cl.a < cl.b ? cl.a : cl.b)} or ${S(cl.a < cl.b ? cl.b : cl.a)} had ${I(cl.i)}.`;
    case 'same': return cl.neg ? `${S(cl.a)} and ${S(cl.b)} were on different floors.` : `${S(cl.a)} and ${S(cl.b)} were on the same floor.`;
    case 'tnot': return `${S(cl.s)} did NOT take it. They were seen playing cards with the parrot all through midnight.`;
    case 'ttrait': return TRAITS[cl.k][cl.v ? 'yes' : 'no'];
    case 'tfloor': return cl.v ? 'Creaky footsteps came from above: the thief was upstairs at midnight.' : 'The thief never went up the creaky stairs: they were downstairs at midnight.';
    case 'tfire': return cl.v ? 'There was soot on the thief\'s sleeve: they were in a room with a fireplace.' : 'No soot anywhere: the thief\'s room had no fireplace.';
    case 'ttag': return TAGS[cl.k][cl.v ? 'yes' : 'no'];
  }
  return '';
}
function list(xs) { return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]; }
function hintText(cl, cs) {
  const S = s => cs.sus[s].name, R = r => the(cs.rooms[r]), I = i => the(cs.items[i]), n = cs.n;
  const others = (f) => list(range(n).filter(f).map(S));
  switch (cl.t) {
    case 'at': return cl.neg ? `Put an ✗ where ${S(cl.s)} meets ${cs.rooms[cl.r].name}.` : `Tick it. Now ${S(cl.s)} was nowhere else, and nobody else was in ${R(cl.r)}.`;
    case 'has': return cl.neg ? `Put an ✗ where ${S(cl.s)} meets the ${cs.items[cl.i].name}.` : `Tick it. Now ${S(cl.s)} had nothing else, and nobody else had ${I(cl.i)}.`;
    case 'ri': return cl.neg ? `Once you know who was in ${R(cl.r)}, cross ${I(cl.i)} off for them (and the other way round).` : `Whoever you find in ${R(cl.r)} gets ${I(cl.i)}. And whoever had ${I(cl.i)} was in ${R(cl.r)}.`;
    case 'either': return `Nobody else was in ${R(cl.r)}: cross it off for ${others(s => s !== cl.a && s !== cl.b)}.`;
    case 'eitherHas': return `Nobody else had ${I(cl.i)}: cross it off for ${others(s => s !== cl.a && s !== cl.b)}.`;
    case 'same': return `Upstairs: ${list(cs.rooms.filter(r => r.up).map(r => r.name))}. Downstairs: ${list(cs.rooms.filter(r => !r.up).map(r => r.name))}.`;
    case 'tnot': return `Cross ${S(cl.s)} off the thief list.`;
    case 'ttrait': { const out = range(n).filter(s => cs.sus[s].t.includes(cl.k) !== cl.v); return out.length ? `So it was not ${list(out.map(S))}.` : 'That does not rule anyone out by itself.'; }
    case 'tfloor': return `${cl.v ? 'Upstairs' : 'Downstairs'} rooms: ${list(cs.rooms.filter(r => !!r.up === cl.v).map(r => r.name))}.`;
    case 'tfire': return `Rooms ${cl.v ? 'with' : 'without'} a fireplace: ${list(cs.rooms.filter(r => !!r.fire === cl.v).map(r => r.name))}.`;
    case 'ttag': return `${cl.v ? '' : 'Not '}${TAGS[cl.k].who}: ${list(cs.items.filter(it => it.t.includes(cl.k) === cl.v).map(it => it.name))}.`;
  }
  return '';
}
function storyText(cs) {
  const t = cs.thief, p = cs.sus[t], r = cs.rooms[cs.roomOf[t]], it = cs.items[cs.itemOf[t]];
  return {
    who: p, room: r, item: it,
    lines: [
      `It was ${p.name}!`,
      `At the stroke of midnight, ${p.name} slipped out of ${the(r)} and took ${cs.crime.what} from ${cs.crime.from}. How? They ${it.use}.`,
      `Then they tiptoed back to ${the(r)} and hid it ${r.hide}. It is safe and sound.`,
      `Why? ${p.motive}`,
    ],
  };
}

const API = { GEN, ALPHA, LEVELS, BADGES, SUSPECTS, ROOMS, ITEMS, CRIMES, TRAITS, TAGS, FINDS, START,
  makeCode, readCode, buildCase, solve, isSolved, clueText, hintText, storyText, trueClues, mulberry, hash };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.Manor = API;
})(this);
