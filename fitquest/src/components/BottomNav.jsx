import Icon from "./Icon";

const TABS = [
  ["home", "Home", "home"],
  ["exercise", "Train", "train"],
  ["board", "Ranking", "trophy"],
  ["rewards", "Rewards", "gift"],
  ["dash", "Township", "chart"],
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="nav">
      {TABS.map(([id, label, icon]) => (
        <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} aria-label={label}>
          <Icon name={icon} size={20} />
          {label}
        </button>
      ))}
    </nav>
  );
}