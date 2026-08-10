import React from 'react';
import { Settings, Play } from 'lucide-react';
import { SummitLogo } from './SummitLogo';

interface Props {
  show: boolean;
  clinicName: string;
  tagline: string;
  primaryColor?: string;
  accentColor?: string;
  onStart: () => void;
  onOpenSettings: () => void;
}

export const StartOverlay: React.FC<Props> = ({
  show,
  clinicName,
  tagline,
  onStart,
  onOpenSettings,
}) => {
  if (!show) return null;

  return (
    <div id="start-overlay" className="relative flex flex-col items-center justify-center p-8 bg-slate-950 text-white z-[100000]">
      {/* Top right settings button on start screen */}
      <button
        onClick={onOpenSettings}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-100 rounded-full border border-slate-700 transition-all cursor-pointer shadow-lg hover:scale-105"
        title="Open TV Settings & Remote Control"
      >
        <Settings className="w-5 h-5 text-emerald-400" />
        <span className="font-semibold text-sm">Settings</span>
      </button>

      {/* Start Display Content */}
      <div className="max-w-xl w-full flex flex-col items-center text-center space-y-8">
        <div className="w-full max-w-md h-32 flex items-center justify-center bg-white rounded-2xl p-4 shadow-xl">
          <SummitLogo className="h-full w-auto object-contain" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{clinicName}</h1>
          <p className="text-emerald-400 font-medium text-lg">{tagline}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
          <button
            id="start-btn"
            onClick={onStart}
            className="flex items-center gap-3 px-10 py-5 text-2xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full shadow-2xl transition-all hover:scale-105 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-8 h-8 fill-slate-950" />
            Start Display
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-6 py-4 text-lg font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-full border border-slate-700 transition-all hover:scale-105 cursor-pointer"
          >
            <Settings className="w-6 h-6 text-emerald-400" />
            Settings
          </button>
        </div>

        <p className="text-xs text-slate-400 pt-6">
          Press <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">S</kbd> on keyboard at any time or hover near top right to access Settings.
        </p>
      </div>
    </div>
  );
};


