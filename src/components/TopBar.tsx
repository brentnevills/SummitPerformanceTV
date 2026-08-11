import React from 'react';
import { Settings } from 'lucide-react';
import { SummitLogo } from './SummitLogo';

interface Props {
  clinicName: string;
  tagline: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  onOpenSettings: () => void;
  isStarted?: boolean;
}

export const TopBar: React.FC<Props> = ({
  logoUrl,
  accentColor,
  onOpenSettings,
}) => {
  return (
    <div
      className="top-bar relative"
      style={{ borderBottomColor: accentColor || 'var(--summit-green)' }}
    >
      <SummitLogo logoUrl={logoUrl} className="top-bar-logo" />

      {/* Settings Button - Hidden unless hovered over */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 group">
        <button
          onClick={onOpenSettings}
          title="Open TV Settings & Remote Control (Or press 'S')"
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer border border-slate-700/60 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 active:scale-95"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span className="font-sans tracking-wide">Settings</span>
        </button>
      </div>
    </div>
  );
};



