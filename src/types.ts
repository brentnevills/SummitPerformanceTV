export interface ClinicAnnouncement {
  id: string;
  text: string;
  category?: 'general' | 'reminder' | 'social' | 'promo' | 'wellness';
  active: boolean;
}

export interface VideoItem {
  id: string; // YouTube video ID or direct video URL
  title: string;
  duration?: string;
  thumbnailUrl?: string;
  streamUrl?: string; // Direct MP4/WebM stream URL extracted server-side
  isDirectMedia?: boolean;
  isRestrictedEmbed?: boolean;
  sourceType: 'youtube' | 'mp4' | 'playlist_item';
}

export interface VideoPlaylist {
  id: string;
  title: string;
  description: string;
  videoIds: string[];
  items?: VideoItem[];
}

export interface ClinicSettings {
  clinicName: string;
  tagline: string;
  logoUrl: string;
  logoIconUrl: string;
  primaryColor: string; // e.g. #122442 (Summit Navy)
  accentColor: string;  // e.g. #76b72a (Summit Green)
  rotationSpeed: number; // in milliseconds (e.g. 10000)
  welcomeInterval: number; // in milliseconds (e.g. 900000 = 15 mins)
  welcomeDuration: number; // in milliseconds (e.g. 10000 = 10s)
  enableWelcomeOverlay: boolean;
  enableAntiBurnIn: boolean;
  antiBurnInOpacity: number; // 0.015 to 0.05
  currentPlaylistId: string;
  playlists: VideoPlaylist[];
  customVideos: VideoItem[];
  infoItems: ClinicAnnouncement[];
  phone: string;
  address: string;
  instagramHandle1: string;
  instagramHandle2: string;
  qrCodeUrl: string;
  clockFormat: '12h' | '24h';
  showWeather: boolean;
  weatherLocation: string;
  tvResolutionScale: '1080p' | '720p' | '4k';
  preventTvSleep: boolean;
  mutedByPolicy: boolean;
  notificationFontSize?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge';
  enableClosedCaptions?: boolean;
  captionFontSize?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' | 'xxxlarge';
  captionPosition?: 'bottom' | 'top';
}

export interface StreamExtractionResponse {
  success: boolean;
  videoId: string;
  title?: string;
  url?: string;
  embedUrl?: string;
  isDirectMedia?: boolean;
  isRestrictedEmbed?: boolean;
  error?: string;
  fallbackReason?: string;
}

export interface PlaylistFetchResponse {
  success: boolean;
  playlistId: string;
  title?: string;
  videoIds: string[];
  videos?: VideoItem[];
  error?: string;
}
