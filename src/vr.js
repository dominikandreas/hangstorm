import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

export function setupVRInput(scene, renderer) {
  const xrControllers = [];
  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    controller.userData.handedness = 'unknown';
    controller.addEventListener('connected', (e) => {
      controller.userData.inputSource = e.data;
      controller.userData.handedness = e.data.handedness || 'unknown';
    });
    controller.addEventListener('disconnected', () => {
      controller.userData.inputSource = null;
      controller.userData.handedness = 'unknown';
    });
    scene.add(controller);
    xrControllers.push(controller);
  }
  return xrControllers;
}

export function hapticPulse(renderer, intensity = 0.35, durationMs = 40, handedness = 'both') {
  const session = renderer.xr.getSession();
  if (!session) return;
  for (const inputSource of session.inputSources) {
    if (!inputSource.gamepad || !inputSource.gamepad.hapticActuators?.length) continue;
    if (handedness !== 'both' && inputSource.handedness !== handedness) continue;
    try { inputSource.gamepad.hapticActuators[0].pulse(intensity, durationMs); } catch (_) {}
  }
}

export function getVRInputState(renderer, camera, xrControllers) {
  const state = {
    head: new THREE.Vector3(),
    headQuat: new THREE.Quaternion(),
    forward: new THREE.Vector3(),
    left: { pos: null, triggerDown: false, menuDown: false, gripDown: false, controller: null },
    right: { pos: null, triggerDown: false, menuDown: false, gripDown: false, controller: null },
  };

  const xrCamera = renderer.xr.getCamera(camera);
  xrCamera.getWorldPosition(state.head);
  xrCamera.getWorldQuaternion(state.headQuat);
  state.forward.set(0, 0, -1).applyQuaternion(state.headQuat).normalize();

  const tempVecA = new THREE.Vector3();

  for (const controller of xrControllers) {
    if (!controller.userData.inputSource) continue;
    controller.getWorldPosition(tempVecA);
    
    const handedness = controller.userData.handedness;
    const gp = controller.userData.inputSource.gamepad;
    
    const squeeze = !!(gp && gp.buttons && gp.buttons[1] && (gp.buttons[1].pressed || gp.buttons[1].value > 0.55));
    const triggerDown = !!(gp && gp.buttons && gp.buttons[0] && (gp.buttons[0].pressed || gp.buttons[0].value > 0.55));
    const menuDown = !!(gp && (
      (gp.buttons[3] && (gp.buttons[3].pressed || gp.buttons[3].value > 0.55)) ||
      (gp.buttons[4] && (gp.buttons[4].pressed || gp.buttons[4].value > 0.55)) ||
      (gp.buttons[5] && (gp.buttons[5].pressed || gp.buttons[5].value > 0.55))
    ));
    
    const target = handedness === 'left' ? state.left : handedness === 'right' ? state.right : null;
    if (target) {
      target.controller = controller;
      target.triggerDown = triggerDown;
      target.menuDown = menuDown;
      target.gripDown = squeeze;
      target.pos = tempVecA.clone();
    }
  }

  return state;
}
