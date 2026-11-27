// Midnight at the Manor: the live table. Passes moves between phones so a family in different houses stays together.
// The mystery never depends on it: every phone builds the case from the code, and moves made with no signal
// wait in an outbox on the phone and are sent when the signal comes back (each has an id, so resends are harmless).
(function (root) {
'use strict';
const API = 'https://midnight-manor-live.shoguns-gate-family.workers.dev/mm';
const LKEY = 'mmlive', DKEY = 'mmdev';
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
let devId = null;
try { devId = localStorage.getItem(DKEY); } catch (e) {}
if (!/^[a-z0-9]{8,14}$/.test(devId || '')) { devId = rid().slice(0, 12).replace(/[^a-z0-9]/g, 'x').padEnd(8, 'x'); try { localStorage.setItem(DKEY, devId); } catch (e) {} }

// per-case log kept on the phone: {since, evs (from the server), out (not sent yet)}; last 6 cases only
let store = {};
try { const s = JSON.parse(localStorage.getItem(LKEY) || '{}'); if (s && typeof s === 'object') store = s; } catch (e) { store = {}; }
function keep() {
  try {
    const codes = Object.keys(store).sort((a, b) => (store[b].at || 0) - (store[a].at || 0));
    for (const k of codes.slice(6)) delete store[k];
    localStorage.setItem(LKEY, JSON.stringify(store));
  } catch (e) {}
}
function room(code) {
  let r = store[code];
  if (!r || typeof r !== 'object' || !Array.isArray(r.evs) || !Array.isArray(r.out)) r = store[code] = { since: 0, evs: [], out: [], at: Date.now() };
  return r;
}

const S = { code: null, who: null, onChange: null, timer: 0, busy: false, fails: 0, lastOk: 0, lastTry: 0, here: [], skew: 0, polls: 0, again: false };

function schedule(ms) { clearTimeout(S.timer); if (S.code) S.timer = setTimeout(sync, ms); }
async function sync() {
  if (!S.code) return;
  if (S.busy) { S.again = true; return; }
  if (typeof document !== 'undefined' && document.hidden) return;        // paused while the app is in the background
  S.busy = true; S.again = false; S.lastTry = Date.now();
  const code = S.code, r = room(code), w = S.who || {}, sending = r.out.filter(e => e.dev === w.dev).slice(0, 30).map(e => { const o = Object.assign({}, e); delete o.dev; return o; });
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const kill = setTimeout(() => { if (ctl) ctl.abort(); }, 9000);
  let changed = false;
  try {
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined, cache: 'no-store',
      body: JSON.stringify({ op: 'sync', room: code, dev: w.dev, seat: w.seat, name: w.name, av: w.av, since: r.since, ping: S.polls % 4 === 0 ? 1 : 0, evs: sending }) });
    const j = await res.json();
    if (j && !j.ok && sending.length && ['full', 'bad_request', 'too_big'].includes(j.error)) {   // the server will never take these: drop them instead of retrying forever
      const bad = new Set(sending.map(e => e.eid)); r.out = r.out.filter(e => !bad.has(e.eid)); keep(); S.lost = (S.lost || 0) + bad.size;
    }
    if (!j || !j.ok) throw new Error(j && j.error || 'bad');
    if (S.code !== code) return;
    const sent = new Set(sending.map(e => e.eid));
    if (sent.size) { r.out = r.out.filter(e => !sent.has(e.eid)); changed = true; }
    const have = new Set(r.evs.map(e => e.eid));
    for (const e of j.evs) { if (!have.has(e.eid)) { r.evs.push(e); have.add(e.eid); changed = true; } if (e.seq > r.since) r.since = e.seq; }
    r.at = Date.now(); keep();
    S.skew = j.now - Date.now(); S.here = Array.isArray(j.here) ? j.here : [];
    const wasDown = S.fails > 0 || !S.lastOk; S.fails = 0; S.lastOk = Date.now(); S.polls++;
    if (wasDown) changed = true;
    if (j.more || r.out.length) S.again = true;
  } catch (e) {
    S.fails++; if (S.fails === 1 || S.fails === 4) changed = true;
  } finally {
    clearTimeout(kill); S.busy = false;
  }
  if (S.code !== code) return;
  if (S.onChange) S.onChange(changed);
  schedule(S.again ? 150 : S.fails ? Math.min(12000, 2000 * S.fails) : 3000);
}

const Live = {
  dev: () => devId,
  // start (or keep) syncing one case; who = {dev, seat, name, av}
  start(code, who, onChange) {
    S.who = who; S.onChange = onChange;
    if (S.code === code) return;
    S.code = code; S.fails = 0; S.lastOk = 0; S.here = []; S.polls = 0; room(code).at = Date.now(); keep();
    schedule(0);
  },
  stop() { S.code = null; clearTimeout(S.timer); },
  active: () => S.code,
  setWho(who) { const old = S.who || {}; S.who = who; if (old.seat !== who.seat || old.name !== who.name) { S.polls = 0; schedule(0); } },
  send(code, ev, dev) { const r = room(code); const e = Object.assign({ eid: rid(), dev }, ev); r.out.push(e); r.at = Date.now(); keep(); if (S.code === code) schedule(0); return e; },
  // everything known about a case: server log, then my unsent moves (marked mine)
  events(code) { const r = store[code]; if (!r) return []; return r.evs.concat(r.out.map(e => Object.assign({ pending: 1 }, e))); },
  forget(code) { delete store[code]; keep(); },
  pending: (code, dev) => store[code] ? store[code].out.filter(e => !dev || e.dev === dev).length : 0,
  // 'live' (heard from the server in the last 20 s), 'trying' (just lost it), 'offline'
  status() {
    if (!S.code) return 'off';
    const age = Date.now() - S.lastOk;
    if (S.lastOk && age < 20000 && S.fails < 3) return 'live';
    return S.fails >= 4 || (!S.lastOk && S.fails >= 2) ? 'offline' : 'trying';
  },
  here: () => S.here,
  serverNow: () => Date.now() + S.skew,
  kick() { if (S.code) schedule(0); },
  // is this code already being used by another family today? (null = could not check)
  async peek(code, dev) {
    try {
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null; const kill = setTimeout(() => { if (ctl) ctl.abort(); }, 5000);
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined, body: JSON.stringify({ op: 'peek', room: code, dev }) });
      clearTimeout(kill); const j = await res.json(); return j && j.ok ? !!j.busy : null;
    } catch (e) { return null; }
  },
};
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) Live.kick(); });
  root.addEventListener('online', () => Live.kick());
  root.addEventListener('pageshow', () => Live.kick());
}
root.ManorLive = Live;
})(typeof window !== 'undefined' ? window : globalThis);
