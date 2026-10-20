const TABS = [
  ["home", "Home"],
  ["exercise", "Exercise"],
  ["board", "Ranking"],
  ["rewards", "Rewards"],
  ["dash", "Township"],
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="nav">
      {TABS.map(([id, label]) => (
        <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
          {label}
        </button>
      ))}
    </nav>
  );
}