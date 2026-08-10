import React, { useState } from 'react';
import { ClinicSettings, ClinicAnnouncement } from '../types';
import {
  X,
  Tv,
  Sparkles,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Palette,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  Loader2,
  ListPlus,
  Radio,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface Props {
  show: boolean;
  onClose: () => void;
  settings: ClinicSettings;
  onSaveSettings: (newSettings: Partial<ClinicSettings>) => void;
  onNextVideo: () => void;
  muted: boolean;
  onToggleMute: () => void;
  onTriggerWelcomeNow: () => void;
}

export const SettingsDrawer: React.FC<Props> = ({
  show,
  onClose,
  settings,
  onSaveSettings,
  onNextVideo,
  muted,
  onToggleMute,
  onTriggerWelcomeNow,
}) => {
  const [activeTab, setActiveTab] = useState<'remote' | 'announcements' | 'playlist' | 'branding' | 'tv'>('remote');

  // Local state for forms
  const [newNoticeText, setNewNoticeText] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<'general' | 'reminder' | 'wellness' | 'social' | 'promo'>('general');
  const [generatingAiNotices, setGeneratingAiNotices] = useState(false);

  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [testStreamResult, setTestStreamResult] = useState<any>(null);
  const [testingStream, setTestingStream] = useState(false);

  if (!show) return null;

  // Add Announcement
  const handleAddNotice = () => {
    if (!newNoticeText.trim()) return;
    const newNotice: ClinicAnnouncement = {
      id: Date.now().toString(),
      text: newNoticeText.trim(),
      category: newNoticeCategory,
      active: true,
    };
    const updated = [...settings.infoItems, newNotice];
    onSaveSettings({ infoItems: updated });
    setNewNoticeText('');
  };

  // Toggle Announcement Active
  const handleToggleNotice = (id: string) => {
    const updated = settings.infoItems.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    onSaveSettings({ infoItems: updated });
  };

  // Delete Announcement
  const handleDeleteNotice = (id: string) => {
    const updated = settings.infoItems.filter((item) => item.id !== id);
    onSaveSettings({ infoItems: updated });
  };

  // Gemini AI Generate Announcements
  const handleGenerateAiNotices = async () => {
    setGeneratingAiNotices(true);
    try {
      const resp = await fetch('/api/clinic/generate-announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: settings.clinicName,
          specialty: settings.tagline,
          count: 6,
        }),
      });
      const data = await resp.json();
      if (data.success && Array.isArray(data.announcements)) {
        const formatted: ClinicAnnouncement[] = data.announcements.map((a: any, idx: number) => ({
          id: `ai_${Date.now()}_${idx}`,
          text: a.text,
          category: a.category || 'wellness',
          active: true,
        }));
        onSaveSettings({ infoItems: [...settings.infoItems, ...formatted] });
      }
    } catch (err) {
      console.error('AI Announcement error:', err);
    } finally {
      setGeneratingAiNotices(false);
    }
  };

  // Add Video ID / URL
  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    let videoId = newVideoUrl.trim();
    if (videoId.includes('v=')) {
      videoId = videoId.split('v=')[1].split('&')[0];
    } else if (videoId.includes('youtu.be/')) {
      videoId = videoId.split('youtu.be/')[1].split('?')[0];
    }

    // Add to current playlist video IDs
    const currentPl = settings.playlists.find((p) => p.id === settings.currentPlaylistId) || settings.playlists[0];
    if (currentPl && !currentPl.videoIds.includes(videoId)) {
      const updatedPlaylists = settings.playlists.map((pl) =>
        pl.id === currentPl.id ? { ...pl, videoIds: [...pl.videoIds, videoId] } : pl
      );
      onSaveSettings({ playlists: updatedPlaylists });
    }
    setNewVideoUrl('');
  };

  // Test Bypass Extraction
  const handleTestStreamBypass = async () => {
    if (!newVideoUrl.trim()) return;
    let cleanId = newVideoUrl.trim();
    if (cleanId.includes('v=')) cleanId = cleanId.split('v=')[1].split('&')[0];
    else if (cleanId.includes('youtu.be/')) cleanId = cleanId.split('youtu.be/')[1].split('?')[0];

    setTestingStream(true);
    setTestStreamResult(null);
    try {
      const resp = await fetch(`/api/stream/${cleanId}`);
      const data = await resp.json();
      setTestStreamResult(data);
    } catch (e: any) {
      setTestStreamResult({ success: false, error: e.message });
    } finally {
      setTestingStream(false);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-slate-950/80 backdrop-blur-md flex justify-end animate-fade-in">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col text-slate-800 border-l border-slate-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Tv className="w-7 h-7 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold">Bolva TV Signage Control</h2>
              <p className="text-xs text-slate-400">Manage announcements, playlists, and TV settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('remote')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'remote'
                ? 'border-emerald-500 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>TV Remote</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-emerald-500 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListPlus className="w-4 h-4" />
            <span>Notices ({settings.infoItems.filter((i) => i.active).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('playlist')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'playlist'
                ? 'border-emerald-500 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Playlists</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'branding'
                ? 'border-emerald-500 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Branding</span>
          </button>

          <button
            onClick={() => setActiveTab('tv')}
            className={`flex-1 min-w-[100px] py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'tv'
                ? 'border-emerald-500 text-emerald-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>TV Guard</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: TV REMOTE D-PAD */}
          {activeTab === 'remote' && (
            <div className="space-y-6 text-center">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl max-w-sm mx-auto space-y-6">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                  Virtual Bolva TV Remote
                </div>

                {/* D-Pad */}
                <div className="grid grid-cols-3 gap-2 w-48 h-48 mx-auto items-center justify-center p-2 bg-slate-800 rounded-full shadow-inner border border-slate-700">
                  <div></div>
                  <button
                    onClick={() => console.log('Remote UP')}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center justify-center text-white active:scale-90"
                  >
                    <ArrowUp className="w-6 h-6" />
                  </button>
                  <div></div>

                  <button
                    onClick={() => console.log('Remote LEFT')}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center justify-center text-white active:scale-90"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={onNextVideo}
                    className="p-4 bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold text-white text-xs tracking-wider shadow-lg active:scale-90"
                  >
                    OK
                  </button>

                  <button
                    onClick={() => console.log('Remote RIGHT')}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center justify-center text-white active:scale-90"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>

                  <div></div>
                  <button
                    onClick={() => console.log('Remote DOWN')}
                    className="p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center justify-center text-white active:scale-90"
                  >
                    <ArrowDown className="w-6 h-6" />
                  </button>
                  <div></div>
                </div>

                {/* Remote Quick Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={onNextVideo}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 text-emerald-400" />
                    <span>Skip Video</span>
                  </button>

                  <button
                    onClick={onToggleMute}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2"
                  >
                    {muted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    <span>{muted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  <button
                    onClick={onTriggerWelcomeNow}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 col-span-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Test Welcome Overlay</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
                💡 Bolva TV remotes can also navigate using standard keyboard arrow keys and Enter.
              </div>
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENT NOTICES */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              {/* Gemini AI Generator Button */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Gemini AI Notice Generator</span>
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Auto-generate wellness tips and patient reminders tailored to your clinic.
                  </p>
                </div>
                <button
                  onClick={handleGenerateAiNotices}
                  disabled={generatingAiNotices}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {generatingAiNotices ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate AI</span>
                </button>
              </div>

              {/* Add Custom Announcement */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Add New Notice</h4>
                <textarea
                  value={newNoticeText}
                  onChange={(e) => setNewNoticeText(e.target.value)}
                  placeholder="e.g. Please inform front desk if you require accessible assistance..."
                  className="w-full p-3 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
                <div className="flex items-center justify-between gap-3">
                  <select
                    value={newNoticeCategory}
                    onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                    className="p-2 bg-white rounded-xl border border-slate-300 text-xs font-medium"
                  >
                    <option value="general">General</option>
                    <option value="reminder">Reminder</option>
                    <option value="wellness">Wellness</option>
                    <option value="social">Social</option>
                    <option value="promo">Promo</option>
                  </select>

                  <button
                    onClick={handleAddNotice}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Notice</span>
                  </button>
                </div>
              </div>

              {/* Rotation Speed Control */}
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200">
                <div>
                  <span className="text-sm font-bold text-slate-800">Rotation Speed</span>
                  <p className="text-xs text-slate-500">Duration each announcement displays</p>
                </div>
                <select
                  value={settings.rotationSpeed}
                  onChange={(e) => onSaveSettings({ rotationSpeed: Number(e.target.value) })}
                  className="p-2 bg-slate-100 rounded-xl border border-slate-300 text-xs font-bold"
                >
                  <option value={5000}>5 Seconds</option>
                  <option value={10000}>10 Seconds (Default)</option>
                  <option value={15000}>15 Seconds</option>
                  <option value={30000}>30 Seconds</option>
                </select>
              </div>

              {/* Notice List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Active Notices List</h4>
                {settings.infoItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      item.active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">{item.text}</p>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {item.category || 'notice'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleToggleNotice(item.id)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                        title={item.active ? 'Hide Notice' : 'Show Notice'}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteNotice(item.id)}
                        className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYLIST MANAGER & EMBED BYPASS TEST */}
          {activeTab === 'playlist' && (
            <div className="space-y-6">
              {/* Select Active Playlist */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Active Video Playlist</label>
                <select
                  value={settings.currentPlaylistId}
                  onChange={(e) => onSaveSettings({ currentPlaylistId: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800"
                >
                  {settings.playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.title} ({pl.videoIds.length} videos)
                    </option>
                  ))}
                </select>
              </div>

              {/* Stream Bypass Tester */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-sm">Add YouTube Video / Test Bypass</h4>
                </div>
                <p className="text-xs text-slate-300">
                  Paste YouTube video URL or ID to test direct MP4 extraction that bypasses embedding block errors.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=dJ9A_A4U3Xg"
                    className="flex-1 p-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    onClick={handleTestStreamBypass}
                    disabled={testingStream}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {testingStream ? 'Testing...' : 'Test Stream'}
                  </button>
                  <button
                    onClick={handleAddVideo}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {testStreamResult && (
                  <div className="p-3 bg-slate-800 rounded-xl text-xs font-mono border border-slate-700 space-y-1">
                    <p className="text-emerald-400 font-bold">
                      Status: {testStreamResult.isDirectMedia ? 'Direct Stream Extracted (Bypassed!)' : 'IFrame Fallback Ready'}
                    </p>
                    {testStreamResult.title && <p className="text-slate-200">Title: {testStreamResult.title}</p>}
                    {testStreamResult.url && (
                      <p className="text-slate-400 truncate">URL: {testStreamResult.url}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Current Playlist Items */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">Videos in Selected Playlist</h4>
                {settings.playlists
                  .find((p) => p.id === settings.currentPlaylistId)
                  ?.videoIds.map((vId, idx) => (
                    <div key={vId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-800">{vId}</p>
                          <p className="text-[10px] text-slate-500">https://youtube.com/watch?v={vId}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const currentPl = settings.playlists.find((p) => p.id === settings.currentPlaylistId);
                          if (!currentPl) return;
                          const updatedVideoIds = currentPl.videoIds.filter((id) => id !== vId);
                          const updatedPlaylists = settings.playlists.map((pl) =>
                            pl.id === currentPl.id ? { ...pl, videoIds: updatedVideoIds } : pl
                          );
                          onSaveSettings({ playlists: updatedPlaylists });
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 4: CLINIC BRANDING */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Clinic Name</label>
                <input
                  type="text"
                  value={settings.clinicName}
                  onChange={(e) => onSaveSettings({ clinicName: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Tagline / Specialty</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => onSaveSettings({ tagline: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Primary Theme Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => onSaveSettings({ primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => onSaveSettings({ primaryColor: e.target.value })}
                      className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Accent Theme Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => onSaveSettings({ accentColor: e.target.value })}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.accentColor}
                      onChange={(e) => onSaveSettings({ accentColor: e.target.value })}
                      className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Phone</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => onSaveSettings({ phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Location / City</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => onSaveSettings({ address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TV GUARD & KIOSK SETTINGS */}
          {activeTab === 'tv' && (
            <div className="space-y-6">
              {/* Anti-Burn-In Settings */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">OLED Anti-Burn-In Noise Filter</h4>
                    <p className="text-xs text-slate-500">Shifts sub-pixels periodically to prevent TV screen burn-in</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableAntiBurnIn}
                    onChange={(e) => onSaveSettings({ enableAntiBurnIn: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {settings.enableAntiBurnIn && (
                  <div>
                    <label className="text-xs font-medium text-slate-600">
                      Noise Opacity: {(settings.antiBurnInOpacity * 100).toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      min="0.005"
                      max="0.05"
                      step="0.005"
                      value={settings.antiBurnInOpacity}
                      onChange={(e) => onSaveSettings({ antiBurnInOpacity: Number(e.target.value) })}
                      className="w-full mt-1 accent-emerald-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Welcome Overlay Interval */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Periodic Welcome Splash Overlay</h4>
                    <p className="text-xs text-slate-500">Displays 10s full screen greeting for new patients</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableWelcomeOverlay}
                    onChange={(e) => onSaveSettings({ enableWelcomeOverlay: e.target.checked })}
                    className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                  />
                </div>

                {settings.enableWelcomeOverlay && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-slate-700">Display Interval</span>
                    <select
                      value={settings.welcomeInterval}
                      onChange={(e) => onSaveSettings({ welcomeInterval: Number(e.target.value) })}
                      className="p-2 bg-white rounded-xl border border-slate-300 text-xs font-bold"
                    >
                      <option value={300000}>Every 5 Minutes</option>
                      <option value={900000}>Every 15 Minutes (Default)</option>
                      <option value={1800000}>Every 30 Minutes</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Fullscreen & Sleep Prevener */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <h4 className="font-bold text-sm">Bolva TV Display Diagnostics</h4>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">TV Focus Bouncer (Prevent Sleep)</span>
                  <span className="text-emerald-400 font-bold font-mono">ACTIVE (30s)</span>
                </div>

                <button
                  onClick={handleToggleFullscreen}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span>Toggle Full Screen TV Mode</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
