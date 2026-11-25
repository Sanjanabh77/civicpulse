import { statusColor, statusLabel } from '../../lib/status.js';

export default function StatusBadge({ status }) {
  const c = statusColor(status);
  return (
    <span className="p4-badge" style={{ background: c + '1f', color: c, borderColor: c + '55' }}>
      {statusLabel(status)}
    </span>
  );
}
