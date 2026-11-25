import { useEffect, useState } from 'react';
import { statusLabel } from '../../lib/status.js';
import { useUpdateStatus } from './dashboardHooks.js';

// Mirrors TRANSITIONS on the server (the server remains the authoritative gatekeeper).
const NEXT = {
  submitted: ['assigned', 'in_progress'],
  assigned: ['in_progress', 'resolved'],
  in_progress: ['resolved'],
  escalated: ['in_progress', 'resolved'],
  reopened: ['assigned', 'in_progress', 'resolved'],
};

const CONTROL_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  color: '#0f172a',
  background: '#ffffff',
  colorScheme: 'light',
};

export default function StatusUpdateModal({ report, onClose }) {
  const options = NEXT[report.status] ?? [];
  const [status, setStatus] = useState(options[0] ?? '');
  const [note, setNote] = useState('');
  const [proof, setProof] = useState('');
  const update = useUpdateStatus();

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !update.isPending) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, update.isPending]);

  const submit = (e) => {
    e.preventDefault();
    if (!status || update.isPending) return;
    const trimmedProof = proof.trim();
    update.mutate(
      {
        id: report._id,
        status,
        note: note.trim(),
        afterImageUrl: status === 'resolved' && trimmedProof ? trimmedProof : undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="p4-status-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.55)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !update.isPending) onClose();
      }}
    >
      <form
        className="p4-card"
        style={{
          width: '100%',
          maxWidth: 400,
          display: 'grid',
          gap: 10,
          color: '#0f172a',
          background: '#ffffff',
          textAlign: 'left',
          boxShadow: '0 20px 50px rgba(0,0,0,.25)',
        }}
        onSubmit={submit}
      >
        <div>
          <strong id="p4-status-modal-title" style={{ display: 'block', fontSize: 15 }}>
            Update: {report.title}
          </strong>
          <small style={{ color: '#64748b' }}>
            Current status: {statusLabel(report.status)}
          </small>
        </div>

        {options.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: '#475569' }}>
            No further status changes are possible for this report.
          </p>
        ) : (
          <>
            <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Next status
              <select
                className="p4-select"
                style={CONTROL_STYLE}
                value={status}
                disabled={update.isPending}
                onChange={(e) => setStatus(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o} value={o}>
                    {statusLabel(o)}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Note for citizen (optional)
              <textarea
                className="p4-textarea"
                style={CONTROL_STYLE}
                placeholder="Note for the citizen (optional)"
                value={note}
                disabled={update.isPending}
                maxLength={300}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>

            {status === 'resolved' && (
              <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 600, color: '#334155' }}>
                After-photo URL (proof of fix)
                <input
                  type="url"
                  className="p4-input"
                  style={CONTROL_STYLE}
                  placeholder="https://... (optional unless required by server)"
                  value={proof}
                  disabled={update.isPending}
                  onChange={(e) => setProof(e.target.value)}
                />
              </label>
            )}

            {update.isError && <span className="p4-error">{update.error.message}</span>}
          </>
        )}

        <div className="p4-row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            className="p4-btn secondary"
            disabled={update.isPending}
            onClick={onClose}
          >
            Cancel
          </button>
          {options.length > 0 && (
            <button type="submit" className="p4-btn" disabled={!status || update.isPending}>
              {update.isPending ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
