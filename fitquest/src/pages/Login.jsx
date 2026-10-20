import { useState } from "react";
import { supabase } from "../lib/supabase";
import { NEIGHBOURHOODS } from "../lib/scoring";

export default function Login({ onDone }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [hood, setHood] = useState(NEIGHBOURHOODS[0]);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return setErr(error.message);
      if (!data.session) return setErr("Turn off 'Confirm email' in Supabase Auth settings.");
      const { error: e2 } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, name, neighbourhood: hood });
      if (e2) return setErr(e2.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setErr(error.message);
    }
    onDone();
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>FitQuest</h2>
      {mode === "signup" && (
        <>
          <input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} required />
          <select value={hood} onChange={(e) => setHood(e.target.value)}>
            {NEIGHBOURHOODS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </>
      )}
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {err && <p className="warn">{err}</p>}
      <button className="primary" type="submit">{mode === "signup" ? "Create account" : "Log in"}</button>
      <button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
        {mode === "signup" ? "I already have an account" : "Create a new account"}
      </button>
    </form>
  );
}