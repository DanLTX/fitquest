// Replace with real park coordinates: Google Maps, right-click the park, click the lat,lng to copy.
export const PARKS = [
  { name: "Central Park", lat: 3.139, lng: 101.6869, radius: 300 },
  { name: "Lakeside Park", lat: 3.15, lng: 101.7, radius: 300 },
];

// true = skip the "must be inside the park" check so you can demo from your room.
export const DEMO_MODE = true;

export const NEIGHBOURHOODS = ["Block A", "Block B", "Block C", "Block D"];

// Exercise reps converted to step-equivalent effort
export const REP_VALUE = { squat: 10, pushup: 15 };

export const effort = (a) =>
  a.type === "steps" ? a.value : (REP_VALUE[a.type] ?? 0) * a.value;

// Score is effort vs personal baseline, capped at 200 so nobody runs away
export const dailyScore = (total, baseline) =>
  Math.round(Math.min(total / Math.max(baseline, 1), 2) * 100);

export const leagueFor = (avgSteps) =>
  avgSteps < 4000 ? "bronze" : avgSteps < 8000 ? "silver" : "gold";

// 5000 effort = 100 points
export const pointsFor = (total) => Math.round(total / 50);

const sum = (acts, type) =>
  acts.filter((a) => a.type === type && !a.flagged).reduce((s, a) => s + a.value, 0);

export const MISSIONS = [
  { id: "walk2k",   title: "Walk 2,000 steps", goal: 2000, points: 20, measure: (a) => sum(a, "steps") },
  { id: "squat20",  title: "Do 20 squats",     goal: 20,   points: 15, measure: (a) => sum(a, "squat") },
  { id: "pushup10", title: "Do 10 push-ups",   goal: 10,   points: 15, measure: (a) => sum(a, "pushup") },
];

export const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};