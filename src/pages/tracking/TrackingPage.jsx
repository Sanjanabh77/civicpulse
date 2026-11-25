import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import '../../p4.css';
import { api } from '../../lib/api.js';
import { getCurrentUser } from '../../lib/auth.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import StatusTimeline from './StatusTimeline.jsx';
import BeforeAfter from './BeforeAfter.jsx';
import ConfirmReopen from './ConfirmReopen.jsx';
import {
  MapPin,
  Calendar,
  Hash,
  Tag,
  AlertTriangle,
  Trash2,
  Lightbulb,
  Droplets,
  Waves,
  ArrowLeft,
  Home,
  CheckCircle2,
  CheckCheck,
  Clock,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  FileText,
  Copy,
  Check,
  Lock,
} from 'lucide-react';

function getCategoryIcon(category) {
  const props = { size: 16, color: '#0e8a7d', strokeWidth: 2 };
  switch (String(category).toLowerCase()) {
    case 'pothole':
      return <AlertTriangle {...props} />;
    case 'garbage':
      return <Trash2 {...props} />;
    case 'streetlight':
      return <Lightbulb {...props} />;
    case 'water':
      return <Droplets {...props} />;
    case 'drainage':
      return <Waves {...props} />;
    default:
      return <Tag {...props} />;
  }
}

export default function TrackingPage() {
  const { id } = useParams();
  const [copyStatus, setCopyStatus] = useState('idle');
  const copyTimerRef = useRef(null);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  // Polls every 30 s for updates.
  const { data, isLoading, error, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['tracking', id],
    queryFn: () => api(`/tracking/${id}`),
    refetchInterval: 30_000,
  });

  const handleCopyLink = async () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
    copyTimerRef.current = setTimeout(() => setCopyStatus('idle'), 2500);
  };

  if (isLoading) {
    return (
      <div className="p4-page" style={{ maxWidth: 860, textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#475569', fontSize: 15 }}>
          <RefreshCw size={20} className="spinning" />
          Loading report tracking details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p4-page" style={{ maxWidth: 860 }}>
        <Link
          to="/map"
          className="p4-btn secondary"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14 }}
        >
          <ArrowLeft size={16} /> Back to Map
        </Link>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 20, color: '#991b1b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16 }}>
            <AlertTriangle size={20} />
            Unable to load report #{id}
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>{error.message || 'Report not found or server is unreachable.'}</p>
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className="p4-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
              disabled={isFetching}
              onClick={() => refetch()}
            >
              <RefreshCw size={14} className={isFetching ? 'spinning' : ''} />
              {isFetching ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;
  const currentUser = getCurrentUser();

  return (
    <div className="p4-page" style={{ maxWidth: 860 }}>
      {/* Navigation & Header Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link
            to="/map"
            className="p4-btn secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}
          >
            <ArrowLeft size={15} /> Back to Map
          </Link>
          <Link
            to="/"
            className="p4-btn secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}
          >
            <Home size={15} /> Home
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} className={isFetching ? 'spinning' : ''} />
            {isFetching
              ? 'Updating...'
              : updatedTime
                ? `Updated ${updatedTime} · Live polling (30s)`
                : 'Live polling (30s)'}
          </span>
          <button
            type="button"
            className="p4-btn secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '6px 10px' }}
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw size={13} className={isFetching ? 'spinning' : ''} />
            Refresh
          </button>
          <button
            type="button"
            className="p4-btn secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '6px 10px' }}
            onClick={handleCopyLink}
          >
            {copyStatus === 'copied' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
            {copyStatus === 'copied' ? 'Copied link' : copyStatus === 'error' ? 'Copy failed' : 'Copy link'}
          </button>
        </div>
      </div>

      {/* Main Title & Status Header Card */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '3px 8px',
                  borderRadius: 6,
                  letterSpacing: '0.2px',
                }}
              >
                <Hash size={12} /> {data.id}
              </span>
              <span style={{ fontSize: 12, color: '#64748b' }}>Civic Action Request</span>
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {data.title}
            </h1>
          </div>
          <div style={{ alignSelf: 'flex-start' }}>
            <StatusBadge status={data.status} />
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            marginTop: 18,
            paddingTop: 16,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          {/* Category */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#f0fdfa', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getCategoryIcon(data.category)}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Category</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{data.category}</div>
            </div>
          </div>

          {/* Location / Ward */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#eff6ff', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={16} color="#2563eb" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Location</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{data.ward}</div>
            </div>
          </div>

          {/* Date Filed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={16} color="#7c3aed" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Filed On</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                {new Date(data.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#16a34a" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Current State</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                {String(data.status).replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Issue Description */}
        {data.description && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 14px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <FileText size={16} color="#64748b" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
              <strong style={{ color: '#0f172a' }}>Description: </strong>
              {data.description}
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Section: Timeline + Before/After Photos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Left Column: Progress Timeline */}
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <Clock size={18} color="#0e8a7d" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Resolution Progress
            </h2>
          </div>
          <StatusTimeline events={data.timeline} status={data.status} />
        </section>

        {/* Right Column: Visual Evidence */}
        <section
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
            <ShieldCheck size={18} color="#0e8a7d" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Photographic Proof
            </h2>
          </div>
          <BeforeAfter before={data.beforeImage} after={data.afterImage} status={data.status} />
        </section>
      </div>

      {/* Citizen Resolution Confirmation / Reopen Card */}
      {data.canRespond && (
        <div style={{ marginBottom: 16 }}>
          <ConfirmReopen id={data.id} />
        </div>
      )}

      {data.status === 'resolved' && !data.canRespond && (
        <div
          style={{
            marginBottom: 16,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '14px 18px',
            color: '#334155',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Lock size={18} color="#475569" style={{ flexShrink: 0 }} />
          <div>
            {currentUser ? (
              <>
                <strong>Citizen Confirmation Unavailable:</strong> Only the citizen who reported this issue can confirm or reopen the resolution.
              </>
            ) : (
              <>
                <strong>Sign In Required:</strong> Sign in with the reporting citizen account to confirm whether this repair is satisfactory or reopen the report.
              </>
            )}
          </div>
        </div>
      )}

      {/* Post-Resolution State Notifications */}
      {data.status === 'closed' && data.citizenConfirmed && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '14px 18px',
            color: '#166534',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ShieldCheck size={20} color="#16a34a" />
          <div>
            <strong>Resolved &amp; Closed:</strong> The citizen confirmed that this civic issue has been inspected and repaired satisfactorily.
          </div>
        </div>
      )}

      {data.status === 'closed' && !data.citizenConfirmed && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: '14px 18px',
            color: '#334155',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CheckCheck size={20} color="#475569" />
          <div>
            <strong>Closed:</strong> This report has been closed without a citizen confirmation response.
          </div>
        </div>
      )}

      {data.status === 'reopened' && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: '14px 18px',
            color: '#991b1b',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <RotateCcw size={20} color="#dc2626" />
          <div>
            <strong>Issue Reopened:</strong> The citizen flagged this issue as still defective. A priority follow-up ticket has been dispatched.
          </div>
        </div>
      )}
    </div>
  );
}
