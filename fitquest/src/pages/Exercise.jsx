import { useState } from "react";
import { supabase } from "../lib/supabase";
import ExerciseCam from "../components/ExerciseCam";
import { REP_VALUE, effort, pointsFor } from "../lib/scoring";

const LABELS = { squat: "Squats", pushup: "Push-ups" };

export default function Exercise({ profile, refreshProfile }) {
  const [type, setType] = useState("squat");
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState("");

  async function finish(reps) {
    setActive(false);
    if (reps === 0) return setMsg("No reps counted.");
    const { error } = await supabase
      .from("activities")
      .insert({ user_id: profile.id, type, value: reps });
    if (error) return setMsg(error.message);
    const pts = pointsFor(effort({ type, value: reps }));
    await supabase.from("profiles").update({ points: profile.points + pts }).eq("id", profile.id);
    await refreshProfile();
    setMsg(`Saved ${reps} ${LABELS[type].toLowerCase()}. You earned ${pts} points.`);
  }

  if (active) return <ExerciseCam type={type} onFinish={finish} />;

  return (
    <div>
      <div className="card">
        <h2>Train with your camera</h2>
        <p className="muted" style={{ margin: "6px 0 16px" }}>
          The app counts each full rep, so only real effort earns points.
        </p>

        <div className="seg">
          {Object.keys(REP_VALUE).map((t) => (
            <button key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{LABELS[t]}</button>
          ))}
        </div>

        <div className="row"><span>Prop your phone about 2 m away</span></div>
        <div className="row"><span>Stand side-on so your full body is visible</span></div>
        <div className="row"><span>Use good light and a plain background</span></div>

        <button className="btn btn-forest btn-block" style={{ marginTop: 16 }}
          onClick={() => { setMsg(""); setActive(true); }}>
          Start camera
        </button>
        {msg && <p className="muted" style={{ marginTop: 12 }}>{msg}</p>}
      </div>
    </div>
  );
}