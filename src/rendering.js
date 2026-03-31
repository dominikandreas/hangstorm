import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

export const palette = {
  cyan: 0x3cf3ff,
  magenta: 0xff4fd8,
  green: 0x6cff98,
  orange: 0xffca5a,
  red: 0xff667f,
  blue: 0x67a9ff,
  dark: 0x06111b,
  white: 0xeaf6ff,
};

export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);

export function initRendering() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06111b);
  scene.fog = new THREE.Fog(0x06111b, 8, 48);

  const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 120);
  camera.position.set(0, 1.7, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const world = new THREE.Group();
  scene.add(world);

  const ambient = new THREE.HemisphereLight(0x8ad8ff, 0x08101c, 1.55);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(1.5, 3.5, 2.0);
  scene.add(key);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 90, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x08111d, roughness: 0.9, metalness: 0.0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.position.z = -18;
  world.add(floor);

  const grid = new THREE.GridHelper(60, 60, 0x103047, 0x0b2030);
  grid.position.y = 0.0;
  grid.position.z = -18;
  world.add(grid);

  const sideWalls = new THREE.Group();
  world.add(sideWalls);
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x0c2436, transparent: true, opacity: 0.46, wireframe: true });
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 12, 12, 18), wallMat.clone());
    wall.position.set(side * 5.5, 3.0, -18);
    wall.rotation.y = -side * Math.PI / 2.6;
    sideWalls.add(wall);
  }

  const strips = [];
  const stripGeom = new THREE.BoxGeometry(0.08, 0.02, 1.8);
  for (let lane = -2; lane <= 2; lane++) {
    for (let i = 0; i < 18; i++) {
      const strip = new THREE.Mesh(
        stripGeom,
        new THREE.MeshBasicMaterial({ color: lane === 0 ? 0x1fe8ff : 0x142c3e, transparent: true, opacity: lane === 0 ? 0.25 : 0.14 })
      );
      strip.position.set(lane * 0.8, 0.01, -i * 3);
      strips.push(strip);
      world.add(strip);
    }
  }

  const starCount = 650;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3 + 0] = rand(-16, 16);
    starPositions[i * 3 + 1] = rand(0.2, 8.5);
    starPositions[i * 3 + 2] = rand(-50, 4);
  }
  const starsGeom = new THREE.BufferGeometry();
  starsGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeom, new THREE.PointsMaterial({ color: 0x89dfff, size: 0.06, transparent: true, opacity: 0.75, sizeAttenuation: true }));
  world.add(stars);

  const vignetteMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 1.8, 48, 8),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
  );
  vignetteMesh.renderOrder = 999;
  scene.add(vignetteMesh);

  return { scene, camera, renderer, world, strips, stars, starCount, vignetteMesh };
}

export function makeCanvasPlane(w = 512, h = 256, planeW = 1.0, planeH = 0.4) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(planeW, planeH),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
  );
  mesh.renderOrder = 997;
  return { canvas, ctx, tex, mesh };
}
