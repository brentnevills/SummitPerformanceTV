import { ClinicSettings, VideoPlaylist, ClinicAnnouncement } from '../types';

export const DEFAULT_ANNOUNCEMENTS: ClinicAnnouncement[] = [
  {
    id: '1',
    text: 'Summit Performance Rehab & Wellness Centre',
    category: 'general',
    active: true,
  },
  {
    id: '2',
    text: 'Please check in at the front desk upon arrival.',
    category: 'reminder',
    active: true,
  },
  {
    id: '3',
    text: 'Reach Your Health Summit Here — Transforming Lives Through Hands-On Care.',
    category: 'wellness',
    active: true,
  },
  {
    id: '4',
    text: 'Home of Steady State Wellness — Specialized Physical Therapy & Recovery.',
    category: 'general',
    active: true,
  },
  {
    id: '5',
    text: 'Follow us on Instagram! @summit_performance_rehab',
    category: 'social',
    active: true,
  },
  {
    id: '6',
    text: 'Follow us on Instagram! @steadystate_ck',
    category: 'social',
    active: true,
  },
  {
    id: '7',
    text: 'Vote for us on CommunityVotes Chatham-Kent!',
    category: 'promo',
    active: true,
  },
  {
    id: '8',
    text: 'Ask our therapists about personalized recovery programs & ergonomic assessments.',
    category: 'wellness',
    active: true,
  },
];

export const PRESET_PLAYLISTS: VideoPlaylist[] = [
  {
    id: 'PLoXrf5exDo_qjKr7mbyyacKxD0zC57ej7', // Summit Rehab Custom Playlist ID
    title: 'Summit Rehab & Movement Focus',
    description: 'Curated exercises, posture tips, and patient wellness showcases',
    videoIds: [
      'dJ9A_A4U3Xg', // Posture correction & mobility
      '50kH0f3B0aY', // Low back relief stretch routine
      'g_tea8ZNk5A', // Shoulder & neck physical therapy exercises
      '4C-wgAXz24g', // Daily morning stretch routine
      'inpok4MKVLM', // Core stability & spinal wellness
    ],
  },
  {
    id: 'pl_relaxation_nature',
    title: '4K Ambient Nature & Scenic Relaxation',
    description: 'Ultra HD peaceful landscapes and ambient waterfalls for lobby calm',
    videoIds: [
      'BHACKCNDMW8', // 4K Nature relaxation
      '1ZYbU82GVz4', // Tropical beach ambient 4k
      'lE6RYpe921Q', // Forest stream sounds & visuals
      'dQw4w9WgXcQ', // Sample video
    ],
  },
  {
    id: 'pl_physio_education',
    title: 'Physical Therapy & Injury Prevention',
    description: 'Educational animations on joint health, ergonomics, and sports rehab',
    videoIds: [
      'dJ9A_A4U3Xg',
      '50kH0f3B0aY',
      'inpok4MKVLM',
    ],
  },
];

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  clinicName: 'Summit Performance Rehab',
  tagline: 'Wellness Centre & Physical Therapy',
  logoUrl: 'SummitLogo.png',
  logoIconUrl: 'SummitLogo.png',
  primaryColor: '#122442', // Summit Navy
  accentColor: '#76b72a',  // Summit Green
  rotationSpeed: 10000,    // 10s announcement rotation
  welcomeInterval: 900000, // 15 mins
  welcomeDuration: 10000,  // 10s
  enableWelcomeOverlay: true,
  enableAntiBurnIn: true,
  antiBurnInOpacity: 0.02,
  currentPlaylistId: 'PLoXrf5exDo_qjKr7mbyyacKxD0zC57ej7',
  playlists: PRESET_PLAYLISTS,
  customVideos: [
    {
      id: 'dJ9A_A4U3Xg',
      title: 'Full Body Mobility Routine',
      duration: '8:45',
      thumbnailUrl: 'https://img.youtube.com/vi/dJ9A_A4U3Xg/hqdefault.jpg',
      sourceType: 'youtube',
    },
    {
      id: '50kH0f3B0aY',
      title: 'Posture & Lumbar Spine Stretch',
      duration: '10:12',
      thumbnailUrl: 'https://img.youtube.com/vi/50kH0f3B0aY/hqdefault.jpg',
      sourceType: 'youtube',
    },
    {
      id: 'inpok4MKVLM',
      title: 'Ergonomic Desk Stretching Guide',
      duration: '6:30',
      thumbnailUrl: 'https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg',
      sourceType: 'youtube',
    },
  ],
  infoItems: DEFAULT_ANNOUNCEMENTS,
  phone: '(519) 351-7800',
  address: 'Chatham-Kent, ON',
  instagramHandle1: '@summit_performance_rehab',
  instagramHandle2: '@steadystate_ck',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://www.instagram.com/summit_performance_rehab/',
  clockFormat: '12h',
  showWeather: true,
  weatherLocation: 'Chatham-Kent, ON',
  tvResolutionScale: '1080p',
  preventTvSleep: true,
  mutedByPolicy: false,
};
