import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { rand, palette } from './rendering.js';

export function spawnPunchTarget(state, world, side, z) {
  const group = new THREE.Group();
  const x = side === 0 ? 0 : side * 0.75;
  const y = rand(1.18, 1.58);
  const color = side < 0 ? palette.magenta : side > 0 ? palette.cyan : palette.orange;
  const emissive = side < 0 ? 0x4c153d : side > 0 ? 0x154552 : 0x554117;
  
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), new THREE.MeshStandardMaterial({
    color, emissive, metalness: 0.25, roughness: 0.3,
  }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.018, 10, 36), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 }));
  ring.rotation.x = Math.PI / 2;
  group.add(body, ring);
  group.position.set(x, y, z);
  world.add(group);
  
  const entity = {
    kind: 'punch', side, group, body, ring, hold: 0, hit: false,
    speed: 5.2 * state.intensity, radius: 0.26, baseY: y, color
  };
  state.entities.push(entity);
}

export function spawnReachNode(state, world, side, z, both = false) {
  const group = new THREE.Group();
  const nodes = [];
  const makeNode = (x, y, color) => {
    const node = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, metalness: 0.2, roughness: 0.2 }));
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.016, 10, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }));
    halo.rotation.x = Math.PI / 2;
    node.add(core, halo);
    node.position.set(x, y, 0);
    group.add(node);
    return { node, core, halo, hold: 0, hit: false, color };
  };
  
  if (both) {
    nodes.push(makeNode(-0.62, 1.48, palette.magenta));
    nodes.push(makeNode(0.62, 1.48, palette.cyan));
  } else {
    const x = side < 0 ? -0.78 : 0.78;
    nodes.push(makeNode(x, rand(1.26, 1.65), side < 0 ? palette.magenta : palette.cyan));
  }
  
  group.position.set(0, 0, z);
  world.add(group);
  
  const entity = {
    kind: 'reach', side, both, group, nodes,
    speed: 4.8 * state.intensity, radius: 0.28,
  };
  state.entities.push(entity);
}

export function spawnDuckHazard(state, world, calibration, z) {
  const group = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.16, 0.18), new THREE.MeshBasicMaterial({ color: palette.red, transparent: true, opacity: 0.88 }));
  const glow = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.04, 0.24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }));
  glow.position.y = 0;
  group.add(beam, glow);
  
  const clampY = Math.max(1.45, Math.min(1.78, calibration.neutralHead.y + 0.02));
  group.position.set(0, clampY, z);
  world.add(group);
  
  state.entities.push({ kind: 'hazard', subtype: 'duck', group, speed: 5.5 * state.intensity, resolved: false });
}

export function spawnLeanHazard(state, world, requiredSide, z) {
  const group = new THREE.Group();
  const gapX = requiredSide < 0 ? -0.95 : 0.95;
  const blocker = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.8, 0.22), new THREE.MeshStandardMaterial({ color: palette.blue, emissive: 0x113766, emissiveIntensity: 0.5, transparent: true, opacity: 0.88 }));
  blocker.position.x = -gapX * 0.7;
  
  const color = requiredSide < 0 ? palette.magenta : palette.cyan;
  const warning = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.03, 10, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
  warning.position.set(gapX, 1.3, 0);
  warning.rotation.y = Math.PI / 2;
  
  group.add(blocker, warning);
  group.position.set(0, 1.3, z);
  world.add(group);
  
  state.entities.push({ kind: 'hazard', subtype: requiredSide < 0 ? 'leanL' : 'leanR', group, speed: 5.5 * state.intensity, resolved: false });
}

export function spawnBarrier(state, world, z) {
  const group = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.6, 0.25), new THREE.MeshBasicMaterial({ color: palette.orange, transparent: true, opacity: 0.18 }));
  wall.position.y = 1.0;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 10, 48), new THREE.MeshBasicMaterial({ color: palette.orange, transparent: true, opacity: 0.8 }));
  ring.position.y = 1.65;
  ring.rotation.x = Math.PI / 2;
  const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.06, 0.22), new THREE.MeshBasicMaterial({ color: palette.orange, transparent: true, opacity: 0.8 }));
  edgeTop.position.y = 1.78;
  
  group.add(wall, ring, edgeTop);
  group.position.set(0, 0, z);
  world.add(group);
  
  state.entities.push({ kind: 'hazard', subtype: 'barrier', group, speed: 5.8 * state.intensity, resolved: false });
}

export function spawnEntity(state, world, calibration, action) {
  const z = -state.spawnLead * (7.8 * state.intensity);
  switch (action) {
    case 'pL': return spawnPunchTarget(state, world, -1, z);
    case 'pR': return spawnPunchTarget(state, world, 1, z);
    case 'pC': return spawnPunchTarget(state, world, 0, z);
    case 'rL': return spawnReachNode(state, world, -1, z);
    case 'rR': return spawnReachNode(state, world, 1, z);
    case 'rBoth': return spawnReachNode(state, world, 0, z, true);
    case 'duck': return spawnDuckHazard(state, world, calibration, z);
    case 'leanL': return spawnLeanHazard(state, world, -1, z);
    case 'leanR': return spawnLeanHazard(state, world, 1, z);
    case 'barrier': return spawnBarrier(state, world, z);
  }
}

export function removeEntity(state, entity) {
  if (!entity) return;
  if (entity.group && entity.group.parent) entity.group.parent.remove(entity.group);
  const idx = state.entities.indexOf(entity);
  if (idx >= 0) state.entities.splice(idx, 1);
}

export function spawnBurst(state, world, position, color = palette.cyan, count = 10) {
  const group = new THREE.Group();
  const pieces = [];
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(rand(0.02, 0.06), rand(0.02, 0.06), rand(0.02, 0.06)), material.clone());
    mesh.position.copy(position);
    mesh.userData.vel = new THREE.Vector3(rand(-1.4, 1.4), rand(-0.3, 1.5), rand(-0.8, 1.2));
    mesh.userData.spin = new THREE.Vector3(rand(-4, 4), rand(-4, 4), rand(-4, 4));
    group.add(mesh);
    pieces.push(mesh);
  }
  world.add(group);
  state.fx.push({ kind: 'burst', group, pieces, ttl: 0.55 });
}

export function spawnWave(state, world, position, color = palette.white, scale = 0.4) {
  const mesh = new THREE.Mesh(new THREE.RingGeometry(scale, scale + 0.035, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  mesh.position.copy(position);
  mesh.rotation.x = Math.PI / 2;
  world.add(mesh);
  state.fx.push({ kind: 'wave', mesh, ttl: 0.42, maxScale: 2.2 });
}
