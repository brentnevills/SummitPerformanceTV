import React from 'react';

interface Props {
  show: boolean;
  onStart: () => void;
}

export const StartOverlay: React.FC<Props> = ({ show, onStart }) => {
  if (!show) return null;

  return (
    <div id="start-overlay">
      <button id="start-btn" onClick={onStart}>
        Start Clinic Display
      </button>
    </div>
  );
};

