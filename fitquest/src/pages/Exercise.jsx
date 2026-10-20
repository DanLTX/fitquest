import { useState } from "react";
import { supabase } from "../lib/supabase";
import ExerciseCam from "../components/ExerciseCam";
import { REP_VALUE, effort, pointsFor } from "../lib/scoring";

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
    setMsg(`Saved ${reps} ${type}s (+${pts} pts).`);
  }

  if (active) return <div className="card"><ExerciseCam type={type} onFinish={finish} /></div>;

  return (
    <div className="card">
      <h3>AI exercise counter</h3>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {Object.keys(REP_VALUE).map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <p className="small">
        Prop your phone about 2 m away, filming from the side, with your full body in view and good light.
      </p>
      <button className="primary" onClick={() => { setMsg(""); setActive(true); }}>Start camera</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}