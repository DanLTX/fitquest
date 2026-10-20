import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import BottomNav from "./components/BottomNav";
import Icon from "./components/Icon";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Exercise from "./pages/Exercise";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import Dashboard from "./pages/Dashboard";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("home");

  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(data);
  }

  async function afterLogin() {
    const { data } = await supabase.auth.getSession();
    if (data.session) await loadProfile(data.session.user.id);
  }

  useEffect(() => {
    afterLogin().finally(() => setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <p className="empty">Loading...</p>;
  if (!profile) return <div className="app"><Login onDone={afterLogin} /></div>;

  const props = { profile, refreshProfile: afterLogin };

  return (
    <div className="app">
      <header className="top">
        <div className="hello">
          <small>{greeting()}</small>
          <b>{(profile.name || "").split(" ")[0]}</b>
        </div>
        <div className="top-right">
          <div className="coins"><span className="coin-dot" />{profile.points}</div>
          <button className="icon-btn" aria-label="Log out" onClick={() => supabase.auth.signOut()}>
            <Icon name="logout" size={18} />
          </button>
        </div>
      </header>

      {tab === "home" && <Home {...props} />}
      {tab === "exercise" && <Exercise {...props} />}
      {tab === "board" && <Leaderboard {...props} />}
      {tab === "rewards" && <Rewards {...props} />}
      {tab === "dash" && <Dashboard />}

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}