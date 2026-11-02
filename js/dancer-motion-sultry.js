// The second dance: the same card body as the salsa, moving slow and heavy instead of on
// the beat. Same seam as dancer-motion.js (numbers in, pose out, no Three, no DOM) and the
// same sign conventions, which dancer-figure.js applies.
//
// Why the salsa reads as stiff, and what this one does instead:
//   - Every salsa joint is a keyframe on the beat, so the whole body pivots in lockstep.
//     Here the body is driven by a few slow waves, and each joint above the hips rides the
//     same wave a little later, so a hip movement rolls up through the waist, the chest and
//     the head instead of arriving everywhere at once.
//   - The hips do the dancing. They sway side to side once every two counts, and they
//     linger at each side instead of bouncing off it; the hip on the standing leg lifts and
//     the hips circle forward and back as they cross. That is the figure eight.
//   - The weight really changes legs. The standing leg is long, the other knee softens and
//     comes in with the toe down, and both are solved from the hip position so the feet
//     stay roughly where they are instead of skating with the hips.
//   - The shoulders answer the hips: the chest tilts and turns against them, which puts the
//     S-curve in the spine that a level, upright torso never has.
//   - The arms are the only keyframed part, and they are slow: one hand traces up the body
//     and over the head while the other rests on the hip, then they trade. The forearm and
//     the hand trail the upper arm, so the wrist leads and the fingers follow.
//
// Her L is at +X (screen right); she faces the camera.

export const BPM = 40;
export const COUNT = 60 / BPM; // 1.5 s: three times the salsa's count, so the whole dance is a third of its speed
export const LOOP = COUNT * 8; // 12.0 s: two bars at this tempo, and the win card waits for both

export const JOINT_NAMES = [
  'hips', 'spine', 'chest', 'neck', 'head',
  'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR',
  'armL', 'foreL', 'handL', 'armR', 'foreR', 'handR',
];

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const SWAY = COUNT * 2; // one side-to-side hip cycle every two counts
const HIP_HALF = 0.085; // hip joint offset from the centre, as built in dancer-figure.js
const LEG = 0.92; // thigh + shin

// Seconds each part trails the hips. These scale with the tempo rather than staying fixed:
// a wave that is half as fast needs twice the lag to keep the same shape, and a lag left in
// real seconds would make the slower dance read tighter and stiffer than the fast one. Past
// about half a count the shoulders stop belonging to the hips and it reads as two people.
export const LAG = {
  spine: 0.16,
  chest: 0.36,
  neck: 0.52,
  head: 0.68,
  fore: 0.24,
  hand: 0.52,
};

// A sine that lingers at its peaks and crosses the middle quickly. Its slope and curvature
// both vanish at +-1, so the hips settle into each side instead of turning around on it.
function linger(s) {
  return (3 * s - s * s * s) / 2;
}

// The hips, as a function of time. Everything above them samples this same function a
// little earlier, which is the whole wave.
function hipsAt(t) {
  const phase = (TAU * t) / SWAY;
  const side = linger(Math.sin(phase)); // +1: weight on her left, -1: on her right
  const turn = Math.sin((TAU * t) / LOOP); // slow: she angles to one side, then the other
  return {
    side,
    x: 0.075 * side,
    z: 0.025 * Math.sin(2 * phase),
    lift: 13 * side, // the hip over the standing leg rises
    circle: 14 * Math.cos(phase) + 10 * turn, // the hips roll forward and back as they cross
    tuck: 4 + 3.5 * Math.sin(2 * phase - 0.6), // a small pelvic roll on every count
  };
}

// The leg under a hip. Weight 1 is the standing leg: long, nearly straight. Weight 0 is the
// resting leg: knee soft and in, heel up. Both are aimed back under the hip joint so the
// foot does not skate when the hips travel.
function leg(hips, sideSign, weight) {
  const rest = 1 - weight;
  const joint = sideSign * HIP_HALF + hips.x;
  const footX = sideSign * HIP_HALF * 0.85 - sideSign * 0.05 * rest; // the resting foot comes in
  const aim = Math.atan2(footX - joint, LEG) / DEG;
  const knee = 5 + 30 * rest;
  return {
    thigh: [knee * 0.55 - hips.tuck, 0, aim - hips.lift],
    shin: [-knee, 0, 0],
    foot: [6 + 30 * rest, 0, 0],
    drop: LEG * (1 - Math.cos(aim * DEG)),
  };
}

// --- arms: the one keyframed layer ----------------------------------------
// Eight keys, one per count. Each key is [armL, foreL, handL, armR, foreR, handR].
const HIP_HAND_L = [[-10, 0, 34], [0, 0, -68], [0, 0, -12]];
const HIP_HAND_R = [[-10, 0, -34], [0, 0, 68], [0, 0, 12]];
// The forearm angles above the elbow keep turning the same way rather than taking the short
// way round (-250 rather than +110): the short way swings the forearm straight out to the
// side as the elbow lifts, and the hand has to stay on the body all the way up.
const ARM_KEYS = [
  // 1 — both hands on the hips, elbows out
  [...HIP_HAND_L, ...HIP_HAND_R],
  // 2 — her left hand leaves the hip and slides up across her waist
  [[15, 0, 8], [45, 0, -100], [10, 0, -20], ...HIP_HAND_R],
  // 3 — on up the front of her body to the collarbone, elbow still low
  [[50, 0, 14], [20, 0, -140], [10, 0, -16], ...HIP_HAND_R],
  // 4 — the elbow lifts and the hand slips behind her head
  [[-10, 0, 140], [0, 0, -250], [0, 0, 20], ...HIP_HAND_R],
  // 5 — she holds it there while the right hand slides up across her waist
  [[-8, 0, 144], [0, 0, -254], [0, 0, 26], [15, 0, -8], [45, 0, 100], [10, 0, 20]],
  // 6 — right hand on up to the collarbone
  [[-10, 0, 142], [0, 0, -252], [0, 0, 18], [50, 0, -14], [20, 0, 140], [10, 0, 16]],
  // 7 — both arms high, wrists meeting above her head
  [[6, 0, 165], [0, 0, -300], [0, 0, 20], [6, 0, -165], [0, 0, 300], [0, 0, -20]],
  // 8 — the hands come back down the way they went up: past her ears to the collarbone,
  //     elbows in, then down the front of her body to the hips on the 1. Swinging the
  //     elbows down out to the sides instead reads as a flex.
  [[50, 0, 14], [20, 0, -140], [10, 0, -16], [50, 0, -14], [20, 0, 140], [10, 0, 16]],
];
const ARM_JOINTS = ['armL', 'foreL', 'handL', 'armR', 'foreR', 'handR'];
const ARM_LAG = { armL: 0, foreL: LAG.fore, handL: LAG.hand, armR: 0, foreR: LAG.fore, handR: LAG.hand };

function catmull(p0, p1, p2, p3, u) {
  const u2 = u * u;
  const u3 = u2 * u;
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
}

function wrap(t) {
  return ((t % LOOP) + LOOP) % LOOP;
}

function armAt(index, t) {
  const time = wrap(t) / COUNT;
  const N = ARM_KEYS.length;
  const i = Math.min(N - 1, Math.floor(time));
  const u = time - i;
  const k = (n) => ARM_KEYS[(n + N) % N][index];
  const a = k(i - 1);
  const b = k(i);
  const c = k(i + 1);
  const d = k(i + 2);
  return [0, 1, 2].map((ch) => catmull(a[ch], b[ch], c[ch], d[ch], u));
}

// --- the pose -------------------------------------------------------------

// Degrees, for a human comparing a readout to the notes above.
export function sampleDegrees(time) {
  const t = wrap(time);
  const hips = hipsAt(t);
  const wave = (lag) => hipsAt(t - lag);
  const spineW = wave(LAG.spine);
  const chestW = wave(LAG.chest);
  const neckW = wave(LAG.neck);
  const headW = wave(LAG.head);

  const weightL = (1 + hips.side) / 2;
  const left = leg(hips, 1, weightL);
  const right = leg(hips, -1, 1 - weightL);
  // The standing leg sets the height: the hip over it is lifted, so the root drops by the
  // same amount, plus whatever the leg's own angle costs. A soft standing knee sinks her a
  // little more, which is what makes the stance look weighted rather than posed. The two
  // legs are blended by weight rather than picked, or the body hops as the weight crosses.
  const drop = weightL * left.drop + (1 - weightL) * right.drop;
  const lifted = HIP_HALF * Math.sin(Math.abs(hips.lift) * DEG);
  const root = [hips.x, -lifted - drop - 0.012, hips.z];

  const joints = {
    hips: [hips.tuck, hips.circle, hips.lift],
    // The S-curve: the waist starts to answer the hips, the chest answers fully and late,
    // and the chest also rolls forward and back on every count.
    spine: [1 + 2 * Math.sin((TAU * (t - LAG.spine)) / COUNT), -0.45 * spineW.circle, -0.8 * spineW.lift],
    chest: [2 + 4 * Math.sin((TAU * (t - LAG.chest)) / COUNT - 0.6), -0.5 * chestW.circle, -0.9 * chestW.lift],
    neck: [-2, 0.15 * neckW.circle, 0.25 * neckW.lift],
    // The head tips toward the lifted hip, a beat behind it, and drops slightly.
    head: [-6, 0.2 * headW.circle, 0.45 * headW.lift],
    thighL: left.thigh, shinL: left.shin, footL: left.foot,
    thighR: right.thigh, shinR: right.shin, footR: right.foot,
  };
  ARM_JOINTS.forEach((name, index) => {
    joints[name] = armAt(index, t - ARM_LAG[name]);
  });
  // The wrists keep moving even when an arm is still, on the same slow wave as the chest.
  joints.handL[0] += 10 * Math.sin((TAU * (t - LAG.hand)) / SWAY);
  joints.handR[0] += 10 * Math.sin((TAU * (t - LAG.hand)) / SWAY + Math.PI);
  return { root, joints };
}

// Radians, ready for Object3D.rotation.
export function sample(t) {
  const { root, joints } = sampleDegrees(t);
  const out = { root, joints: {} };
  for (const name of JOINT_NAMES) out.joints[name] = joints[name].map((v) => v * DEG);
  return out;
}

// Which count (1-8) the time sits on.
export function countAt(t) {
  return Math.floor(wrap(t) / COUNT) + 1;
}
