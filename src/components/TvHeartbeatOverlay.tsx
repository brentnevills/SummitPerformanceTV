import React from 'react';

interface Props {
  enabled: boolean;
  opacity: number;
}

export const TvHeartbeatOverlay: React.FC<Props> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div
      id="tv-heartbeat"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      style={{
        animation: 'anti-burn-shift 120s ease-in-out infinite alternate',
      }}
    >
      <style>{`
        @keyframes anti-burn-shift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(1px, 1px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  );
};

