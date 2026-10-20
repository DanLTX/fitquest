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

  const rankClass = (i) => (i < 3 ? " r" + (i + 1) : "");

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
    <div>
      <div className="seg">
        <button className={view === "league" ? "on" : ""} onClick={() => setView("league")}>
          {profile.league} league
        </button>
        <button className={view === "teams" ? "on" : ""} onClick={() => setView("teams")}>
          Neighbourhoods
        </button>
      </div>

      <div className="card">
        {view === "league" && (league.length === 0
          ? <p className="empty">No activity yet today. Start a walk to get on the board.</p>
          : league.map((r, i) => (
            <div key={r.user_id} className={"row" + (r.user_id === profile.id ? " me" : "")}>
              <span className={"rank" + rankClass(i)}>{i + 1}</span>
              <div className="grow">
                <b>{r.name}{r.user_id === profile.id && " (you)"}</b>
                <div className="bar-track"><div className="bar-fill" style={{ width: Math.min(r.score / 2, 100) + "%" }} /></div>
              </div>
              <span className="score">{r.score}</span>
            </div>
          )))}

        {view === "teams" && (teams.length === 0
          ? <p className="empty">No activity yet today.</p>
          : teams.map((t, i) => (
            <div key={t.name} className={"row" + (t.name === profile.neighbourhood ? " me" : "")}>
              <span className={"rank" + rankClass(i)}>{i + 1}</span>
              <div className="grow">
                <b>{t.name}</b>
                <div className="muted">{t.n} active</div>
                <div className="bar-track"><div className="bar-fill" style={{ width: Math.min(t.avg / 2, 100) + "%" }} /></div>
              </div>
              <span className="score">{t.avg}</span>
            </div>
          )))}
      </div>

      <p className="muted">
        Score compares today's effort with your own goal. A team's score is the average of its active members.
      </p>
    </div>
  );
}