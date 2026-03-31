export const MODE_DEFS = {
  skyhook: {
    name: 'Skyhook Assault',
    bpm: 118,
    bandMode: 'back',
    patterns: [
      [{ d: 0, a: 'pL' }, { d: 1, a: 'pR' }, { d: 2, a: 'duck' }, { d: 3, a: 'barrier' }],
      [{ d: 0, a: 'pL' }, { d: 0.5, a: 'pR' }, { d: 1.5, a: 'leanL' }, { d: 2.5, a: 'pC' }, { d: 3.5, a: 'barrier' }],
      [{ d: 0, a: 'pR' }, { d: 1, a: 'pL' }, { d: 2, a: 'leanR' }, { d: 3, a: 'duck' }],
      [{ d: 0, a: 'pL' }, { d: 0.5, a: 'pR' }, { d: 1.0, a: 'pL' }, { d: 2.0, a: 'barrier' }, { d: 3.0, a: 'leanL' }],
      [{ d: 0, a: 'pR' }, { d: 0.5, a: 'pL' }, { d: 1.5, a: 'duck' }, { d: 2.5, a: 'barrier' }, { d: 3.0, a: 'pC' }],
    ],
    hint: 'Skyhook: punch drones. Duck red beams. Lean through blue gaps. Grip both overhead and pull up to clear yellow barriers.',
  },
  reactor: {
    name: 'Reactor Reach',
    bpm: 110,
    bandMode: 'front',
    patterns: [
      [{ d: 0, a: 'rL' }, { d: 1, a: 'rR' }, { d: 2, a: 'duck' }, { d: 3, a: 'barrier' }],
      [{ d: 0, a: 'rBoth' }, { d: 1.5, a: 'leanL' }, { d: 2.0, a: 'rL' }, { d: 3.0, a: 'rR' }],
      [{ d: 0, a: 'rR' }, { d: 1.0, a: 'rL' }, { d: 2.0, a: 'barrier' }, { d: 3.0, a: 'leanR' }],
      [{ d: 0, a: 'rL' }, { d: 0.75, a: 'rR' }, { d: 2.0, a: 'duck' }, { d: 3.0, a: 'rBoth' }],
      [{ d: 0, a: 'rBoth' }, { d: 1.5, a: 'barrier' }, { d: 2.5, a: 'leanL' }, { d: 3.25, a: 'duck' }],
    ],
    hint: 'Reactor: reach into glowing nodes until they lock. Duck red beams. Lean through blue gaps. Grip both overhead and pull up for yellow barriers.',
  },
};

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function createGameState() {
  return {
    playing: false,
    mode: null,
    time: 0,
    duration: 90,
    score: 0,
    combo: 0,
    flow: 0,
    health: 100,
    overdrive: 0,
    overdriveCharge: 0,
    events: [],
    nextEventIndex: 0,
    entities: [],
    fx: [],
    lastBeatPulse: 0,
    beatTime: 0,
    beatInterval: 0.5,
    currentHint: 'Calibrate under your bar',
    recentPull: 0,
    hitFlash: 0,
    failFlash: 0,
    intensity: 0.70,
    comfort: 'light',
    spawnLead: 3.8,
    judgementText: '',
    judgementTimer: 0,
    menuOpen: false,
  };
}

export function scoreSuccess(state, points, message = 'GOOD') {
  const mult = state.overdrive > 0 ? 2.0 : 1.0;
  state.score += points * mult + state.combo * 8;
  state.combo += 1;
  state.flow = clamp(state.flow + 0.05, 0, 1);
  state.overdriveCharge = clamp(state.overdriveCharge + 0.1, 0, 1.1);
  state.hitFlash = 0.18;
  state.judgementText = `+${Math.floor(points * mult)} ${message}`;
  state.judgementTimer = 0.85;
  state.currentHint = message;
  
  if (state.overdriveCharge >= 0.99 && state.overdrive <= 0) {
    state.overdrive = 6.5;
    state.overdriveCharge = 0;
    return 'OVERDRIVE';
  }
  return 'SUCCESS';
}

export function scoreFail(state, message = 'Missed!') {
  state.combo = 0;
  state.flow = clamp(state.flow - 0.15, 0, 1);
  state.health = clamp(state.health - 10, 0, 100);
  state.failFlash = 0.28;
  state.judgementText = message.toUpperCase();
  state.judgementTimer = 0.95;
  state.currentHint = message;
  
  return state.health <= 0 ? 'FAIL_GAMEOVER' : 'FAIL';
}

export function generateEvents(modeKey, duration = 90) {
  const def = MODE_DEFS[modeKey];
  if (!def) return [];
  const beat = 60 / def.bpm;
  const measureBeats = 4;
  let cursorBeats = 3;
  const events = [];
  while (cursorBeats * beat < duration) {
    const pattern = def.patterns[Math.floor(Math.random() * def.patterns.length)];
    for (const step of pattern) {
      const time = (cursorBeats + step.d) * beat;
      if (time < duration - 1.5) events.push({ time, action: step.a });
    }
    cursorBeats += measureBeats;
    if (Math.random() < 0.35) cursorBeats += 0.5;
  }
  events.sort((a, b) => a.time - b.time);
  return events;
}

export function updateGameTime(state, dt) {
  state.time += dt;
  state.recentPull = Math.max(0, state.recentPull - dt);
  state.hitFlash = Math.max(0, state.hitFlash - dt * 2.2);
  state.failFlash = Math.max(0, state.failFlash - dt * 2.0);
  state.judgementTimer = Math.max(0, state.judgementTimer - dt);
  state.flow = clamp(state.flow - dt * 0.018, 0, 1);
  state.overdrive = Math.max(0, state.overdrive - dt);
  state.overdriveCharge = clamp(state.overdriveCharge - dt * 0.01, 0, 1.1);
}
