import React from 'react';

interface Props {
  enabled: boolean;
  opacity: number;
}

export const TvHeartbeatOverlay: React.FC<Props> = ({ enabled, opacity }) => {
  if (!enabled) return null;

  return (
    <div
      id="tv-heartbeat"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      style={{
        opacity: Math.max(0.001, Math.min(opacity, 0.02)),
        animation: 'anti-burn-shift 60s ease-in-out infinite alternate',
      }}
    >
      <style>{`
        @keyframes anti-burn-shift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(1px, 0); }
          100% { transform: translate(0, 1px); }
        }
      `}</style>
    </div>
  );
};
