// Midnight at the Manor: the inside of each room, shown when a detective searches it.
// Each room: [high on the left wall, high on the right wall, floor left, middle, floor right]. Drawn with emoji on a painted wall and floor.
(function (root) {
'use strict';
const PROPS = {
  // Blackwood Manor
  'Library': ['📚', '🕯️', '🪑', '🌍', '📜'], 'Kitchen@manor': ['🍳', '🧂', '🥖', '🍲', '🥕'], 'Conservatory': ['🌿', '🦋', '🪴', '🌺', '🌵'],
  'Ballroom': ['🪩', '🎻', '💃', '🎼', '🕺'], 'Dining Hall': ['🕯️', '🍷', '🪑', '🍗', '🍰'], 'Music Room': ['🎼', '🎺', '🎻', '🎹', '🪕'],
  'Study': ['🗺️', '🕰️', '🪑', '✒️', '📜'], 'Attic': ['🕸️', '🦇', '📦', '🧳', '🪆'], 'Portrait Gallery': ['🖼️', '🖼️', '🗿', '🕯️', '🏺'],
  'Nursery': ['🧸', '🌙', '🪀', '🚂', '🧩'], 'Observatory': ['🌌', '🪐', '📚', '🔭', '🌠'], 'Clock Tower': ['⚙️', '🦇', '🔔', '🕰️', '⚙️'],
  // Gull Rock Lighthouse
  'Lamp Room': ['✨', '✨', '🧰', '💡', '🛢️'], 'Watch Gallery': ['🐦', '🌫️', '🪢', '🔭', '🧭'], 'Keeper\'s Bedroom': ['🖼️', '🕯️', '🥾', '🛏️', '🧸'],
  'Log Room': ['🗺️', '🕰️', '🪑', '📖', '✒️'], 'Boathouse': ['🎣', '⚓', '🛟', '⛵', '🦀'], 'Kitchen@lighthouse': ['🐟', '🧂', '🥖', '🍲', '🦞'],
  'Storm Cellar': ['🕸️', '💧', '🛢️', '🌀', '🥾'], 'Radio Shack': ['📡', '🎧', '🪑', '📻', '🔋'],
  // Frostpeak Ski Lodge
  'Loft': ['🦌', '🕯️', '🧺', '🛌', '🧸'], 'Guest Suite': ['🖼️', '🛎️', '🧳', '🛏️', '🥾'], 'Games Room': ['🎯', '🏆', '♟️', '🎲', '🃏'],
  'Sauna': ['💨', '🌡️', '🪣', '♨️', '🧖'], 'Great Hall': ['🦌', '🪓', '🪵', '🛋️', '🐻'], 'Cocoa Bar': ['☕', '🍪', '🪑', '🫖', '🍡'],
  'Boot Room': ['🧤', '🧣', '🥾', '🧥', '🎿'], 'Ski Shop': ['🏂', '🧢', '🎿', '⛷️', '🥽'],
  // The Midnight Express
  'Engine Cab': ['🕹️', '🌡️', '🪨', '🚂', '🔥'], 'Coal Car': ['⛏️', '🪔', '🪨', '🪨', '🪣'], 'Dining Car': ['🕯️', '🍷', '🪑', '🍽️', '🍰'],
  'Lounge Car': ['🖼️', '🪴', '🛋️', '🎩', '📰'], 'Sleeper Car': ['🌙', '🧦', '🧳', '🛏️', '🥿'], 'Baggage Car': ['🏷️', '📦', '🧳', '🎒', '📦'],
  'Observation Car': ['🏔️', '🌲', '🪑', '🌄', '📷'], 'Mail Car': ['📮', '✉️', '📦', '📬', '📨'],
  // Museum After Dark
  'Dinosaur Hall': ['🦕', '🦴', '🌋', '🦖', '🥚'], 'Egyptian Room': ['🐫', '🔺', '🏺', '⚱️', '🐈'], 'Space Gallery': ['🪐', '🛰️', '👨‍🚀', '🚀', '☄️'],
  'Insect House': ['🦋', '🐝', '🐜', '🐞', '🕷️'], 'Gem Vault': ['💍', '👑', '🔒', '💎', '🪙'], 'Knight\'s Armory': ['⚔️', '🏹', '🐴', '🛡️', '🏰'],
  'Art Gallery': ['🖼️', '🌻', '🗿', '🎨', '🖌️'], 'Gift Shop': ['🎈', '🧸', '🛒', '🎁', '🦖'],
  // The Salty Gull
  'Crow\'s Nest': ['🌙', '🐦', '🏴‍☠️', '🪺', '🔭'], 'Ship\'s Wheel': ['🧭', '🌊', '🪢', '☸️', '🦜'], 'Bow': ['🐬', '🌊', '⚓', '🧜', '🪢'],
  'Rope Locker': ['🪝', '🪢', '🪣', '🪢', '🧰'], 'Galley': ['🐟', '🥖', '🍌', '🍲', '🥥'], 'Crew Hammocks': ['🧦', '🌙', '🥾', '🛏️', '🎒'],
  'Cargo Hold': ['🐀', '🕸️', '🛢️', '📦', '🍍'], 'Captain\'s Cabin': ['🏴‍☠️', '🕰️', '🪙', '🗺️', '💰'],
  // Moon Base Selene
  'Control Room': ['📡', '🛰️', '🪑', '🖥️', '🕹️'], 'Star Observatory': ['🌌', '🪐', '🌠', '🔭', '☄️'], 'Greenhouse': ['💧', '🌻', '🪴', '🌱', '🍅'],
  'Zero-G Gym': ['🏀', '🧑‍🚀', '🏋️', '🤸', '🎾'], 'Rover Garage': ['🔧', '🔋', '🛞', '🚙', '🧰'], 'Sleeping Pods': ['🌙', '💤', '🧸', '🛏️', '👽'],
  'Science Lab': ['🧬', '⚗️', '🔬', '🧪', '🧫'], 'Space Kitchen': ['🍕', '🧃', '🥫', '🥫', '🧁'],
  // The Winter Workshop
  'Toy Workshop': ['🪀', '🪁', '🧸', '🔨', '🚂'], 'Wrapping Room': ['🎀', '✂️', '🎁', '🎀', '🎁'], 'Tinsel Loft': ['✨', '⭐', '📦', '🎄', '✨'],
  'Mail Room': ['✉️', '📜', '📬', '📮', '✉️'], 'Cookie Kitchen': ['🥛', '🧁', '🍪', '🍪', '🥣'], 'Reindeer Stable': ['🔔', '🌟', '🥕', '🦌', '🌾'],
  'Sleigh Garage': ['🔔', '🗺️', '🎁', '🛷', '🧰'], 'Cocoa Lounge': ['☕', '🕯️', '🛋️', '🫖', '🍪'],
};
// wall top, wall bottom, floor, floor lines
const PAINT = {
  manor: ['#4a2e2a', '#24150f', '#5a3a22', '#3e2716'], lighthouse: ['#2d4c5c', '#16252e', '#6a5a44', '#4a3e2e'],
  lodge: ['#6a4428', '#3a2414', '#7a5a3a', '#5a3e24'], train: ['#5c2a2a', '#331616', '#4a3226', '#2e1e16'],
  museum: ['#4e4838', '#29251c', '#8a7d62', '#6a5e48'], ship: ['#4e3820', '#291c0e', '#6e4e2c', '#4e341a'],
  moon: ['#2c3456', '#13172c', '#4c5062', '#34384a'], workshop: ['#6e2a2a', '#381212', '#6e4c2c', '#4e3218'],
};
function props(theme, name) { return PROPS[name + '@' + theme] || PROPS[name] || ['🕯️', '🖼️', '📦', '🪑', '🧺']; }
// the room's special feature (fireplace, window, lantern) on the back wall
function feature(theme, flag) {
  const kind = flag.label === 'fireplace' ? 'fire' : flag.label === 'lantern' ? 'hang' : 'win';
  return `<div class="feat ${kind}"><span>${flag.icon}</span></div>`;
}
// elapsed: seconds since the detective walked in, so redraws carry on the animation instead of restarting it
function scene(themeKey, room, flag, zoneLabel, elapsed) {
  const p = props(themeKey, room.name), c = PAINT[themeKey] || PAINT.manor;
  return `<div class="rscene" style="--el:${-Math.max(0, elapsed || 0)}s;--w1:${c[0]};--w2:${c[1]};--f1:${c[2]};--f2:${c[3]}">
    <div class="wall"></div><div class="floor"></div>
    ${room.flag ? feature(themeKey, flag) : `<div class="feat sign"><span>${room.e}</span></div>`}
    <span class="pr p0">${p[0]}</span><span class="pr p1">${p[1]}</span><span class="pr p2">${p[2]}</span><span class="pr p3">${p[3]}</span><span class="pr p4">${p[4]}</span>
    <div class="plaque">${room.e} ${room.name}<small>${zoneLabel}</small></div>
    <span class="spark">✨</span>
    <div class="beam"></div>
    <div class="door l"></div><div class="door r"></div>
  </div>`;
}
root.ManorRooms = { scene, props, PROPS };
})(window);
