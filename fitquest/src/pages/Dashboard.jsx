import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 864e5).toISOString();
      const { data } = await supabase
        .from("activities")
        .select("user_id,type,value,park,flagged,created_at")
        .not("type", "like", "mission:%")
        .gte("created_at", since);
      const rows = data ?? [];
      const byHour = Array(24).fill(0);
      const byPark = {};
      rows.forEach((r) => {
        byHour[new Date(r.created_at).getHours()]++;
        if (r.park) byPark[r.park] = (byPark[r.park] ?? 0) + 1;
      });
      setStats({
        users: new Set(rows.map((r) => r.user_id)).size,
        sessions: rows.length,
        flagged: rows.filter((r) => r.flagged).length,
        byHour,
        byPark,
      });
    })();
  }, []);

  if (!stats) return <p>Loading...</p>;
  const max = Math.max(...stats.byHour, 1);

  return (
    <div>
      <div className="card">
        <h3>Township dashboard (last 7 days)</h3>
        <div className="row"><span>Active residents</span><b>{stats.users}</b></div>
        <div className="row"><span>Activity sessions</span><b>{stats.sessions}</b></div>
        <div className="row"><span>Flagged as suspicious</span><b>{stats.flagged}</b></div>
      </div>
      <div className="card">
        <h3>Usage by hour</h3>
        <div className="bars">
          {stats.byHour.map((n, h) => (
            <div key={h} className="bar" title={`${h}:00 - ${n}`} style={{ height: (n / max) * 100 + "%" }} />
          ))}
        </div>
        <div className="small">0h to 23h</div>
      </div>
      <div className="card">
        <h3>Sessions by park</h3>
        {Object.entries(stats.byPark).map(([p, n]) => (
          <div key={p} className="row"><span>{p}</span><b>{n}</b></div>
        ))}
      </div>
    </div>
  );
}