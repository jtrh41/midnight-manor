// Midnight at the Manor: voice chat for family in different houses.
// Phones talk to each other directly (WebRTC, audio only). The live table (live.js) carries the set-up messages,
// and when a direct path is blocked (some phone networks), Cloudflare's relay carries the sound instead.
// Every pair of phones in the call has one connection; the phone with the "smaller" id starts it and restarts it if it breaks.
(function (root) {
'use strict';
const L = root.ManorLive;
const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
const VS = { on: false, joining: false, muted: false, stream: null, peers: {}, ice: STUN, turn: false, me: null, onChange: null };
const rid = () => Math.random().toString(36).slice(2, 10);
let changeT = 0;
function changed() { clearTimeout(changeT); changeT = setTimeout(() => { if (VS.onChange) try { VS.onChange(); } catch (e) {} }, 60); }
function box() { return document.getElementById('voices') || document.body; }

function closePeer(dev, sayBye) {
  const p = VS.peers[dev]; if (!p) return;
  delete VS.peers[dev];
  try { p.pc.close(); } catch (e) {}
  if (p.audio) { try { p.audio.srcObject = null; p.audio.remove(); } catch (e) {} }
  if (sayBye) L.sendSig(dev, JSON.stringify({ t: 'bye' }));
  changed();
}
function makePeer(dev, sid, role) {
  closePeer(dev, false);
  const pc = new RTCPeerConnection({ iceServers: VS.ice });
  const p = { pc, sid, role, started: Date.now(), badSince: 0, audio: null, state: 'connecting' };
  VS.peers[dev] = p;
  if (VS.stream) for (const t of VS.stream.getAudioTracks()) pc.addTrack(t, VS.stream);
  pc.ontrack = e => {
    if (VS.peers[dev] !== p) return;
    if (!p.audio) { p.audio = document.createElement('audio'); p.audio.autoplay = true; p.audio.setAttribute('playsinline', ''); box().appendChild(p.audio); }
    p.audio.srcObject = e.streams[0] || new MediaStream([e.track]);
    const go = p.audio.play(); if (go && go.catch) go.catch(() => {});
  };
  pc.onconnectionstatechange = () => {
    if (VS.peers[dev] !== p) return;
    const s = pc.connectionState;
    p.state = s === 'connected' ? 'connected' : s === 'failed' || s === 'closed' ? 'failed' : s === 'disconnected' ? 'lost' : 'connecting';
    if (p.state === 'connected') p.badSince = 0; else if (!p.badSince && p.state !== 'connecting') p.badSince = Date.now();
    changed();
  };
  return p;
}
// send the whole description once the phone has found its addresses (no trickling: fewer messages through the table)
function gathered(pc) {
  return new Promise(ok => {
    if (pc.iceGatheringState === 'complete') return ok();
    const done = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', done); ok(); } };
    pc.addEventListener('icegatheringstatechange', done);
    setTimeout(ok, 2500);
  });
}
async function offer(dev) {
  const sid = rid(), p = makePeer(dev, sid, 'offer');
  try {
    await p.pc.setLocalDescription(await p.pc.createOffer());
    await gathered(p.pc);
    if (VS.peers[dev] !== p) return;
    L.sendSig(dev, JSON.stringify({ t: 'offer', sid, sdp: p.pc.localDescription.sdp }));
  } catch (e) { if (VS.peers[dev] === p) p.state = 'failed', p.badSince = p.badSince || Date.now(); }
}
async function onSig(from, body) {
  let m; try { m = JSON.parse(body); } catch (e) { return; }
  if (!m || typeof m !== 'object') return;
  if (m.t === 'bye') { closePeer(from, false); return; }
  if (!VS.on) { if (m.t === 'offer') L.sendSig(from, JSON.stringify({ t: 'bye' })); return; }
  if (m.t === 'offer' && typeof m.sdp === 'string') {
    const p = makePeer(from, String(m.sid || ''), 'answer');
    try {
      await p.pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
      await p.pc.setLocalDescription(await p.pc.createAnswer());
      await gathered(p.pc);
      if (VS.peers[from] !== p) return;
      L.sendSig(from, JSON.stringify({ t: 'answer', sid: p.sid, sdp: p.pc.localDescription.sdp }));
    } catch (e) { if (VS.peers[from] === p) p.state = 'failed', p.badSince = p.badSince || Date.now(); }
  } else if (m.t === 'answer' && typeof m.sdp === 'string') {
    const p = VS.peers[from];
    if (p && p.role === 'offer' && p.sid === m.sid && p.pc.signalingState === 'have-local-offer') { try { await p.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); } catch (e) {} }
  }
}
L.onSig(onSig);

const Voice = {
  supported: () => !!(root.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  isOn: () => VS.on, isJoining: () => VS.joining, isMuted: () => VS.muted, relay: () => VS.turn,
  onChange(f) { VS.onChange = f; },
  // must be called from a tap (the microphone prompt needs one). Throws 'denied' or 'nomic'.
  async join(meDev) {
    if (VS.on || VS.joining) return;
    VS.joining = true; changed();
    try {
      VS.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
    } catch (e) { VS.joining = false; changed(); throw new Error(e && e.name === 'NotAllowedError' ? 'denied' : 'nomic'); }
    VS.me = meDev; VS.muted = false;
    const j = await L.ice(); VS.ice = j ? j.iceServers : STUN; VS.turn = !!(j && j.turn);
    VS.on = true; VS.joining = false; L.setVoice(1); changed();
  },
  leave() {
    if (!VS.on && !VS.stream) return;
    for (const dev of Object.keys(VS.peers)) closePeer(dev, true);
    if (VS.stream) for (const t of VS.stream.getTracks()) t.stop();
    VS.stream = null; VS.on = false; VS.joining = false; VS.muted = false; L.setVoice(0); changed();
  },
  mute(m) { VS.muted = !!m; if (VS.stream) for (const t of VS.stream.getAudioTracks()) t.enabled = !VS.muted; changed(); },
  // called after each sync with who is at the table
  tick(here, now) {
    if (!VS.on) return;
    const want = new Set(here.filter(h => h.voice && h.dev !== VS.me && now - h.t < 40000).map(h => h.dev));
    for (const dev of Object.keys(VS.peers)) if (!want.has(dev)) closePeer(dev, false);
    for (const dev of want) {
      const p = VS.peers[dev], iStart = VS.me < dev;
      if (!p) { if (iStart) offer(dev); continue; }
      const stuck = p.state !== 'connected' && Date.now() - p.started > 25000, broken = p.badSince && Date.now() - p.badSince > 8000;
      if (iStart && (stuck || broken)) offer(dev);                     // try again from scratch
      else if (!iStart && broken && Date.now() - p.badSince > 30000) closePeer(dev, false);
    }
    if (Object.values(VS.peers).some(p => p.state !== 'connected')) L.fast(6000);
  },
  // who I can hear: dev -> 'connected' | 'connecting' | 'lost' | 'failed'
  peerState: dev => VS.peers[dev] ? VS.peers[dev].state : null,
  connectedCount: () => Object.values(VS.peers).filter(p => p.state === 'connected').length,
};
root.ManorVoice = Voice;
})(window);
