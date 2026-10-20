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

  if (!stats) return <p className="empty">Loading...</p>;
  const max = Math.max(...stats.byHour, 1);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Township view</h2>
      <div className="tiles">
        <div className="tile"><b>{stats.users}</b><span>active residents</span></div>
        <div className="tile"><b>{stats.sessions}</b><span>sessions</span></div>
        <div className="tile"><b>{stats.flagged}</b><span>flagged</span></div>
      </div>

      <div className="card">
        <h3>When people exercise</h3>
        <div className="muted">Sessions by hour, last 7 days</div>
        <div className="bars">
          {stats.byHour.map((n, h) => (
            <div key={h} className="bar" title={`${h}:00 - ${n}`} style={{ height: (n / max) * 100 + "%" }} />
          ))}
        </div>
        <div className="axis"><span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>11 pm</span></div>
      </div>

      <div className="card">
        <h3>Busiest parks</h3>
        {Object.keys(stats.byPark).length === 0 && <p className="empty">No park activity yet.</p>}
        {Object.entries(stats.byPark).sort((a, b) => b[1] - a[1]).map(([p, n]) => (
          <div key={p} className="row"><span>{p}</span><b>{n}</b></div>
        ))}
      </div>
    </div>
  );
}