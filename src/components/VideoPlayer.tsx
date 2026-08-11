import React, { useState, useEffect, useRef } from 'react';
import { ClinicSettings } from '../types';
import { extractYouTubeId } from '../utils/youtube';
import { Play, Pause, SkipForward, Volume2, VolumeX, ShieldAlert, Sparkles, Loader2, Youtube } from 'lucide-react';

interface Props {
  videoIds: string[];
  currentIndex: number;
  onNextVideo: () => void;
  accentColor: string;
  muted: boolean;
  onToggleMute: () => void;
  settings?: ClinicSettings;
}

interface StreamData {
  videoId: string;
  title?: string;
  url?: string;
  embedUrl?: string;
  isDirectMedia?: boolean;
  isRestrictedEmbed?: boolean;
}

interface CaptionCue {
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

const DEFAULT_CUES: CaptionCue[] = [
  { startTime: 0, endTime: 6, speaker: 'Dr. Sarah (PT)', text: 'Welcome to Summit Physical Therapy & Performance Rehab.' },
  { startTime: 6, endTime: 12, speaker: 'Instructor', text: 'Maintain proper alignment, relaxed shoulders, and steady breathing.' },
  { startTime: 12, endTime: 18, speaker: 'Dr. Sarah (PT)', text: 'Inhale deeply as you prepare, and exhale smoothly through the movement.' },
  { startTime: 18, endTime: 24, speaker: 'Instructor', text: 'Engage your core gently and move within a comfortable range of motion.' },
  { startTime: 24, endTime: 30, speaker: 'Dr. Sarah (PT)', text: 'Perform 2 to 3 sets daily as prescribed by your physical therapist.' },
  { startTime: 30, endTime: 36, speaker: 'Instructor', text: 'Focus on quality of movement and controlled stability.' },
  { startTime: 36, endTime: 42, speaker: 'Clinic Announcer', text: 'Summit Performance Rehab — Restoring strength, mobility, and health.' },
];

const VideoPlayerComponent: React.FC<Props> = ({
  videoIds,
  currentIndex,
  onNextVideo,
  accentColor,
  muted,
  onToggleMute,
  settings,
}) => {
  const rawVideoId = videoIds[currentIndex] || 'dJ9A_A4U3Xg';
  const currentVideoId = extractYouTubeId(rawVideoId);

  const [loading, setLoading] = useState(true);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // CC State
  const [userCaptionsEnabled, setUserCaptionsEnabled] = useState(true);
  const [captionCues, setCaptionCues] = useState<CaptionCue[]>([]);
  const [captionSource, setCaptionSource] = useState<string>('');
  const [videoTime, setVideoTime] = useState<number>(0);
  const [liveSpeechText, setLiveSpeechText] = useState<string>('');
  const [isMicListening, setIsMicListening] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Is Closed Captions (CC) active?
  const isCcEnabled = userCaptionsEnabled && (settings?.enableClosedCaptions !== false);

  // Custom Real-Time Speech Recognition System
  useEffect(() => {
    if (!isCcEnabled) {
      setLiveSpeechText('');
      setIsMicListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser environment.');
      return;
    }

    let recognition: any = null;
    let shouldKeepListening = true;

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsMicListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setLiveSpeechText(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.log('Speech recognition event:', event.error);
      };

      recognition.onend = () => {
        setIsMicListening(false);
        if (shouldKeepListening && isCcEnabled) {
          try {
            recognition.start();
          } catch {
            // Ignore re-start collisions
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start error:', err);
    }

    return () => {
      shouldKeepListening = false;
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
      setIsMicListening(false);
    };
  }, [isCcEnabled, currentVideoId]);

  // Smooth video time clock + subsecond YouTube IFrame postMessage polling
  useEffect(() => {
    setVideoTime(0);
    if (!isPlaying) return;

    const timer = setInterval(() => {
      // Smoothly advance time ticker
      setVideoTime((prev) => prev + 0.25);

      // Poll YouTube IFrame for exact playback position via JS API
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'getCurrentTime', args: [] }),
            '*'
          );
        } catch {
          // Ignore cross-origin error
        }
      }
    }, 250);

    return () => clearInterval(timer);
  }, [currentVideoId, isPlaying]);

  // Handle postMessage events from YouTube IFrame Player for exact time sync
  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      try {
        let msg = event.data;
        if (typeof msg === 'string') msg = JSON.parse(msg);
        if (msg && msg.event === 'infoDelivery' && msg.info && typeof msg.info.currentTime === 'number') {
          setVideoTime(msg.info.currentTime);
        }
      } catch {
        // Ignore non-JSON postMessages
      }
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, []);

  // Fetch captions for current video from backend API
  useEffect(() => {
    let isMounted = true;
    setCaptionCues([]);
    setCaptionSource('');

    async function loadCaptions() {
      try {
        const resp = await fetch(`/api/video/captions/${currentVideoId}`);
        if (resp.ok) {
          const data = await resp.json();
          if (isMounted) {
            if (data.captions && data.captions.length > 0) {
              setCaptionCues(data.captions);
            }
            if (data.source) {
              setCaptionSource(data.source);
            }
          }
        }
      } catch (err) {
        console.warn('Caption fetch error:', err);
      }
    }

    loadCaptions();
    return () => { isMounted = false; };
  }, [currentVideoId]);

  // Send JS API postMessage commands to YouTube iframe to activate/deactivate native CC
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // Register widget listener with YouTube API
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
          '*'
        );

        if (isCcEnabled) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'loadModule',
              args: ['captions'],
            }),
            '*'
          );

          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'setOption',
              args: ['captions', 'track', { languageCode: 'en' }],
            }),
            '*'
          );
        } else {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'unloadModule',
              args: ['captions'],
            }),
            '*'
          );
        }
      } catch {
        // Ignore cross-origin error
      }
    }
  }, [isCcEnabled, currentVideoId, streamData]);

  // Fetch stream data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setHasError(false);
    setErrorMessage('');

    async function fetchStream() {
      try {
        const resp = await fetch(`/api/stream/${currentVideoId}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (!isMounted) return;

        if (data.success) {
          setStreamData(data);
          setLoading(false);
        } else {
          setStreamData({
            videoId: currentVideoId,
            embedUrl: `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1&cc_load_policy=1&cc_lang_pref=en&hl=en`,
            isDirectMedia: false,
          });
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted) return;
        setStreamData({
          videoId: currentVideoId,
          embedUrl: `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1&cc_load_policy=1&cc_lang_pref=en&hl=en`,
          isDirectMedia: false,
        });
        setLoading(false);
      }
    }

    fetchStream();
    return () => { isMounted = false; };
  }, [currentVideoId]);

  // Sync mute setting to YouTube iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: muted ? 'mute' : 'unMute',
            args: '',
          }),
          '*'
        );
      } catch {}
    }
  }, [muted]);

  // HTML5 Video time update handler
  const handleTimeUpdate = () => {
    if (videoRef.current && streamData?.isDirectMedia) {
      setVideoTime(videoRef.current.currentTime);
    }
  };

  const handleVideoError = () => {
    setHasError(true);
    setErrorMessage('Embedding restricted by video owner — Auto-skipping in 3s...');
    setTimeout(() => {
      onNextVideo();
    }, 3000);
  };

  const handleVideoEnded = () => {
    onNextVideo();
  };

  const togglePlayPause = () => {
    if (videoRef.current && streamData?.isDirectMedia) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: isPlaying ? 'pauseVideo' : 'playVideo',
            args: '',
          }),
          '*'
        );
        setIsPlaying(!isPlaying);
      } catch {}
    }
  };

  // Determine Active Caption Cue for custom overlay
  let activeCue: CaptionCue | null = null;
  if (isCcEnabled && captionSource === 'youtube_native' && captionCues && captionCues.length > 0) {
    // Exact time match against real transcript
    activeCue = captionCues.find((cue) => videoTime >= cue.startTime && videoTime <= cue.endTime) || null;
  }

  const activeCaptionText = liveSpeechText || activeCue?.text;

  // Caption styling based on Settings
  const captionFontSizeClass = {
    small: 'text-xs sm:text-sm py-2 px-4 max-w-[70%]',
    medium: 'text-base sm:text-lg py-3 px-6 max-w-[80%]',
    large: 'text-xl sm:text-2xl py-4 px-8 max-w-[85%]',
    xlarge: 'text-2xl sm:text-3xl py-5 px-10 max-w-[90%]',
  }[settings?.captionFontSize || 'medium'];

  const captionPosClass = (settings?.captionPosition === 'top')
    ? 'top-28 sm:top-32'
    : 'bottom-8 sm:bottom-12 group-hover:bottom-24';

  return (
    <div className="video-content relative w-full h-full bg-black overflow-hidden flex items-center justify-center group">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-white space-y-4 animate-fade-in">
          <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold tracking-wide">Connecting to Clinic TV Stream...</p>
            <p className="text-sm text-emerald-300 font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Loading HD Video & Synchronized Closed Captions
            </p>
          </div>
        </div>
      )}

      {/* Restricted Error Banner */}
      {hasError && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-lg animate-bounce">
          <ShieldAlert className="w-6 h-6" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 16:9 Widescreen Video Box */}
      <div className="video-aspect-box">
        {!loading && streamData?.isDirectMedia && streamData.url ? (
          <video
            ref={videoRef}
            id="tv-player"
            src={streamData.url}
            autoPlay
            playsInline
            muted={muted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            className="w-full h-full object-contain bg-black"
          />
        ) : null}

        {!loading && (!streamData?.isDirectMedia || !streamData?.url) ? (
          <iframe
            key={`${currentVideoId}-${isCcEnabled ? 'cc-on' : 'cc-off'}`}
            ref={iframeRef}
            src={
              streamData?.embedUrl ||
              `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1&cc_load_policy=${isCcEnabled ? 1 : 0}&cc_lang_pref=en&hl=en`
            }
            title="TV Stream Player"
            className="w-full h-full border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={handleVideoError}
          />
        ) : null}
      </div>

      {/* Closed Captions (CC) On-Screen Overlay */}
      {isCcEnabled && activeCaptionText && (
        <div className={`absolute ${captionPosClass} inset-x-0 z-30 flex justify-center pointer-events-none transition-all duration-300 px-6`}>
          <div className={`bg-slate-950/95 text-white ${captionFontSizeClass} rounded-2xl font-medium tracking-wide text-center shadow-2xl leading-relaxed font-sans select-none border border-white/20 backdrop-blur-md flex flex-col items-center gap-1.5 animate-fade-in`}>
            {activeCue?.speaker ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeCue.speaker}
                </span>
                <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                  CLOSED CAPTIONS
                </span>
              </div>
            ) : null}
            <p className="text-slate-100 font-sans font-medium drop-shadow-md">
              "{activeCaptionText}"
            </p>
          </div>
        </div>
      )}

      {/* Video Controls Bar */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-6 z-40 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white cursor-pointer transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
          </button>

          <button
            onClick={onNextVideo}
            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white cursor-pointer transition-transform active:scale-95"
            title="Next Video"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white cursor-pointer transition-transform active:scale-95"
            title={muted ? 'Unmute TV Audio' : 'Mute TV Audio'}
          >
            {muted ? <VolumeX className="w-6 h-6 text-amber-400" /> : <Volume2 className="w-6 h-6 text-emerald-400" />}
          </button>

          {/* CC Toggle Button */}
          <button
            onClick={() => setUserCaptionsEnabled(!userCaptionsEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider font-mono transition-all cursor-pointer flex items-center justify-center border gap-1.5 ${
              isCcEnabled
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/50'
                : 'bg-white/20 hover:bg-white/30 text-slate-300 border-white/20'
            }`}
            title={isCcEnabled ? 'Turn Off Closed Captions (CC)' : 'Turn On Closed Captions (CC)'}
          >
            <span>CC</span>
            <span className="text-[10px] font-sans font-bold uppercase">{isCcEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <div>
            <p className="text-lg font-bold text-white tracking-wide drop-shadow">
              {streamData?.title || `Video ID: ${currentVideoId}`}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                HD Player
              </span>
              <span>• Video {currentIndex + 1} of {videoIds.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10 text-xs font-mono">
          <Youtube className="w-4 h-4 text-red-500" />
          <span>Summit TV</span>
        </div>
      </div>
    </div>
  );
};

export const VideoPlayer = React.memo(VideoPlayerComponent);
