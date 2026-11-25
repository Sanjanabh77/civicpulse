import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Check, RotateCcw, Send, X, AlertCircle } from 'lucide-react';

export default function ConfirmReopen({ id }) {
  const qc = useQueryClient();
  const [reopening, setReopening] = useState(false);
  const [reason, setReason] = useState('');

  const handleSuccess = (data) => {
    qc.setQueryData(['tracking', id], data);
    qc.invalidateQueries({ queryKey: ['map-reports'] });
    setReopening(false);
    setReason('');
  };
  const confirm = useMutation({
    mutationFn: () => api(`/tracking/${id}/confirm`, { method: 'POST' }),
    onSuccess: handleSuccess,
  });
  const reopen = useMutation({
    mutationFn: () => api(`/tracking/${id}/reopen`, { method: 'POST', body: { reason: reason.trim() } }),
    onSuccess: handleSuccess,
  });
  const err = confirm.error || reopen.error;
  const trimmedLength = reason.trim().length;
  const remainingChars = Math.max(0, 5 - trimmedLength);

  const openReopenForm = () => {
    confirm.reset();
    reopen.reset();
    setReopening(true);
  };

  const cancelReopenForm = () => {
    setReopening(false);
    setReason('');
    confirm.reset();
    reopen.reset();
  };

  return (
    <div
      style={{
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 1px 3px rgba(22,163,74,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ background: '#dcfce7', borderRadius: '50%', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={18} color="#16a34a" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <strong style={{ color: '#166534', fontSize: 15, display: 'block' }}>
            Action Required: Has this issue been fixed to your satisfaction?
          </strong>
          <span style={{ fontSize: 13, color: '#15803d', marginTop: 2, display: 'block' }}>
            The municipal department completed repairs on site and marked this report as resolved.
          </span>
        </div>
      </div>

      {!reopening ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button
            className="p4-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '9px 18px' }}
            disabled={confirm.isPending}
            onClick={() => confirm.mutate()}
          >
            <Check size={16} />
            {confirm.isPending ? 'Confirming...' : 'Yes, Confirm Resolution'}
          </button>
          <button
            className="p4-btn danger"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '9px 16px' }}
            disabled={confirm.isPending}
            onClick={openReopenForm}
          >
            <RotateCcw size={15} />
            No, Reopen Report
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 14, background: '#ffffff', padding: 14, borderRadius: 8, border: '1px solid #fed7aa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#9a3412', fontWeight: 600, fontSize: 13 }}>
            <AlertCircle size={15} />
            Tell the field crew what remains unresolved:
          </div>
          <textarea
            className="p4-textarea"
            style={{ width: '100%', minHeight: 80, boxSizing: 'border-box' }}
            placeholder="Describe what is still defective or incomplete (minimum 5 characters)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={reopen.isPending}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
              fontSize: 12,
              color: remainingChars > 0 ? '#9a3412' : '#15803d',
            }}
          >
            <span>
              {remainingChars > 0
                ? `Enter at least ${remainingChars} more character${remainingChars === 1 ? '' : 's'} to reopen`
                : 'Reason looks good'}
            </span>
            <span>{trimmedLength} / 5 min</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              className="p4-btn danger"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              disabled={trimmedLength < 5 || reopen.isPending}
              onClick={() => reopen.mutate()}
            >
              <Send size={14} />
              {reopen.isPending ? 'Submitting...' : 'Submit & Reopen'}
            </button>
            <button
              className="p4-btn secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              disabled={reopen.isPending}
              onClick={cancelReopenForm}
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {err && (
        <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} />
          {err.message}
        </div>
      )}
    </div>
  );
}
