import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { startTracking, requestMotionPermission, haversine } from "../lib/tracking";
import { PARKS, DEMO_MODE, pointsFor } from "../lib/scoring";
import Missions from "../components/Missions";

export default function Home({ profile, refreshProfile }) {
  const [parkIdx, setParkIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState({ steps: 0, distance: 0, flagged: false });
  const [msg, setMsg] = useState("");
  const handle = useRef(null);
  const park = PARKS[parkIdx];

  async function start() {
    setMsg("");
    const ok = await requestMotionPermission();
    if (!ok) return setMsg("Motion permission was denied. Allow it in browser settings.");
    setLive({ steps: 0, distance: 0, flagged: false });
    handle.current = startTracking(setLive);
    setRunning(true);
  }

  async function stop() {
    handle.current?.stop();
    setRunning(false);
    const { steps, flagged, reason, pos } = live;
    if (steps === 0) return setMsg("No steps recorded.");

    if (!DEMO_MODE) {
      const d = pos ? haversine(pos, { latitude: park.lat, longitude: park.lng }) : Infinity;
      if (d > park.radius) return setMsg("You are not inside the park, so steps were not saved.");
    }

    const { error } = await supabase.from("activities").insert({
      user_id: profile.id, type: "steps", value: steps,
      park: park.name, flagged, flag_reason: reason,
    });
    if (error) return setMsg(error.message);

    if (!flagged) {
      await supabase.from("profiles")
        .update({ points: profile.points + pointsFor(steps) })
        .eq("id", profile.id);
    }
    await refreshProfile();
    setMsg(flagged ? `Flagged (${reason}). Not counted.` : `Saved ${steps} steps.`);
  }

  return (
    <div>
      <div className="card">
        <h3>Today's park challenge</h3>
        <select value={parkIdx} disabled={running} onChange={(e) => setParkIdx(+e.target.value)}>
          {PARKS.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
        </select>
        <h1 className="big">{live.steps} steps</h1>
        <p className="small">Distance: {live.distance} m {live.flagged && " | FLAGGED"}</p>
        <p className="small">Keep this screen open while walking.</p>
        {running
          ? <button className="primary" onClick={stop}>Stop and save</button>
          : <button className="primary" onClick={start}>Start walking</button>}
        {msg && <p>{msg}</p>}
      </div>
      <Missions profile={profile} refreshProfile={refreshProfile} />
    </div>
  );
}