import React, { useState, useEffect } from 'react';
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
  isStarted = true,
}) => {
  const [visible, setVisible] = useState(!isStarted);

  useEffect(() => {
    if (!isStarted) {
      setVisible(true);
      return;
    }

    let timer: NodeJS.Timeout;
    const handleMouseMove = (e: MouseEvent) => {
      // Show if cursor is near top bar or upper right corner
      if (e.clientY < 120 || e.clientX > window.innerWidth - 200) {
        setVisible(true);
        clearTimeout(timer);
        timer = setTimeout(() => {
          setVisible(false);
        }, 3500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, [isStarted]);

  return (
    <div
      className="top-bar relative group"
      style={{ borderBottomColor: accentColor || 'var(--summit-green)' }}
    >
      <SummitLogo logoUrl={logoUrl} className="top-bar-logo" />

      {/* Settings Button - Auto-hides during playback, reveals on hover/mousemove */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50">
        <button
          onClick={onOpenSettings}
          title="Open TV Settings & Remote Control (Or press 'S')"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer border border-slate-700/60 ${
            visible || !isStarted
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 group-hover:opacity-100 pointer-events-auto'
          }`}
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span className="font-sans tracking-wide">Settings</span>
        </button>
      </div>
    </div>
  );
};


