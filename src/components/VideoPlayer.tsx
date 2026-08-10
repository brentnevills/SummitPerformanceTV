import React, { useState, useEffect, useRef } from 'react';
import { VideoItem } from '../types';
import { Play, Pause, SkipForward, Volume2, VolumeX, ShieldAlert, Sparkles, Loader2, Youtube } from 'lucide-react';

interface Props {
  videoIds: string[];
  currentIndex: number;
  onNextVideo: () => void;
  accentColor: string;
  muted: boolean;
  onToggleMute: () => void;
}

interface StreamData {
  videoId: string;
  title?: string;
  url?: string;
  embedUrl?: string;
  isDirectMedia?: boolean;
  isRestrictedEmbed?: boolean;
  fallbackReason?: string;
}

interface CaptionCue {
  startTime: number;
  endTime: number;
  text: string;
}

const VideoPlayerComponent: React.FC<Props> = ({
  videoIds,
  currentIndex,
  onNextVideo,
  accentColor,
  muted,
  onToggleMute,
}) => {
  const currentVideoId = videoIds[currentIndex] || 'dJ9A_A4U3Xg';

  const [loading, setLoading] = useState(true);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Live YouTube Captions State
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionCues, setCaptionCues] = useState<CaptionCue[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Playback timer for caption synchronization
  useEffect(() => {
    setElapsedSeconds(0);
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentVideoId, isPlaying]);

  // Fetch captions for the currently playing video
  useEffect(() => {
    let isMounted = true;
    setCaptionCues([]);
    setElapsedSeconds(0);

    async function loadCaptions() {
      try {
        const resp = await fetch(`/api/video/captions/${currentVideoId}`);
        if (resp.ok) {
          const data = await resp.json();
          if (isMounted && data.captions && data.captions.length > 0) {
            setCaptionCues(data.captions);
          }
        }
      } catch (err) {
        console.warn('Caption fetch error:', err);
      }
    }

    loadCaptions();

    return () => {
      isMounted = false;
    };
  }, [currentVideoId]);

  // Calculate total duration covered by cues for smooth looping
  const maxCueTime = captionCues.length > 0 ? (captionCues[captionCues.length - 1].endTime || 180) : 180;
  const currentNormalizedTime = elapsedSeconds % Math.max(1, maxCueTime);

  // Active Caption Cue calculation
  const activeCue = captionCues.find(
    (cue) => currentNormalizedTime >= cue.startTime && currentNormalizedTime <= cue.endTime
  ) || (captionCues.length > 0 ? captionCues[Math.floor((currentNormalizedTime / maxCueTime) * captionCues.length)] : null);

  // Fetch Stream Info from Express Server
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setHasError(false);
    setErrorMessage('');

    async function fetchStream() {
      try {
        const resp = await fetch(`/api/stream/${currentVideoId}`);
        if (!resp.ok) {
          throw new Error(`Server returned ${resp.status}`);
        }
        const data = await resp.json();

        if (!isMounted) return;

        if (data.success) {
          setStreamData(data);
          setLoading(false);
        } else {
          // Direct fallback if API call returned failure
          setStreamData({
            videoId: currentVideoId,
            embedUrl: `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1`,
            isDirectMedia: false,
            isRestrictedEmbed: false,
          });
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.warn('Stream fetch error:', err);
        setStreamData({
          videoId: currentVideoId,
          embedUrl: `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1`,
          isDirectMedia: false,
          isRestrictedEmbed: false,
        });
        setLoading(false);
      }
    }

    fetchStream();

    return () => {
      isMounted = false;
    };
  }, [currentVideoId]);

  // Handle iframe mute/unmute dynamically via YouTube JS postMessage without iframe reload
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
      } catch (e) {
        // Ignore cross-origin postMessage warnings
      }
    }
  }, [muted]);

  // Handle HTML5 Video autoplay and end events
  useEffect(() => {
    if (videoRef.current && streamData?.isDirectMedia && streamData.url) {
      videoRef.current.muted = muted;
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [streamData, muted]);

  // Fallback Error Handler — Automatic skip if video is blocked
  const handleVideoError = () => {
    console.warn(`[Video Error] Video ${currentVideoId} failed to play or restricted. Skipping...`);
    setHasError(true);
    setErrorMessage('Embedding restricted by video owner — Auto-skipping in 3s...');
    setTimeout(() => {
      onNextVideo();
    }, 3000);
  };

  const handleVideoEnded = () => {
    console.log(`[Video Ended] Video ${currentVideoId} completed. Moving to next...`);
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
    }
  };

  return (
    <div className="video-content relative w-full h-full bg-black overflow-hidden flex items-center justify-center group">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-white space-y-4 animate-fade-in">
          <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-2xl font-bold tracking-wide">Connecting to Clinic Stream...</p>
            <p className="text-sm text-emerald-300 font-medium flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Bypassing Website Embedding Restrictions for Bolva TV
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

      {/* Direct HTML5 Video or YouTube IFrame Player with 16:9 Widescreen Ratio Wrapper */}
      <div className="video-aspect-box">
        {!loading && streamData?.isDirectMedia && streamData.url ? (
          <video
            ref={videoRef}
            id="tv-player"
            src={streamData.url}
            autoPlay
            playsInline
            muted={muted}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
            className="w-full h-full object-contain bg-black"
          />
        ) : null}

        {!loading && (!streamData?.isDirectMedia || !streamData?.url) ? (
          <iframe
            key={currentVideoId}
            ref={iframeRef}
            src={
              streamData?.embedUrl ||
              `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=1&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1&cc_load_policy=1&cc_lang_pref=en&hl=en`
            }
            title="TV Stream Player"
            className="w-full h-full border-0 bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={handleVideoError}
          />
        ) : null}
      </div>

      {/* Live YouTube-Style Closed Captions Overlay */}
      {captionsEnabled && activeCue && activeCue.text && (
        <div className="absolute bottom-5 sm:bottom-7 group-hover:bottom-20 inset-x-0 z-20 flex justify-center pointer-events-none transition-all duration-300 px-4">
          <div className="bg-black/85 text-white px-3 py-1 sm:px-4 sm:py-1.5 rounded-md text-xs sm:text-sm md:text-base font-medium tracking-wide text-center shadow-lg max-w-[70%] leading-snug font-sans select-none border border-white/10 backdrop-blur-xs">
            {activeCue.text}
          </div>
        </div>
      )}

      {/* Video Overlay Control Bar (Visible on mouse move / remote trigger) */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-between text-white">
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

          <button
            onClick={() => setCaptionsEnabled(!captionsEnabled)}
            className={`px-3 py-1.5 rounded-md text-xs font-black tracking-wider font-mono transition-all cursor-pointer flex items-center justify-center border ${
              captionsEnabled
                ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-500/50'
                : 'bg-white/20 hover:bg-white/30 text-slate-300 border-white/20'
            }`}
            title={captionsEnabled ? 'Turn Off Closed Captions (CC)' : 'Turn On Closed Captions (CC)'}
          >
            CC
          </button>

          <div>
            <p className="text-lg font-bold text-white tracking-wide drop-shadow">
              {streamData?.title || `Video ID: ${currentVideoId}`}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                {streamData?.isDirectMedia ? 'Direct Stream (Restrictions Bypassed)' : 'YouTube IFrame Mode'}
              </span>
              <span>• Video {currentIndex + 1} of {videoIds.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10 text-xs font-mono">
          <Youtube className="w-4 h-4 text-red-500" />
          <span>Bypass Engine Active</span>
        </div>
      </div>
    </div>
  );
};

export const VideoPlayer = React.memo(VideoPlayerComponent);
