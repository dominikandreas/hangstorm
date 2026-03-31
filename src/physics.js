export function createPlayerState() {
  return {
    head: { x: 0, y: 1.7, z: 0 },
    prevHead: { x: 0, y: 1.7, z: 0 },
    headVel: { x: 0, y: 0, z: 0 },
    leftHand: { x: -0.25, y: 1.35, z: -0.30 },
    rightHand: { x: 0.25, y: 1.35, z: -0.30 },
    prevLeftHand: { x: -0.25, y: 1.35, z: -0.30 },
    prevRightHand: { x: 0.25, y: 1.35, z: -0.30 },
    leftVel: { x: 0, y: 0, z: 0 },
    rightVel: { x: 0, y: 0, z: 0 },
    leftGrip: false,
    rightGrip: false,
    hanging: false,
    duckAmount: 0,
    leanX: 0,
    pullAmount: 0,
    leftReach: 0,
    rightReach: 0,
    leftPunching: false,
    rightPunching: false,
    forward: { x: 0, y: 0, z: -1 },
  };
}

export const calibration = {
  neutralHead: { x: 0, y: 1.7, z: 0 },
  barHeight: 2.05,
  leanThreshold: 0.20,
  duckThreshold: 0.18,
  pullThreshold: 0.09,
};

function distanceTo(a, aX, aY, aZ) {
  const dx = a.x - aX;
  const dy = a.y - aY;
  const dz = a.z - aZ;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function length(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function derivePlayerState(player, dt) {
  const safeDt = Math.max(dt, 1e-5);
  
  player.headVel.x = (player.head.x - player.prevHead.x) / safeDt;
  player.headVel.y = (player.head.y - player.prevHead.y) / safeDt;
  player.headVel.z = (player.head.z - player.prevHead.z) / safeDt;

  player.leftVel.x = (player.leftHand.x - player.prevLeftHand.x) / safeDt;
  player.leftVel.y = (player.leftHand.y - player.prevLeftHand.y) / safeDt;
  player.leftVel.z = (player.leftHand.z - player.prevLeftHand.z) / safeDt;

  player.rightVel.x = (player.rightHand.x - player.prevRightHand.x) / safeDt;
  player.rightVel.y = (player.rightHand.y - player.prevRightHand.y) / safeDt;
  player.rightVel.z = (player.rightHand.z - player.prevRightHand.z) / safeDt;

  player.leanX = player.head.x - calibration.neutralHead.x;
  player.duckAmount = Math.max(0, calibration.neutralHead.y - player.head.y);

  const shoulderLeftX = calibration.neutralHead.x - 0.22;
  const shoulderRightX = calibration.neutralHead.x + 0.22;
  const shoulderY = calibration.neutralHead.y - 0.18;
  const shoulderZ = calibration.neutralHead.z - 0.08;

  player.leftReach = distanceTo(player.leftHand, shoulderLeftX, shoulderY, shoulderZ);
  player.rightReach = distanceTo(player.rightHand, shoulderRightX, shoulderY, shoulderZ);

  const leftHigh = player.leftHand.y >= calibration.barHeight - 0.14;
  const rightHigh = player.rightHand.y >= calibration.barHeight - 0.14;
  const leftNear = Math.abs(player.leftHand.x - (calibration.neutralHead.x - 0.24)) < 0.30;
  const rightNear = Math.abs(player.rightHand.x - (calibration.neutralHead.x + 0.24)) < 0.30;
  
  player.hanging = player.leftGrip && player.rightGrip && leftHigh && rightHigh && leftNear && rightNear;

  const pullByHeight = player.head.y - calibration.neutralHead.y;
  const pullByVelocity = player.headVel.y * 0.08;
  player.pullAmount = Math.max(0, pullByHeight + pullByVelocity);

  const forwardZ = -0.35;
  player.leftPunching = length(player.leftVel) > 1.2 && player.leftVel.z < forwardZ;
  player.rightPunching = length(player.rightVel) > 1.2 && player.rightVel.z < forwardZ;

  player.prevHead.x = player.head.x;
  player.prevHead.y = player.head.y;
  player.prevHead.z = player.head.z;

  player.prevLeftHand.x = player.leftHand.x;
  player.prevLeftHand.y = player.leftHand.y;
  player.prevLeftHand.z = player.leftHand.z;

  player.prevRightHand.x = player.rightHand.x;
  player.prevRightHand.y = player.rightHand.y;
  player.prevRightHand.z = player.rightHand.z;
}
