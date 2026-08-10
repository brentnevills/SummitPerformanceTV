/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ClinicSettings, VideoPlaylist } from './types';
import { DEFAULT_CLINIC_SETTINGS } from './data/defaults';
import { TvHeartbeatOverlay } from './components/TvHeartbeatOverlay';
import { StartOverlay } from './components/StartOverlay';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { TopBar } from './components/TopBar';
import { AnnouncementSidebar } from './components/AnnouncementSidebar';
import { VideoPlayer } from './components/VideoPlayer';
import { SettingsDrawer } from './components/SettingsDrawer';

export default function App() {
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_CLINIC_SETTINGS);
  const [isStarted, setIsStarted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Video State
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  // Focus keeper ref to prevent TV screen saver
  const focusBouncerRef = useRef<HTMLInputElement | null>(null);

  // Load clinic settings from backend API on mount
  useEffect(() => {
    fetch('/api/clinic/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.warn('Could not fetch server settings, using defaults:', err));
  }, []);

  // Update video ID list when playlist or settings change
  useEffect(() => {
    const activePl =
      settings.playlists.find((p) => p.id === settings.currentPlaylistId) ||
      settings.playlists[0];

    if (activePl && activePl.videoIds.length > 0) {
      setVideoIds(activePl.videoIds);
    } else {
      setVideoIds(['dJ9A_A4U3Xg', '50kH0f3B0aY', 'inpok4MKVLM']);
    }
  }, [settings.currentPlaylistId, settings.playlists]);

  // Handle Start Display
  const handleStartDisplay = () => {
    setIsStarted(true);
    setMuted(false); // Enable unmuted audio on user gesture
    triggerWelcomeOverlay();

    // Focus keeper
    if (focusBouncerRef.current) {
      focusBouncerRef.current.focus();
    }
  };

  // Trigger Welcome Overlay
  const triggerWelcomeOverlay = () => {
    if (!settings.enableWelcomeOverlay) return;
    setShowWelcome(true);
    setTimeout(() => {
      setShowWelcome(false);
    }, settings.welcomeDuration || 10000);
  };

  // Periodic Welcome Overlay Interval (e.g. every 15 minutes)
  useEffect(() => {
    if (!isStarted || !settings.enableWelcomeOverlay) return;

    const interval = setInterval(() => {
      triggerWelcomeOverlay();
    }, settings.welcomeInterval || 900000);

    return () => clearInterval(interval);
  }, [isStarted, settings.enableWelcomeOverlay, settings.welcomeInterval]);

  // Preventive Focus Bouncer to keep Bolva TV awake
  useEffect(() => {
    if (!isStarted || !settings.preventTvSleep) return;

    const bouncerInterval = setInterval(() => {
      if (focusBouncerRef.current) {
        focusBouncerRef.current.focus();
      }
    }, 30000);

    return () => clearInterval(bouncerInterval);
  }, [isStarted, settings.preventTvSleep]);

  // Keyboard listener for 'S' key to open Settings menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'S') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        setShowSettingsDrawer((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Next Video Handler
  const handleNextVideo = () => {
    if (videoIds.length === 0) return;
    setCurrentVideoIndex((prev) => (prev + 1) % videoIds.length);
  };

  // Save Settings
  const handleSaveSettings = (partial: Partial<ClinicSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);

    // Sync to backend
    fetch('/api/clinic/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((e) => console.warn('Backend save error:', e));
  };

  return (
    <div
      className="w-screen h-screen overflow-hidden select-none font-sans bg-slate-950 text-slate-900"
      style={{
        backgroundColor: settings.primaryColor || '#122442',
      }}
    >
      {/* Anti-Burn-In Pixel Shift Layer for Bolva TV */}
      <TvHeartbeatOverlay
        enabled={settings.enableAntiBurnIn}
        opacity={settings.antiBurnInOpacity}
      />

      {/* Hidden TV Focus Bouncer */}
      <input
        ref={focusBouncerRef}
        type="text"
        id="tv-focus-bouncer"
        tabIndex={-1}
        className="fixed -left-[9999px] opacity-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Start Display Overlay */}
      <StartOverlay
        show={!isStarted}
        clinicName={settings.clinicName}
        tagline={settings.tagline}
        primaryColor={settings.primaryColor}
        accentColor={settings.accentColor}
        onStart={handleStartDisplay}
      />

      {/* Welcome Splash Screen Overlay */}
      <WelcomeOverlay
        show={showWelcome}
        clinicName={settings.clinicName}
        tagline={settings.tagline}
        logoUrl={settings.logoUrl}
        primaryColor={settings.primaryColor}
        accentColor={settings.accentColor}
      />

      {/* Main TV Screen Layout */}
      <div className="container-grid">
        {/* Top Header Bar */}
        <TopBar
          clinicName={settings.clinicName}
          tagline={settings.tagline}
          logoUrl={settings.logoUrl}
          primaryColor={settings.primaryColor}
          accentColor={settings.accentColor}
          onOpenSettings={() => setShowSettingsDrawer(true)}
        />

        {/* Sidebar Announcements & Clock */}
        <AnnouncementSidebar
          announcements={settings.infoItems}
          rotationSpeed={settings.rotationSpeed}
          primaryColor={settings.primaryColor}
          accentColor={settings.accentColor}
          clockFormat={settings.clockFormat}
        />

        {/* Video Area (Bypasses Embed Restrictions) */}
        <VideoPlayer
          videoIds={videoIds}
          currentIndex={currentVideoIndex}
          onNextVideo={handleNextVideo}
          accentColor={settings.accentColor}
          muted={muted}
          onToggleMute={() => setMuted((prev) => !prev)}
        />
      </div>

      {/* Settings & Virtual Remote Modal */}
      <SettingsDrawer
        show={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onNextVideo={handleNextVideo}
        muted={muted}
        onToggleMute={() => setMuted((prev) => !prev)}
        onTriggerWelcomeNow={triggerWelcomeOverlay}
      />
    </div>
  );
}
