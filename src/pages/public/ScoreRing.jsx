export default function ScoreRing({ score = 0, size = 76 }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const color = safeScore >= 75 ? '#16a34a' : safeScore >= 50 ? '#f59e0b' : '#dc2626';

  return (
    <svg
      width={size}
      height={size}
      role="img"
      aria-label={`Score ${safeScore} out of 100`}
      style={{ flexShrink: 0 }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="7"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(safeScore / 100) * c} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="53%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size / 3.4}
        fontWeight="700"
        fill={color}
      >
        {safeScore}
      </text>
    </svg>
  );
}
