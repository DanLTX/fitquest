export function haversine(a, b) {
  const R = 6371000;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// iOS needs this called from a button tap
export async function requestMotionPermission() {
  if (typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function") {
    return (await DeviceMotionEvent.requestPermission()) === "granted";
  }
  return true;
}

export function startTracking(onUpdate) {
  let steps = 0, lastStepT = 0, smooth = 0;
  let distance = 0, lastPos = null, speed = 0;
  let flagged = false, reason = null;
  const intervals = [];
  let wakeLock = null;

  // Keep the screen on (the PWA cannot count steps in the background)
  navigator.wakeLock?.request("screen").then((l) => (wakeLock = l)).catch(() => {});

  const flag = (r) => {
    if (!flagged) { flagged = true; reason = r; }
  };

  const emit = () =>
    onUpdate({ steps, distance: Math.round(distance), flagged, reason, pos: lastPos });

  const check = () => {
    // 1. Vehicle: sustained speed above ~10 km/h is not walking
    if (speed > 2.8) flag("speed_too_high");
    // 2. Shaking: many steps but almost no GPS movement (only if GPS has a fix)
    if (lastPos && steps > 50 && distance < steps * 0.2) flag("steps_without_movement");
    // 3. Robotic cadence: shaking is unnaturally regular
    if (intervals.length >= 20) {
      const mean = intervals.reduce((s, x) => s + x, 0) / intervals.length;
      const sd = Math.sqrt(
        intervals.reduce((s, x) => s + (x - mean) ** 2, 0) / intervals.length
      );
      if (sd / mean < 0.03) flag("robotic_cadence");
    }
  };

  const onMotion = (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const m = Math.hypot(a.x, a.y, a.z) - 9.8;
    smooth = smooth * 0.8 + m * 0.2;
    const t = performance.now();
    if (smooth > 1.2 && t - lastStepT > 300) {
      if (lastStepT) intervals.push(t - lastStepT);
      if (intervals.length > 30) intervals.shift();
      lastStepT = t;
      steps++;
      check();
      emit();
    }
  };

  const watch = navigator.geolocation.watchPosition(
    (p) => {
      speed = p.coords.speed ?? 0;
      if (p.coords.accuracy <= 30) {
        if (lastPos) distance += haversine(lastPos, p.coords);
        lastPos = p.coords;
      }
      check();
      emit();
    },
    null,
    { enableHighAccuracy: true }
  );

  window.addEventListener("devicemotion", onMotion);

  return {
    stop() {
      window.removeEventListener("devicemotion", onMotion);
      navigator.geolocation.clearWatch(watch);
      wakeLock?.release?.();
    },
  };
}