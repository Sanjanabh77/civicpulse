import { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  ImageOff,
  Maximize2,
  X,
} from 'lucide-react';

function isMockSvgPlaceholder(src) {
  return typeof src === 'string' && src.trim().toLowerCase().startsWith('data:image/svg+xml');
}

function classifyImage(src, hasError) {
  const hasSource = typeof src === 'string' && src.trim().length > 0;
  if (!hasSource) return 'missing';
  if (isMockSvgPlaceholder(src)) return 'mock';
  if (hasError) return 'broken';
  return 'genuine';
}

function EvidencePlaceholder({ icon, title, message, tone = 'neutral' }) {
  return (
    <div className={`p4-evidence-placeholder p4-evidence-placeholder--${tone}`}>
      <div className="p4-evidence-placeholder-icon">{icon}</div>
      <strong className="p4-evidence-placeholder-title">{title}</strong>
      <span className="p4-evidence-placeholder-text">{message}</span>
    </div>
  );
}

function EvidenceMedia({
  src,
  alt,
  variant,
  isResolvedOrClosed,
  onEnlarge,
  onErrorChange,
  hasError,
}) {
  const kind = classifyImage(src, hasError);

  if (kind === 'genuine') {
    return (
      <button
        type="button"
        className="p4-evidence-trigger"
        onClick={(e) => onEnlarge(e.currentTarget)}
        aria-label={variant === 'before' ? 'Enlarge before photo' : 'Enlarge after photo'}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="p4-evidence-img"
          onError={() => onErrorChange(true)}
        />
        <span className="p4-evidence-zoom-hint" aria-hidden="true">
          <Maximize2 size={13} />
          Enlarge
        </span>
      </button>
    );
  }

  if (kind === 'mock') {
    return (
      <EvidencePlaceholder
        tone={variant === 'before' ? 'before' : isResolvedOrClosed ? 'after' : 'neutral'}
        icon={<ImageIcon size={20} color="#64748b" />}
        title="Sample Placeholder (Mock Mode)"
        message="Mock preview active. Genuine photographic evidence will display when connected to the backend."
      />
    );
  }

  if (kind === 'broken') {
    return (
      <EvidencePlaceholder
        tone="error"
        icon={<ImageOff size={20} color="#dc2626" />}
        title="Image Unavailable"
        message="This photo could not be loaded from the provided URL."
      />
    );
  }

  if (variant === 'before') {
    return (
      <EvidencePlaceholder
        tone="before"
        icon={<CameraOff size={20} color="#c2410c" />}
        title="No Photo Attached"
        message="Citizen filed this report without uploading an initial photo."
      />
    );
  }

  return (
    <EvidencePlaceholder
      tone={isResolvedOrClosed ? 'after' : 'neutral'}
      icon={isResolvedOrClosed ? <ImageIcon size={20} color="#15803d" /> : <Clock size={20} color="#64748b" />}
      title={isResolvedOrClosed ? 'No Post-Repair Photo' : 'Awaiting Repair Photo'}
      message={
        isResolvedOrClosed
          ? 'Issue was marked resolved without an uploaded post-repair photo.'
          : 'Field crews may upload a photo here once repair work is completed.'
      }
    />
  );
}

function getFooterCaption(kind, variant, isResolvedOrClosed) {
  if (variant === 'before') {
    if (kind === 'genuine') return 'Photo submitted with initial citizen report';
    if (kind === 'broken') return 'Initial photo unavailable';
    if (kind === 'mock') return 'Mock data mode — no real citizen photo uploaded';
    return 'No initial photo on record';
  }

  if (kind === 'genuine') return 'Post-repair photo uploaded';
  if (kind === 'broken') return 'Post-repair photo unavailable';
  if (kind === 'mock') return 'Mock data mode — no real post-repair photo uploaded';
  return isResolvedOrClosed ? 'No post-repair photo on record' : 'Post-repair photo pending';
}

export default function BeforeAfter({ before, after, status }) {
  const isResolvedOrClosed = status === 'resolved' || status === 'closed';

  // Reset each error state independently whenever its respective prop changes.
  const [prevBefore, setPrevBefore] = useState(before);
  const [beforeError, setBeforeError] = useState(false);
  if (before !== prevBefore) {
    setPrevBefore(before);
    setBeforeError(false);
  }

  const [prevAfter, setAfterPrev] = useState(after);
  const [afterError, setAfterError] = useState(false);
  if (after !== prevAfter) {
    setAfterPrev(after);
    setAfterError(false);
  }

  const beforeKind = classifyImage(before, beforeError);
  const afterKind = classifyImage(after, afterError);

  const [activeLightbox, setActiveLightbox] = useState(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const wasOpenRef = useRef(false);

  const lightboxItem =
    activeLightbox === 'before' && beforeKind === 'genuine'
      ? {
          src: before,
          alt: 'Enlarged initial reported civic issue photo',
          title: 'BEFORE — Reported Issue',
          caption: 'Photo submitted with initial citizen report',
        }
      : activeLightbox === 'after' && afterKind === 'genuine'
        ? {
            src: after,
            alt: 'Enlarged post-repair civic issue photo',
            title: 'AFTER — Post-Repair Photo',
            caption: 'Post-repair photo uploaded',
          }
        : null;

  const isLightboxOpen = Boolean(lightboxItem);

  useEffect(() => {
    if (isLightboxOpen) {
      wasOpenRef.current = true;
      closeBtnRef.current?.focus();

      const getFocusable = () => {
        if (!dialogRef.current) return [];
        return Array.from(
          dialogRef.current.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setActiveLightbox(null);
          return;
        }

        if (e.key === 'Tab') {
          const focusables = getFocusable();
          if (focusables.length === 0) {
            e.preventDefault();
            dialogRef.current?.focus();
            return;
          }

          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          const active = document.activeElement;

          if (!dialogRef.current?.contains(active)) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
            return;
          }

          if (focusables.length === 1) {
            e.preventDefault();
            first.focus();
            return;
          }

          if (e.shiftKey && (active === first || active === dialogRef.current)) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      const onFocusIn = (e) => {
        if (dialogRef.current && !dialogRef.current.contains(e.target)) {
          (getFocusable()[0] || dialogRef.current).focus();
        }
      };

      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('focusin', onFocusIn);
      return () => {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('focusin', onFocusIn);
      };
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
    return undefined;
  }, [isLightboxOpen]);

  const openLightbox = (variant, buttonEl) => {
    triggerRef.current = buttonEl;
    setActiveLightbox(variant);
  };

  return (
    <>
      <div className="p4-evidence-grid">
        {/* Before Card */}
        <div className="p4-evidence-card p4-evidence-card--before">
          <div className="p4-evidence-header p4-evidence-header--before">
            <div className="p4-evidence-title-group">
              <Camera size={15} color="#ea580c" />
              <span className="p4-evidence-label p4-evidence-label--before">BEFORE</span>
            </div>
            <span className="p4-evidence-pill p4-evidence-pill--before">Reported Issue</span>
          </div>

          <div className="p4-evidence-body">
            <EvidenceMedia
              src={before}
              alt="Initial reported civic issue"
              variant="before"
              isResolvedOrClosed={isResolvedOrClosed}
              hasError={beforeError}
              onErrorChange={setBeforeError}
              onEnlarge={(btn) => openLightbox('before', btn)}
            />
            <p className="p4-evidence-caption">
              {getFooterCaption(beforeKind, 'before', isResolvedOrClosed)}
            </p>
          </div>
        </div>

        {/* After Card */}
        <div
          className={`p4-evidence-card ${
            isResolvedOrClosed ? 'p4-evidence-card--after-done' : 'p4-evidence-card--after-pending'
          }`}
        >
          <div
            className={`p4-evidence-header ${
              isResolvedOrClosed
                ? 'p4-evidence-header--after-done'
                : 'p4-evidence-header--after-pending'
            }`}
          >
            <div className="p4-evidence-title-group">
              {isResolvedOrClosed ? (
                <CheckCircle2 size={16} color="#16a34a" />
              ) : (
                <Clock size={15} color="#64748b" />
              )}
              <span
                className={`p4-evidence-label ${
                  isResolvedOrClosed
                    ? 'p4-evidence-label--after-done'
                    : 'p4-evidence-label--after-pending'
                }`}
              >
                AFTER
              </span>
            </div>
            <span
              className={`p4-evidence-pill ${
                isResolvedOrClosed
                  ? 'p4-evidence-pill--after-done'
                  : 'p4-evidence-pill--after-pending'
              }`}
            >
              {isResolvedOrClosed ? 'Post-Repair' : 'Pending Work'}
            </span>
          </div>

          <div className="p4-evidence-body">
            <EvidenceMedia
              src={after}
              alt="Post-repair civic issue condition"
              variant="after"
              isResolvedOrClosed={isResolvedOrClosed}
              hasError={afterError}
              onErrorChange={setAfterError}
              onEnlarge={(btn) => openLightbox('after', btn)}
            />
            <p className="p4-evidence-caption">
              {getFooterCaption(afterKind, 'after', isResolvedOrClosed)}
            </p>
          </div>
        </div>
      </div>

      {lightboxItem && (
        <div
          className="p4-lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="p4-lightbox-title"
          aria-describedby="p4-lightbox-caption"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveLightbox(null);
          }}
        >
          <div ref={dialogRef} className="p4-lightbox-dialog" tabIndex={-1}>
            <div className="p4-lightbox-topbar">
              <strong id="p4-lightbox-title" className="p4-lightbox-title">
                {lightboxItem.title}
              </strong>
              <button
                ref={closeBtnRef}
                type="button"
                className="p4-lightbox-close"
                onClick={() => setActiveLightbox(null)}
                aria-label="Close enlarged photo"
              >
                <X size={18} />
                <span>Close</span>
              </button>
            </div>
            <div
              className="p4-lightbox-stage"
              tabIndex={0}
              role="region"
              aria-label={lightboxItem.alt}
            >
              <img
                src={lightboxItem.src}
                alt={lightboxItem.alt}
                className="p4-lightbox-img"
              />
            </div>
            <p id="p4-lightbox-caption" className="p4-lightbox-caption">
              {lightboxItem.caption}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
