import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/webxr/VRButton.js';
import { initRendering, palette, makeCanvasPlane } from './rendering.js';
import { initAudio, playSound } from './audio.js';
import { initDOM, updateDOM, showToast, setStatus } from './ui.js';
import { createGameState, updateGameTime, generateEvents, scoreSuccess, scoreFail, MODE_DEFS } from './game.js';
import { setupVRInput, getVRInputState, hapticPulse } from './vr.js';
import { createPlayerState, calibration, derivePlayerState } from './physics.js';
import { spawnEntity, removeEntity, spawnBurst, spawnWave } from './entities.js';

let appDOM, renderer, scene, camera, world, strips, stars, starCount, vignetteMesh;
let xrControllers;
let game = createGameState();
const player = createPlayerState();
const clock = new THREE.Clock();

const debug = { keys: new Set(), hang: false, headOffsetX: 0, headOffsetY: 0, pullPulseTimer: 0 };

async function bootstrap() {
  const rend = initRendering();
  renderer = rend.renderer;
  scene = rend.scene;
  camera = rend.camera;
  world = rend.world;
  strips = rend.strips;
  stars = rend.stars;
  starCount = rend.starCount;
  vignetteMesh = rend.vignetteMesh;

  appDOM = initDOM({
    onStartSkyhook: () => startRun('skyhook'),
    onStartReactor: () => startRun('reactor'),
    onCalibrate: () => { initAudio(); recalibrate(); },
    onPause: () => endRun('Paused.'),
    onChangeIntensity: (val) => { game.intensity = val; updateDOM(appDOM, game); },
    onChangeComfort: (val) => { game.comfort = val; }
  });

  document.getElementById('vrButtonWrap').appendChild(VRButton.createButton(renderer));
  xrControllers = setupVRInput(scene, renderer);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setupDebugInput();

  renderer.xr.addEventListener('sessionstart', () => {
    initAudio();
    setStatus(appDOM, 'VR session active. Press X/A/B/Y or thumbstick to open the floating VR menu.');
    setTimeout(() => recalibrate(), 200);
  });

  recalibrate();
  updateDOM(appDOM, game);
  renderer.setAnimationLoop(loop);
}

function recalibrate() {
  calibration.neutralHead.x = player.head.x;
  calibration.neutralHead.y = player.head.y;
  calibration.neutralHead.z = player.head.z;
  calibration.barHeight = Math.max(player.head.y + 0.34, 1.95);
  showToast(appDOM, 'Recalibrated');
  setStatus(appDOM, 'Recalibrated local player height.');
}

function startRun(modeKey) {
  initAudio();
  playSound('start');
  game = createGameState();
  game.mode = modeKey;
  game.playing = true;
  game.duration = 90;
  game.currentHint = MODE_DEFS[modeKey]?.hint || '';
  game.beatInterval = 60 / (MODE_DEFS[modeKey]?.bpm || 110);
  game.events = generateEvents(modeKey, game.duration);
  updateDOM(appDOM, game);
  showToast(appDOM, `${MODE_DEFS[modeKey]?.name || 'Mode'} Started`);
}

function endRun(msg = 'Run ended') {
  game.playing = false;
  updateDOM(appDOM, game);
  showToast(appDOM, msg);
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (renderer.xr.isPresenting) {
    const xrState = getVRInputState(renderer, camera, xrControllers);
    if (xrState.left.pos) {
      player.leftHand.x = xrState.left.pos.x;
      player.leftHand.y = xrState.left.pos.y;
      player.leftHand.z = xrState.left.pos.z;
    }
    if (xrState.right.pos) {
      player.rightHand.x = xrState.right.pos.x;
      player.rightHand.y = xrState.right.pos.y;
      player.rightHand.z = xrState.right.pos.z;
    }
    player.head.x = xrState.head.x;
    player.head.y = xrState.head.y;
    player.head.z = xrState.head.z;
    player.leftGrip = xrState.left.gripDown;
    player.rightGrip = xrState.right.gripDown;
  } else {
    // Desktop debug fallback
    const targetX = (debug.keys.has('KeyA') ? -0.30 : 0) + (debug.keys.has('KeyD') ? 0.30 : 0);
    const targetDuck = debug.keys.has('KeyS') ? -0.33 : 0;
    const targetRise = debug.hang && debug.pullPulseTimer > 0 ? 0.18 : 0;
    debug.headOffsetX += (targetX - debug.headOffsetX) * clamp(10 * dt, 0, 1);
    debug.headOffsetY += ((targetDuck + targetRise) - debug.headOffsetY) * clamp(12 * dt, 0, 1);
    debug.pullPulseTimer = Math.max(0, debug.pullPulseTimer - dt * 3.2);

    player.head.x = calibration.neutralHead.x + debug.headOffsetX;
    player.head.y = calibration.neutralHead.y + debug.headOffsetY;
    player.head.z = calibration.neutralHead.z;
  }

  derivePlayerState(player, dt);
  updateGameTime(game, dt);

  if (game.playing) {
    // Spawner
    while (game.nextEventIndex < game.events.length) {
      const event = game.events[game.nextEventIndex];
      if (game.time + game.spawnLead < event.time) break;
      spawnEntity(game, world, calibration, event.action);
      game.nextEventIndex++;
    }

    // Entities basic updates
    for (const entity of [...game.entities]) {
      entity.group.position.z += entity.speed * dt;
      if (entity.kind === 'punch') {
        const hitByLeft = entity.side <= 0 && player.leftPunching && dist(player.leftHand, entity.group.position) < entity.radius;
        const hitByRight = entity.side >= 0 && player.rightPunching && dist(player.rightHand, entity.group.position) < entity.radius;
        if (!entity.hit && (hitByLeft || hitByRight)) {
            entity.hit = true;
            const res = scoreSuccess(game, 110, 'Clean strike!');
            if (res === 'OVERDRIVE') playSound('start'); else playSound('hit_' + (hitByLeft ? 'left' : 'right'));
            spawnBurst(game, world, entity.group.position, entity.color, 12);
            removeEntity(game, entity);
        } else if (entity.group.position.z > 0.65) {
          scoreFail(game, 'Missed drone');
          playSound('hazard');
          removeEntity(game, entity);
        }
      } else if (entity.kind === 'hazard' && entity.group.position.z > -0.15 && !entity.resolved) {
         entity.resolved = true;
         if (entity.subtype === 'duck') {
           if (player.duckAmount > calibration.duckThreshold) scoreSuccess(game, 80, 'Dodged!');
           else { scoreFail(game, 'Duck lower!'); playSound('hazard'); }
         } else if (entity.subtype === 'barrier') {
           if (player.hanging && game.recentPull > 0) { scoreSuccess(game, 150, 'Cleared!'); playSound('ring'); }
           else { scoreFail(game, 'Vault barrier!'); playSound('hazard'); }
         }
      }
      if (entity.group.position.z > 1.2) removeEntity(game, entity);
    }
    
    if (game.time >= game.duration) endRun('Track complete!');
    if (game.health <= 0) endRun('Run failed!');
  }

  // Update FX
  for (const f of [...game.fx]) {
    f.ttl -= dt;
    if (f.kind === 'burst') {
      for (const p of f.pieces) {
        p.position.addScaledVector(p.userData.vel, dt);
        p.rotation.x += p.userData.spin.x * dt;
        p.rotation.y += p.userData.spin.y * dt;
        p.rotation.z += p.userData.spin.z * dt;
        p.scale.multiplyScalar(0.97);
        p.material.opacity = Math.max(0, Math.min(1, f.ttl / 0.55));
      }
    }
    if (f.ttl <= 0) {
      if (f.group?.parent) f.group.parent.remove(f.group);
      if (f.mesh?.parent) f.mesh.parent.remove(f.mesh);
      game.fx.splice(game.fx.indexOf(f), 1);
    }
  }

  updateDOM(appDOM, game);
  renderer.render(scene, camera);
}

function dist(p1, p2) {
  const dx = p1.x - p2.x, dy = p1.y - p2.y, dz = p1.z - p2.z;
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function setupDebugInput() {
  window.addEventListener('keydown', (e) => {
    debug.keys.add(e.code);
    if (e.code === 'KeyH') debug.hang = true;
    if (e.code === 'Space') { debug.pullPulseTimer = 1.0; game.recentPull = 0.65; e.preventDefault(); }
    if (e.code === 'KeyR') recalibrate();
    if (e.code === 'KeyJ') { player.leftVel.z = -5; player.leftVel.y = 5; }
    if (e.code === 'KeyL') { player.rightVel.z = -5; player.rightVel.y = 5; }
  });
  window.addEventListener('keyup', (e) => {
    debug.keys.delete(e.code);
    if (e.code === 'KeyH') debug.hang = false;
  });
}

bootstrap();
