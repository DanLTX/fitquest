import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Exercise from "./pages/Exercise";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import Dashboard from "./pages/Dashboard";

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

  if (!ready) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!profile) return <div className="app"><Login onDone={afterLogin} /></div>;

  const props = { profile, refreshProfile: afterLogin };

  return (
    <div className="app">
      <header className="top">
        <b>{profile.name}</b>
        <span>{profile.points} pts | {profile.league}</span>
        <button onClick={() => supabase.auth.signOut()}>Out</button>
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