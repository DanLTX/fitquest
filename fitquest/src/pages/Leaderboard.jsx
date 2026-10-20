import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { effort, dailyScore, startOfDay } from "../lib/scoring";

export default function Leaderboard({ profile }) {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState("league");

  async function load() {
    const { data, error } = await supabase
      .from("activities")
      .select("user_id,type,value,profiles(name,league,neighbourhood,baseline_steps)")
      .eq("flagged", false)
      .gte("created_at", startOfDay());
    if (error) return console.error(error);

    const byUser = {};
    for (const a of data) {
      if (!a.profiles) continue;
      const u = (byUser[a.user_id] ??= { user_id: a.user_id, ...a.profiles, total: 0 });
      u.total += effort(a);
    }
    setRows(
      Object.values(byUser)
        .map((u) => ({ ...u, score: dailyScore(u.total, u.baseline_steps) }))
        .filter((u) => u.total > 0)
    );
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("lb")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activities" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const medal = ["1st", "2nd", "3rd"];

  const league = rows
    .filter((r) => r.league === profile.league)
    .sort((a, b) => b.score - a.score);

  const teams = Object.values(
    rows.reduce((acc, r) => {
      const t = (acc[r.neighbourhood] ??= { name: r.neighbourhood, sum: 0, n: 0 });
      t.sum += r.score; t.n++;
      return acc;
    }, {})
  )
    .map((t) => ({ ...t, avg: Math.round(t.sum / t.n) }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="card">
      <div className="row">
        <button className={view === "league" ? "primary" : ""} onClick={() => setView("league")}>
          {profile.league} league
        </button>
        <button className={view === "teams" ? "primary" : ""} onClick={() => setView("teams")}>
          Neighbourhoods
        </button>
      </div>

      {view === "league" && (league.length === 0 ? <p>No activity yet today.</p> :
        league.map((r, i) => (
          <div key={r.user_id} className={"row" + (r.user_id === profile.id ? " me" : "")}>
            <span>{medal[i] ?? i + 1 + "th"} {r.name}</span>
            <b>{r.score}</b>
          </div>
        )))}

      {view === "teams" && (teams.length === 0 ? <p>No activity yet today.</p> :
        teams.map((t, i) => (
          <div key={t.name} className="row">
            <span>{medal[i] ?? i + 1 + "th"} {t.name} ({t.n} active)</span>
            <b>{t.avg}</b>
          </div>
        )))}

      <p className="small">Score = today's effort vs your own baseline. Team score = average per active member.</p>
    </div>
  );
}