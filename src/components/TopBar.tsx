import React from 'react';
import { Settings, Tv } from 'lucide-react';
import { SummitLogo } from './SummitLogo';

interface Props {
  clinicName: string;
  tagline: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<Props> = ({
  logoUrl,
  accentColor,
  onOpenSettings,
}) => {
  return (
    <div
      className="top-bar"
      style={{ borderBottomColor: accentColor || 'var(--summit-green)' }}
    >
      <SummitLogo logoUrl={logoUrl} className="top-bar-logo" />

      {/* Hidden Settings Trigger - Invisible corner button for staff / admins */}
      <div className="absolute right-2 top-2 z-50">
        <button
          onClick={onOpenSettings}
          title="Open TV Settings & Remote Control (Or press 'S' on keyboard)"
          className="w-12 h-12 bg-transparent opacity-0 hover:opacity-10 focus:opacity-20 cursor-pointer rounded-full focus:outline-none"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6 text-slate-800" />
        </button>
      </div>
    </div>
  );
};

