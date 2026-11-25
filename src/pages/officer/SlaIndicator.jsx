const STYLE = {
  on_track: ['#16a34a', 'On track'],
  due_soon: ['#f59e0b', 'Due soon'],
  overdue: ['#dc2626', 'Overdue'],
  met: ['#16a34a', 'Met'],
  breached: ['#dc2626', 'Breached'],
};

function human(ms) {
  const a = Math.abs(ms) / 36e5;
  return a >= 24 ? `${Math.floor(a / 24)}d ${Math.floor(a % 24)}h` : `${Math.max(1, Math.floor(a))}h`;
}

export default function SlaIndicator({ sla }) {
  if (!sla) return <small style={{ color: '#64748b' }}>-</small>;
  const [color, label] = STYLE[sla.state] ?? STYLE.on_track;
  const text =
    sla.state === 'overdue'
      ? `${human(sla.remainingMs)} late`
      : ['met', 'breached'].includes(sla.state)
        ? label
        : `${human(sla.remainingMs)} left`;
  const pct = Math.max(4, Math.min(100, Number(sla.pctElapsed) || 0));

  return (
    <span title={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <span className="p4-sla">
        <i style={{ width: `${pct}%`, background: color }} />
      </span>
      <small style={{ color, fontWeight: 600 }}>{text}</small>
    </span>
  );
}
