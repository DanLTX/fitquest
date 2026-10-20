import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { MISSIONS, startOfDay } from "../lib/scoring";

export default function Missions({ profile, refreshProfile }) {
  const [acts, setActs] = useState([]);

  async function load() {
    const { data } = await supabase
      .from("activities")
      .select("type,value,flagged")
      .eq("user_id", profile.id)
      .gte("created_at", startOfDay());
    setActs(data ?? []);
  }

  useEffect(() => { load(); }, [profile.points]);

  async function claim(m) {
    const { error } = await supabase
      .from("activities")
      .insert({ user_id: profile.id, type: `mission:${m.id}`, value: m.points });
    if (error) return alert(error.message);
    await supabase.from("profiles").update({ points: profile.points + m.points }).eq("id", profile.id);
    await refreshProfile();
  }

  return (
    <div className="card">
      <h3>Daily missions</h3>
      {MISSIONS.map((m) => {
        const value = m.measure(acts);
        const done = value >= m.goal;
        const claimed = acts.some((a) => a.type === `mission:${m.id}`);
        return (
          <div key={m.id} className="row">
            <div>
              <b>{m.title}</b>
              <div className="small">{Math.min(value, m.goal)} / {m.goal}</div>
            </div>
            {claimed ? <span>Claimed</span> : (
              <button disabled={!done} onClick={() => claim(m)}>+{m.points} pts</button>
            )}
          </div>
        );
      })}
    </div>
  );
}