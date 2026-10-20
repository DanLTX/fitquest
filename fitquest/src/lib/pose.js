import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

export async function createPose() {
  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  const make = (delegate) =>
    PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL, delegate },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  try {
    return await make("GPU");
  } catch {
    return await make("CPU"); // fallback for phones where GPU fails
  }
}

export function angle(a, b, c) {
  const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  const d = Math.abs((r * 180) / Math.PI);
  return d > 180 ? 360 - d : d;
}

// Landmark indices: shoulder 11/12, elbow 13/14, wrist 15/16,
// hip 23/24, knee 25/26, ankle 27/28 (left/right)
export const EXERCISES = {
  squat:  { sides: [[23, 25, 27], [24, 26, 28]], down: 100, up: 160 },
  pushup: { sides: [[11, 13, 15], [12, 14, 16]], down: 90,  up: 150 },
};

export function makeCounter({ sides, down, up }) {
  let stage = "up", reps = 0, smooth = null;
  return (lm) => {
    // use every side whose joints are clearly visible, then average
    const angles = sides
      .filter((js) => js.every((i) => (lm[i].visibility ?? 1) >= 0.5))
      .map((js) => angle(lm[js[0]], lm[js[1]], lm[js[2]]));

    if (!angles.length) return { reps, stage, angle: null, visible: false };

    const raw = angles.reduce((s, x) => s + x, 0) / angles.length;
    smooth = smooth == null ? raw : smooth * 0.6 + raw * 0.4;

    if (smooth < down && stage === "up") stage = "down";
    else if (smooth > up && stage === "down") {
      stage = "up";
      reps++;
    }
    return { reps, stage, angle: Math.round(smooth), visible: true };
  };
}