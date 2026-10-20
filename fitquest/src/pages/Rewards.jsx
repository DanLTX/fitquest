import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Rewards({ profile, refreshProfile }) {
  const [rewards, setRewards] = useState([]);
  const [claims, setClaims] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await supabase.from("rewards").select("*").order("cost");
    const c = await supabase
      .from("claims")
      .select("id,created_at,rewards(title,sponsor)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    setRewards(r.data ?? []);
    setClaims(c.data ?? []);
  }

  useEffect(() => { load(); }, []);

  async function claim(r) {
    if (profile.points < r.cost) return setMsg("Not enough points yet.");
    const { error } = await supabase.from("claims").insert({ user_id: profile.id, reward_id: r.id });
    if (error) return setMsg(error.message);
    await supabase.from("profiles").update({ points: profile.points - r.cost }).eq("id", profile.id);
    await refreshProfile();
    await load();
    setMsg(`Claimed: ${r.title}`);
  }

  return (
    <div>
      <div className="balance">
        <span>Your points</span>
        <b>{profile.points}</b>
      </div>

      <div className="card">
        <h3>Rewards from local shops</h3>
        {rewards.map((r) => (
          <div key={r.id} className="row">
            <span className="logo-dot">{r.sponsor?.[0]}</span>
            <div className="grow">
              <b>{r.title}</b>
              <div className="muted">{r.sponsor}</div>
            </div>
            <button className="btn btn-sm btn-forest" disabled={profile.points < r.cost} onClick={() => claim(r)}>
              {r.cost} pts
            </button>
          </div>
        ))}
        {msg && <p className="muted" style={{ marginTop: 10 }}>{msg}</p>}
      </div>

      <div className="card">
        <h3>My vouchers</h3>
        {claims.length === 0 && <p className="empty">No vouchers yet. Earn points to claim one.</p>}
        {claims.map((c) => (
          <div key={c.id} className="voucher">
            <div>
              <b>{c.rewards?.title}</b>
              <div className="muted">{c.rewards?.sponsor}</div>
            </div>
            <code>FQ-{c.id}</code>
          </div>
        ))}
      </div>
    </div>
  );
}