import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { startTracking, requestMotionPermission, haversine } from "../lib/tracking";
import { PARKS, DEMO_MODE, pointsFor, effort, startOfDay } from "../lib/scoring";
import Missions from "../components/Missions";
import Ring from "../components/Ring";

export default function Home({ profile, refreshProfile }) {
  const [parkIdx, setParkIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState({ steps: 0, distance: 0, flagged: false });
  const [today, setToday] = useState(0);
  const [msg, setMsg] = useState("");
  const [version, setVersion] = useState(0);
  const handle = useRef(null);
  const park = PARKS[parkIdx];
  

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("activities")
        .select("type,value")
        .eq("user_id", profile.id)
        .eq("flagged", false)
        .gte("created_at", startOfDay());
      setToday((data ?? []).reduce((s, a) => s + effort(a), 0));
    })();
  }, [profile.points, version]);

  async function start() {
    setMsg("");
    const ok = await requestMotionPermission();
    if (!ok) return setMsg("Motion access was denied. Allow it in your browser settings.");
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
    if (d > park.radius) return setMsg("You are outside the park, so these steps were not saved.");
  }

  if (!flagged) setToday((t) => t + steps); // show the new total immediately

  const { error } = await supabase.from("activities").insert({
    user_id: profile.id, type: "steps", value: steps,
    park: park.name, flagged, flag_reason: reason,
  });
  if (error) {
    if (!flagged) setToday((t) => t - steps); // undo if saving failed
    return setMsg(error.message);
  }

  if (!flagged) {
    await supabase.from("profiles")
      .update({ points: profile.points + pointsFor(steps) })
      .eq("id", profile.id);
  }
  await refreshProfile();
  setVersion((v) => v + 1); // reload today's total and missions
  setMsg(flagged ? `Not counted: ${reason}.` : `Saved ${steps} steps.`);
}

  const total = today + (running ? live.steps : 0);

  return (
    <div>
      <section className="hero">
        <select className="park-select" value={parkIdx} disabled={running} onChange={(e) => setParkIdx(+e.target.value)}>
          {PARKS.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
        </select>

        <Ring value={total} max={profile.baseline_steps} size={210} stroke={16}>
          <span className="ring-num">{total.toLocaleString()}</span>
          <span className="ring-sub">of your {profile.baseline_steps.toLocaleString()} goal</span>
        </Ring>

        <div className="stats">
          <div className="stat"><b>{running ? live.steps : 0}</b><span>this walk</span></div>
          <div className="stat"><b>{running ? live.distance : 0} m</b><span>distance</span></div>
          <div className="stat"><b>{profile.league}</b><span>league</span></div>
        </div>

        {running && live.flagged && (
          <div className="warn-banner">This walk looks unusual ({live.reason}) and may not count.</div>
        )}

        {running ? (
          <button className="btn btn-light btn-block" onClick={stop}>
            <span className="rec-dot" /> Stop and save
          </button>
        ) : (
          <button className="btn btn-sun btn-block" onClick={start}>Start walking</button>
        )}
        <p className="hero-msg">{running ? "Keep this screen open while you walk." : msg}</p>
      </section>

      <Missions profile={profile} refreshProfile={refreshProfile} refreshKey={version} />
    </div>
  );
}