import React, { useState } from 'react';
import { ClinicSettings, ClinicAnnouncement, VideoPlaylist } from '../types';
import { extractYouTubeId } from '../utils/youtube';
import {
  X,
  Tv,
  Sparkles,
  Plus,
  Trash2,
  Play,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  Loader2,
  Radio,
  ArrowUp,
  ArrowDown,
  Bell,
  Settings as SettingsIcon,
  Edit3,
  FolderPlus,
  Film,
  Palette,
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
  // Three distinct tabs: Notifications, Playlists, and Advanced Settings
  const [activeTab, setActiveTab] = useState<'notifications' | 'playlists' | 'advanced'>('notifications');

  // Local state for notifications
  const [newNoticeText, setNewNoticeText] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<'general' | 'reminder' | 'wellness' | 'social' | 'promo'>('general');
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editingNoticeText, setEditingNoticeText] = useState('');
  const [editingNoticeCategory, setEditingNoticeCategory] = useState<'general' | 'reminder' | 'wellness' | 'social' | 'promo'>('general');

  // Local state for playlists & video management
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingPlaylistTitle, setEditingPlaylistTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [testStreamResult, setTestStreamResult] = useState<any>(null);
  const [testingStream, setTestingStream] = useState(false);

  // YouTube Video Titles Cache
  const [videoTitlesMap, setVideoTitlesMap] = useState<Record<string, string>>({
    'dJ9A_A4U3Xg': 'Full Body Mobility & Physical Therapy Stretches',
    '50kH0f3B0aY': 'Lower Back Pain Relief Stretches & Core Strengthening',
    'inpok4MKVLM': 'Desk Posture Correction & Shoulder Exercises',
  });

  const activePlaylist =
    settings.playlists.find((p) => p.id === settings.currentPlaylistId) || settings.playlists[0];

  // Fetch missing YouTube video titles for active playlist
  React.useEffect(() => {
    if (!activePlaylist) return;
    activePlaylist.videoIds.forEach((vId) => {
      if (!videoTitlesMap[vId]) {
        fetch(`/api/youtube-title/${vId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.title) {
              setVideoTitlesMap((prev) => ({ ...prev, [vId]: data.title }));
            }
          })
          .catch(() => {});
      }
    });
  }, [activePlaylist?.videoIds]);

  if (!show) return null;

  // Add Notification
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

  // Start Editing Notification
  const handleStartEditNotice = (item: ClinicAnnouncement) => {
    setEditingNoticeId(item.id);
    setEditingNoticeText(item.text);
    setEditingNoticeCategory(item.category || 'general');
  };

  // Save Edited Notification
  const handleSaveEditNotice = (id: string) => {
    if (!editingNoticeText.trim()) return;
    const updated = settings.infoItems.map((item) =>
      item.id === id
        ? { ...item, text: editingNoticeText.trim(), category: editingNoticeCategory }
        : item
    );
    onSaveSettings({ infoItems: updated });
    setEditingNoticeId(null);
  };

  // Toggle Notification Active Status
  const handleToggleNotice = (id: string) => {
    const updated = settings.infoItems.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    onSaveSettings({ infoItems: updated });
  };

  // Move Notification Up or Down
  const handleMoveNotice = (id: string, direction: 'up' | 'down') => {
    const items = [...settings.infoItems];
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    onSaveSettings({ infoItems: items });
  };

  // Delete Notification
  const handleDeleteNotice = (id: string) => {
    const updated = settings.infoItems.filter((item) => item.id !== id);
    onSaveSettings({ infoItems: updated });
  };

  // Create New Playlist
  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle.trim()) return;
    const newPl: VideoPlaylist = {
      id: `pl_${Date.now()}`,
      title: newPlaylistTitle.trim(),
      description: 'Custom Clinic Playlist',
      videoIds: ['dJ9A_A4U3Xg'], // Default starter video
    };
    const updatedPlaylists = [...settings.playlists, newPl];
    onSaveSettings({ playlists: updatedPlaylists, currentPlaylistId: newPl.id });
    setNewPlaylistTitle('');
    setIsCreatingPlaylist(false);
  };

  // Edit Playlist Title
  const handleStartEditPlaylistTitle = (pl: VideoPlaylist) => {
    setEditingPlaylistId(pl.id);
    setEditingPlaylistTitle(pl.title);
  };

  const handleSavePlaylistTitle = (id: string) => {
    if (!editingPlaylistTitle.trim()) return;
    const updatedPlaylists = settings.playlists.map((pl) =>
      pl.id === id ? { ...pl, title: editingPlaylistTitle.trim() } : pl
    );
    onSaveSettings({ playlists: updatedPlaylists });
    setEditingPlaylistId(null);
  };

  // Delete Playlist
  const handleDeletePlaylist = (id: string) => {
    if (settings.playlists.length <= 1) return;
    const updatedPlaylists = settings.playlists.filter((pl) => pl.id !== id);
    const nextActiveId =
      settings.currentPlaylistId === id ? updatedPlaylists[0].id : settings.currentPlaylistId;
    onSaveSettings({ playlists: updatedPlaylists, currentPlaylistId: nextActiveId });
  };

  // Add Video to Selected Playlist
  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    const videoId = extractYouTubeId(newVideoUrl);
    if (!videoId) return;

    const currentPl =
      settings.playlists.find((p) => p.id === settings.currentPlaylistId) || settings.playlists[0];
    if (currentPl && !currentPl.videoIds.includes(videoId)) {
      const updatedPlaylists = settings.playlists.map((pl) =>
        pl.id === currentPl.id ? { ...pl, videoIds: [...pl.videoIds, videoId] } : pl
      );
      onSaveSettings({ playlists: updatedPlaylists });
    }
    setNewVideoUrl('');
  };

  // Rearrange Video Order in Selected Playlist
  const handleMoveVideo = (vId: string, direction: 'up' | 'down') => {
    const currentPl =
      settings.playlists.find((p) => p.id === settings.currentPlaylistId) || settings.playlists[0];
    if (!currentPl) return;

    const videoIds = [...currentPl.videoIds];
    const idx = videoIds.indexOf(vId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= videoIds.length) return;

    const temp = videoIds[idx];
    videoIds[idx] = videoIds[targetIdx];
    videoIds[targetIdx] = temp;

    const updatedPlaylists = settings.playlists.map((pl) =>
      pl.id === currentPl.id ? { ...pl, videoIds } : pl
    );
    onSaveSettings({ playlists: updatedPlaylists });
  };

  // Remove Video from Playlist
  const handleRemoveVideo = (vId: string) => {
    const currentPl =
      settings.playlists.find((p) => p.id === settings.currentPlaylistId) || settings.playlists[0];
    if (!currentPl) return;

    const updatedVideoIds = currentPl.videoIds.filter((id) => id !== vId);
    const updatedPlaylists = settings.playlists.map((pl) =>
      pl.id === currentPl.id ? { ...pl, videoIds: updatedVideoIds } : pl
    );
    onSaveSettings({ playlists: updatedPlaylists });
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
              <h2 className="text-xl font-bold">Summit TV Signage Control</h2>
              <p className="text-xs text-slate-400">Manage clinic notifications and TV settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* THREE DISTINCT TABS: Notifications, Playlists, Advanced Settings */}
        <div className="flex border-b border-slate-200 bg-slate-100 p-1.5 gap-2">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-3 px-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
              activeTab === 'notifications'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications ({settings.infoItems.filter((i) => i.active).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex-1 py-3 px-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
              activeTab === 'playlists'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Playlists</span>
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 py-3 px-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
              activeTab === 'advanced'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Advanced Settings</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: NOTIFICATIONS (ANNOUNCEMENTS & EDITING) */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Add Custom Notification */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Add New Notification</span>
                </h4>
                <textarea
                  value={newNoticeText}
                  onChange={(e) => setNewNoticeText(e.target.value)}
                  placeholder="e.g. Please inform front desk if you require accessible assistance..."
                  className="w-full p-3 bg-white rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Category:</span>
                    <select
                      value={newNoticeCategory}
                      onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                      className="p-2 bg-white rounded-xl border border-slate-300 text-xs font-medium cursor-pointer"
                    >
                      <option value="general">General</option>
                      <option value="reminder">Reminder</option>
                      <option value="wellness">Wellness</option>
                      <option value="social">Social</option>
                      <option value="promo">Promo</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAddNotice}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Notification</span>
                  </button>
                </div>
              </div>

              {/* Rotation Speed Control & Notification Font Size Control */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-sm font-bold text-slate-800">Sidebar Display Speed</span>
                    <p className="text-xs text-slate-500">Duration per announcement</p>
                  </div>
                  <select
                    value={settings.rotationSpeed}
                    onChange={(e) => onSaveSettings({ rotationSpeed: Number(e.target.value) })}
                    className="p-2 bg-slate-100 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer"
                  >
                    <option value={5000}>5 Seconds</option>
                    <option value={10000}>10 Seconds (Default)</option>
                    <option value={15000}>15 Seconds</option>
                    <option value={30000}>30 Seconds</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-sm font-bold text-slate-800">Notification Font Size</span>
                    <p className="text-xs text-slate-500">Text size on TV sidebar</p>
                  </div>
                  <select
                    value={settings.notificationFontSize || 'medium'}
                    onChange={(e) => onSaveSettings({ notificationFontSize: e.target.value as any })}
                    className="p-2 bg-slate-100 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium (Default)</option>
                    <option value="large">Large</option>
                    <option value="xlarge">Extra Large</option>
                    <option value="xxlarge">2X Large</option>
                    <option value="xxxlarge">3X Large</option>
                  </select>
                </div>
              </div>

              {/* Notification Items List with Edit Capability */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span>Manage & Edit Notifications ({settings.infoItems.length})</span>
                  </h4>
                </div>

                {settings.infoItems.map((item, idx) => {
                  const isEditing = editingNoticeId === item.id;

                  if (isEditing) {
                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-emerald-50/80 rounded-2xl border-2 border-emerald-500 space-y-3 shadow-md animate-fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            Editing Notification #{idx + 1}
                          </span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                            Live Edit
                          </span>
                        </div>

                        <textarea
                          value={editingNoticeText}
                          onChange={(e) => setEditingNoticeText(e.target.value)}
                          className="w-full p-3 bg-white rounded-xl border border-emerald-300 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          rows={2}
                        />

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-600 font-medium">Category:</span>
                            <select
                              value={editingNoticeCategory}
                              onChange={(e) => setEditingNoticeCategory(e.target.value as any)}
                              className="p-2 bg-white rounded-xl border border-emerald-300 text-xs font-bold"
                            >
                              <option value="general">General</option>
                              <option value="reminder">Reminder</option>
                              <option value="wellness">Wellness</option>
                              <option value="social">Social</option>
                              <option value="promo">Promo</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingNoticeId(null)}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEditNotice(item.id)}
                              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        item.active ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{item.text}</p>
                        <div className="flex items-center gap-2">
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {item.category || 'general'}
                          </span>
                          {!item.active && (
                            <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 pt-0.5">
                        {/* Order Buttons */}
                        <button
                          onClick={() => handleMoveNotice(item.id, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded cursor-pointer hover:bg-slate-100"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveNotice(item.id, 'down')}
                          disabled={idx === settings.infoItems.length - 1}
                          className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 rounded cursor-pointer hover:bg-slate-100"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEditNotice(item)}
                          className="p-1.5 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 rounded-lg cursor-pointer transition-colors"
                          title="Edit Notification"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Active Toggle Button */}
                        <button
                          onClick={() => handleToggleNotice(item.id)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            item.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                          title={item.active ? 'Disable Notification' : 'Enable Notification'}
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteNotice(item.id)}
                          className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                          title="Delete Notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PLAYLISTS & VIDEO ORDER MANAGEMENT */}
          {activeTab === 'playlists' && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-6 shadow-xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-base text-white">Playlists & Video Order</h3>
                      <p className="text-xs text-slate-400">Manage playlists, edit titles, and reorder videos</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCreatingPlaylist((prev) => !prev)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>New Playlist</span>
                  </button>
                </div>

                {/* Form to Create New Playlist */}
                {isCreatingPlaylist && (
                  <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 space-y-3 animate-fade-in">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Create New Playlist
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPlaylistTitle}
                        onChange={(e) => setNewPlaylistTitle(e.target.value)}
                        placeholder="e.g. Upper Body Rehabilitation"
                        className="flex-1 p-2.5 bg-slate-900 border border-slate-700 text-white text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <button
                        onClick={handleCreatePlaylist}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}

                {/* Select Active Playlist & Edit Name */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Active Playlist
                    </label>
                    {activePlaylist && editingPlaylistId !== activePlaylist.id && (
                      <button
                        onClick={() => handleStartEditPlaylistTitle(activePlaylist)}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Playlist Name</span>
                      </button>
                    )}
                  </div>

                  {editingPlaylistId === activePlaylist?.id ? (
                    <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-2xl border border-emerald-500">
                      <input
                        type="text"
                        value={editingPlaylistTitle}
                        onChange={(e) => setEditingPlaylistTitle(e.target.value)}
                        className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <button
                        onClick={() => handleSavePlaylistTitle(activePlaylist.id)}
                        className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPlaylistId(null)}
                        className="px-3 py-2 bg-slate-700 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={settings.currentPlaylistId}
                        onChange={(e) => onSaveSettings({ currentPlaylistId: e.target.value })}
                        className="flex-1 p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-white cursor-pointer"
                      >
                        {settings.playlists.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.title} ({pl.videoIds.length} videos)
                          </option>
                        ))}
                      </select>

                      {settings.playlists.length > 1 && (
                        <button
                          onClick={() => handleDeletePlaylist(settings.currentPlaylistId)}
                          className="px-3 py-3 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-xl cursor-pointer transition-colors"
                          title="Delete Playlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Add Video URL/ID to Current Playlist */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Add Video to Playlist
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="YouTube URL or Video ID (e.g. dJ9A_A4U3Xg)"
                      className="flex-1 p-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      onClick={handleTestStreamBypass}
                      disabled={testingStream}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {testingStream ? 'Testing...' : 'Test Stream'}
                    </button>
                    <button
                      onClick={handleAddVideo}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {testStreamResult && (
                    <div className="p-3 bg-slate-800 rounded-xl text-xs font-mono border border-slate-700 space-y-1">
                      <p className="text-emerald-400 font-bold">
                        Status: {testStreamResult.isDirectMedia ? 'Direct Stream Extracted' : 'IFrame Fallback Ready'}
                      </p>
                      {testStreamResult.title && <p className="text-slate-200">Title: {testStreamResult.title}</p>}
                    </div>
                  )}
                </div>

                {/* Video Rearrange & Order List */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Rearrange Video Playback Order
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {activePlaylist?.videoIds.length || 0} Videos
                    </span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {activePlaylist?.videoIds.map((vId, idx) => (
                      <div
                        key={vId}
                        className="p-3 bg-slate-800 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-700 text-emerald-400 text-xs font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-slate-100">{videoTitlesMap[vId] || `YouTube Video (${vId})`}</p>
                            <p className="text-[10px] text-slate-400 font-mono">youtube.com/watch?v={vId}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Move Up */}
                          <button
                            onClick={() => handleMoveVideo(vId, 'up')}
                            disabled={idx === 0}
                            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-20 text-slate-200 rounded-xl cursor-pointer transition-all"
                            title="Move Video Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            onClick={() => handleMoveVideo(vId, 'down')}
                            disabled={idx === activePlaylist.videoIds.length - 1}
                            className="p-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-20 text-slate-200 rounded-xl cursor-pointer transition-all"
                            title="Move Video Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          {/* Delete Video */}
                          <button
                            onClick={() => handleRemoveVideo(vId)}
                            className="p-2 bg-slate-700 hover:bg-red-900/60 hover:text-red-300 text-slate-400 rounded-xl cursor-pointer transition-all"
                            title="Remove Video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADVANCED SETTINGS (BRANDING, TV REMOTES & DISPLAY GUARDS) */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* SECTION B: CLINIC BRANDING SETTINGS */}
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-800">Clinic Branding & Info</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Clinic Name</label>
                    <input
                      type="text"
                      value={settings.clinicName}
                      onChange={(e) => onSaveSettings({ clinicName: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Tagline / Specialty</label>
                    <input
                      type="text"
                      value={settings.tagline}
                      onChange={(e) => onSaveSettings({ tagline: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Primary Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => onSaveSettings({ primaryColor: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => onSaveSettings({ primaryColor: e.target.value })}
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Accent Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => onSaveSettings({ accentColor: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.accentColor}
                        onChange={(e) => onSaveSettings({ accentColor: e.target.value })}
                        className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C: TV GUARD & REMOTE CONTROLS */}
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Radio className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-800">TV Remote & Display Controls</h3>
                </div>

                {/* Virtual Remote Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onNextVideo}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-emerald-400" />
                    <span>Skip Video</span>
                  </button>

                  <button
                    onClick={onToggleMute}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {muted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    <span>{muted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  <button
                    onClick={onTriggerWelcomeNow}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Test Welcome Overlay</span>
                  </button>

                  <button
                    onClick={handleToggleFullscreen}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span>Toggle Fullscreen</span>
                  </button>
                </div>

                {/* OLED Anti-Burn-In Settings */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">OLED Anti-Burn-In Noise Filter</h4>
                      <p className="text-[10px] text-slate-500">Shifts sub-pixels periodically to protect Summit TV screen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableAntiBurnIn}
                      onChange={(e) => onSaveSettings({ enableAntiBurnIn: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Periodic Welcome Overlay */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Periodic Welcome Splash</h4>
                      <p className="text-[10px] text-slate-500">Displays 10s full-screen clinic greeting periodically</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableWelcomeOverlay}
                      onChange={(e) => onSaveSettings({ enableWelcomeOverlay: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: CLOSED CAPTIONS (CC) & SPEECH SETTINGS */}
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-slate-800">Closed Captions (CC) & Live Speech</h3>
                </div>

                <div className="space-y-3">
                  {/* CC Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Enable Closed Captions (CC)</h4>
                      <p className="text-[10px] text-slate-500">Display synchronized video captions on screen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableClosedCaptions !== false}
                      onChange={(e) => onSaveSettings({ enableClosedCaptions: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* CC Font Size */}
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Caption Font Size</h4>
                      <p className="text-[10px] text-slate-500">Size of subtitle text overlay</p>
                    </div>
                    <select
                      value={settings.captionFontSize || 'medium'}
                      onChange={(e) => onSaveSettings({ captionFontSize: e.target.value as any })}
                      className="p-2 bg-slate-100 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium (Default)</option>
                      <option value="large">Large</option>
                      <option value="xlarge">Extra Large</option>
                      <option value="xxlarge">2X Large</option>
                      <option value="xxxlarge">3X Large</option>
                    </select>
                  </div>

                  {/* CC Position */}
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">Caption Screen Position</h4>
                      <p className="text-[10px] text-slate-500">Location of subtitles on video display</p>
                    </div>
                    <select
                      value={settings.captionPosition || 'bottom'}
                      onChange={(e) => onSaveSettings({ captionPosition: e.target.value as any })}
                      className="p-2 bg-slate-100 rounded-xl border border-slate-300 text-xs font-bold cursor-pointer"
                    >
                      <option value="bottom">Bottom of Screen</option>
                      <option value="top">Top of Screen</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

