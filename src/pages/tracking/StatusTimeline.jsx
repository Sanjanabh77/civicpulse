import { statusColor, statusLabel } from '../../lib/status.js';
import {
  FileText,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

const FLOW = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed'];

function getStepIcon(status, color) {
  const props = { size: 14, color, strokeWidth: 2.2 };
  switch (status) {
    case 'submitted':
      return <FileText {...props} />;
    case 'assigned':
      return <UserCheck {...props} />;
    case 'in_progress':
      return <Clock {...props} />;
    case 'escalated':
      return <AlertTriangle {...props} />;
    case 'resolved':
      return <CheckCircle2 {...props} />;
    case 'closed':
      return <CheckCheck {...props} />;
    case 'reopened':
      return <RotateCcw {...props} />;
    default:
      return <Clock {...props} />;
  }
}

function getUpcomingSteps(events, status) {
  if (status === 'closed') return [];
  const lastReopenIdx = events.map((e) => e.status).lastIndexOf('reopened');
  if (lastReopenIdx >= 0) {
    const postReopenEvents = events.slice(lastReopenIdx + 1);
    const reachedAfterReopen = Math.max(...postReopenEvents.map((e) => FLOW.indexOf(e.status)), -1);
    const effectiveReached = Math.max(reachedAfterReopen, 1);
    return FLOW.slice(effectiveReached + 1);
  }
  if (status === 'reopened') {
    return ['in_progress', 'resolved', 'closed'];
  }
  const reached = Math.max(...events.map((e) => FLOW.indexOf(e.status)), -1);
  return FLOW.slice(reached + 1);
}

export default function StatusTimeline({ events = [], status }) {
  const safeEvents = Array.isArray(events) ? events : [];
  const upcoming = getUpcomingSteps(safeEvents, status);

  return (
    <div style={{ position: 'relative', paddingLeft: 6 }}>
      {safeEvents.length === 0 && (
        <div
          style={{
            padding: '12px 14px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: 8,
            color: '#64748b',
            fontSize: 13,
            marginBottom: upcoming.length > 0 ? 16 : 0,
          }}
        >
          No timeline events recorded yet. Status updates will appear here as your report progresses.
        </div>
      )}

      {(safeEvents.length > 0 || upcoming.length > 0) && (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, borderLeft: '2px solid #e2e8f0' }}>
          {safeEvents.map((e, i) => {
            const color = statusColor(e.status);
            const isCurrent = i === safeEvents.length - 1;
            return (
              <li
                key={i}
                style={{
                  position: 'relative',
                  paddingLeft: 24,
                  paddingBottom: isCurrent && upcoming.length === 0 ? 0 : 20,
                }}
              >
                {/* Timeline marker icon node */}
                <div
                  style={{
                    position: 'absolute',
                    left: -13,
                    top: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: isCurrent ? color : '#ffffff',
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent ? `0 0 0 4px ${color}29` : `0 0 0 2px ${color}14`,
                  }}
                >
                  {getStepIcon(e.status, isCurrent ? '#ffffff' : color)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong
                      style={{
                        fontSize: 14,
                        fontWeight: isCurrent ? 700 : 600,
                        color: isCurrent ? '#0f172a' : '#334155',
                      }}
                    >
                      {statusLabel(e.status)}
                    </strong>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color,
                          background: `${color}1a`,
                          border: `1px solid ${color}44`,
                          padding: '1px 8px',
                          borderRadius: 999,
                        }}
                      >
                        Current
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      {new Date(e.at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {e.note && (
                    <div
                      style={{
                        marginTop: 4,
                        padding: '6px 10px',
                        background: isCurrent ? '#f1f5f9' : '#f8fafc',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#334155',
                        borderLeft: `3px solid ${color}`,
                        lineHeight: 1.4,
                      }}
                    >
                      {e.note}
                    </div>
                  )}
                </div>
              </li>
            );
          })}

          {upcoming.map((s, idx) => (
            <li
              key={s}
              style={{
                position: 'relative',
                paddingLeft: 24,
                paddingBottom: idx === upcoming.length - 1 ? 0 : 16,
                opacity: 0.5,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -9,
                  top: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px solid #cbd5e1',
                }}
              />
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                {statusLabel(s)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
