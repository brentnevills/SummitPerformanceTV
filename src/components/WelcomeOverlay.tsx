import React from 'react';
import { SummitLogo } from './SummitLogo';

interface Props {
  show: boolean;
  logoUrl?: string;
}

export const WelcomeOverlay: React.FC<Props> = ({ show, logoUrl }) => {
  return (
    <div id="welcome-overlay" className={show ? 'active' : ''}>
      <h1>WELCOME TO</h1>
      <SummitLogo logoUrl={logoUrl} className="w-[80%] max-h-[60vh] object-contain my-4" />
    </div>
  );
};

