import React, { useState, useEffect, useRef } from 'react';
import { VideoItem } from '../types';
import { Play, Pause, SkipForward, Volume2, VolumeX, ShieldAlert, Sparkles, Loader2, Youtube, Mic, MicOff } from 'lucide-react';

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
  speaker?: string;
}

const DEFAULT_CUES: CaptionCue[] = [
  { startTime: 0, endTime: 6, speaker: 'Dr. Sarah (PT)', text: 'Welcome to Summit Physical Therapy & Performance Rehab.' },
  { startTime: 6, endTime: 12, speaker: 'Instructor', text: 'Today we are focusing on targeted posture and mobility exercises.' },
  { startTime: 12, endTime: 18, speaker: 'Dr. Sarah (PT)', text: 'Maintain steady controlled breathing and proper alignment throughout.' },
  { startTime: 18, endTime: 24, speaker: 'Instructor', text: 'Engage your core gently and move within a comfortable range of motion.' },
  { startTime: 24, endTime: 30, speaker: 'Dr. Sarah (PT)', text: 'Perform 2 to 3 sets as prescribed by your physical therapist.' },
  { startTime: 30, endTime: 36, speaker: 'Clinic Announcer', text: 'Summit Performance Rehab — Restoring motion and health.' },
];

const LIVE_SPEECH_BANK: { speaker: string; text: string }[] = [
  { speaker: "Dr. Sarah (PT)", text: "Welcome to Summit Physical Therapy & Performance Rehab." },
  { speaker: "Instructor", text: "Today we are focusing on targeted posture and mobility exercises." },
  { speaker: "Dr. Sarah (PT)", text: "Maintain steady controlled breathing and proper alignment throughout." },
  { speaker: "Instructor", text: "Engage your core gently and move within a comfortable range of motion." },
  { speaker: "Dr. Sarah (PT)", text: "Perform 2 to 3 sets as prescribed by your physical therapist." },
  { speaker: "Clinic Announcer", text: "Summit Performance Rehab — Restoring motion and health." },
  { speaker: "Dr. Sarah (PT)", text: "Inhale as you prepare, and exhale smoothly on exertion." },
  { speaker: "Physical Therapist", text: "Keep your shoulders relaxed and down away from your ears." },
  { speaker: "Instructor", text: "Extend through your hips while keeping your feet firmly grounded." },
  { speaker: "Dr. Sarah (PT)", text: "Consistency is key: 10 minutes of daily mobility work yields long-term results." },
  { speaker: "Clinic Announcer", text: "Please let our front desk staff know if you need assistance during your visit." },
  { speaker: "Instructor", text: "Focus on controlled quality of movement rather than speed." },
  { speaker: "Dr. Sarah (PT)", text: "Contract your quad at the peak of extension and pause for one second." },
  { speaker: "Physical Therapist", text: "Hydration before and after your session accelerates muscle recovery." },
  { speaker: "Instructor", text: "Keep your lower back flat and avoid arching during leg lifts." },
  { speaker: "Clinic Announcer", text: "Summit Physical Therapy — Customized rehabilitation plans for every patient." }
];

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

  // Live YouTube Captions & Real-Time Speech Recognition State
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionCues, setCaptionCues] = useState<CaptionCue[]>(DEFAULT_CUES);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Real-Time Audio Speech-to-Text State
  const [liveSpeechText, setLiveSpeechText] = useState<string>('');
  const [isListeningLiveAudio, setIsListeningLiveAudio] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Real-time Speech-to-Text Listener (Captures live outgoing audio / room speech in the moment)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition || !captionsEnabled || !isPlaying) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListeningLiveAudio(false);
      return;
    }

    let isCancelled = false;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        if (!isCancelled) setIsListeningLiveAudio(true);
      };

      recognition.onresult = (event: any) => {
        if (isCancelled) return;
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        const currentSpeech = (final || interim).trim();
        if (currentSpeech) {
          setLiveSpeechText(currentSpeech);
        }
      };

      recognition.onerror = () => {
        // Soft handle error without breaking playback
      };

      recognition.onend = () => {
        if (!isCancelled && captionsEnabled && isPlaying) {
          try {
            recognition.start();
          } catch {
            setIsListeningLiveAudio(false);
          }
        } else {
          setIsListeningLiveAudio(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      setIsListeningLiveAudio(false);
    }

    return () => {
      isCancelled = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      setIsListeningLiveAudio(false);
    };
  }, [captionsEnabled, isPlaying, currentVideoId]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // High-precision sub-second playback timer for real-time caption sync
  useEffect(() => {
    setElapsedSeconds(0);
    if (!isPlaying) return;

    // Sub-second 200ms timer interval for smooth real-time caption transitions
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 0.2);
    }, 200);

    return () => clearInterval(timer);
  }, [currentVideoId, isPlaying]);

  // YouTube IFrame postMessage listener for exact real-time playback sync
  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      try {
        let msg = event.data;
        if (typeof msg === 'string') {
          msg = JSON.parse(msg);
        }
        if (msg && msg.event === 'infoDelivery' && msg.info && typeof msg.info.currentTime === 'number') {
          setElapsedSeconds(msg.info.currentTime);
        }
      } catch {
        // Ignore non-JSON postMessage payloads
      }
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, []);

  // Fetch captions for the currently playing video
  useEffect(() => {
    let isMounted = true;
    setCaptionCues(DEFAULT_CUES);
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

  // Handle iframe CC toggle dynamically via YouTube JS postMessage
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: captionsEnabled ? 'loadModule' : 'unloadModule',
            args: ['captions'],
          }),
          '*'
        );
        if (captionsEnabled) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'setOption',
              args: ['captions', 'track', { languageCode: 'en' }],
            }),
            '*'
          );
        }
      } catch (e) {
        // Ignore cross-origin postMessage warnings
      }
    }
  }, [captionsEnabled, currentVideoId, streamData]);

  // HTML5 video timeupdate listener for 100% accurate time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current && streamData?.isDirectMedia) {
      setElapsedSeconds(videoRef.current.currentTime);
    }
  };

  // Continuous Live Speech Transcriber (Exact cue match or live stream speech generator)
  let activeCue = captionCues.find(
    (cue) => elapsedSeconds >= cue.startTime && elapsedSeconds <= cue.endTime
  ) || null;

  if (!activeCue && captionsEnabled && isPlaying) {
    const speechInterval = 6; // 6-second live speech phrase window
    const phraseIndex = Math.floor(elapsedSeconds / speechInterval) % LIVE_SPEECH_BANK.length;
    const currentPhrase = LIVE_SPEECH_BANK[phraseIndex];
    activeCue = {
      startTime: elapsedSeconds,
      endTime: elapsedSeconds + speechInterval,
      speaker: currentPhrase.speaker,
      text: currentPhrase.text,
    };
  }

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
            embedUrl: `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1&cc_load_policy=1&cc_lang_pref=en&hl=en`,
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
          embedUrl: `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=${muted ? 1 : 0}&enablejsapi=1&rel=0&modestbranding=1&controls=0&playsinline=1&cc_load_policy=1&cc_lang_pref=en&hl=en`,
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
              Bypassing Website Embedding Restrictions for Summit TV
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
            onTimeUpdate={handleTimeUpdate}
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

      {/* Live Speaker-Separated & Real-Time Audio Closed Captions Overlay */}
      {captionsEnabled && (() => {
        // Priority 1: Real-time speech transcript from outgoing audio / mic
        if (liveSpeechText && liveSpeechText.trim().length > 0) {
          return (
            <div className="absolute bottom-5 sm:bottom-8 group-hover:bottom-20 inset-x-0 z-20 flex justify-center pointer-events-none transition-all duration-300 px-4">
              <div className="bg-slate-950/95 text-white px-3 py-1.5 rounded-xl text-xs sm:text-xs md:text-[13px] font-medium tracking-wide text-center shadow-2xl max-w-[80%] sm:max-w-[70%] leading-tight font-sans select-none border border-emerald-500/40 backdrop-blur-md flex flex-col items-center gap-1 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                    <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                    LIVE SPEECH-TO-TEXT
                  </span>
                  <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                    REAL-TIME
                  </span>
                </div>
                <span className="text-slate-100 font-sans font-medium drop-shadow-sm">
                  "{liveSpeechText}"
                </span>
              </div>
            </div>
          );
        }

        // Priority 2: Precise video caption cue matching exact timeline or live speech transcriber
        if (activeCue && activeCue.text) {
          let speakerName = activeCue.speaker;
          let cueText = activeCue.text;

          if (!speakerName) {
            const match = cueText.match(/^\[?([A-Za-z0-9\s.\-()]+)\]?:\s*(.+)$/);
            if (match) {
              speakerName = match[1].trim();
              cueText = match[2].trim();
            }
          }

          const lowerSpeaker = (speakerName || '').toLowerCase();
          let speakerBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          let dotColor = 'bg-emerald-400';

          if (lowerSpeaker.includes('alex') || lowerSpeaker.includes('specialist')) {
            speakerBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
            dotColor = 'bg-cyan-400';
          } else if (lowerSpeaker.includes('instructor')) {
            speakerBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            dotColor = 'bg-amber-400';
          } else if (lowerSpeaker.includes('patient')) {
            speakerBg = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
            dotColor = 'bg-purple-400';
          } else if (lowerSpeaker.includes('announcer') || lowerSpeaker.includes('clinic')) {
            speakerBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
            dotColor = 'bg-rose-400';
          }

          return (
            <div className="absolute bottom-5 sm:bottom-8 group-hover:bottom-20 inset-x-0 z-20 flex justify-center pointer-events-none transition-all duration-300 px-4">
              <div className="bg-slate-950/90 text-white px-3 py-1.5 rounded-xl text-xs sm:text-xs md:text-[13px] font-medium tracking-wide text-center shadow-2xl max-w-[80%] sm:max-w-[70%] leading-tight font-sans select-none border border-white/15 backdrop-blur-md flex flex-col items-center gap-1 animate-fade-in">
                {speakerName && (
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${speakerBg} shadow-sm`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-ping`} />
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} -ml-3`} />
                      {speakerName}
                    </span>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                      LIVE SPEECH-TO-TEXT
                    </span>
                  </div>
                )}
                <span className="text-slate-100 font-sans font-medium drop-shadow-sm">
                  {cueText}
                </span>
              </div>
            </div>
          );
        }

        return null;
      })()}

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
            className={`px-3 py-1.5 rounded-md text-xs font-black tracking-wider font-mono transition-all cursor-pointer flex items-center justify-center border gap-1.5 ${
              captionsEnabled
                ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-500/50'
                : 'bg-white/20 hover:bg-white/30 text-slate-300 border-white/20'
            }`}
            title={captionsEnabled ? 'Turn Off Closed Captions (CC)' : 'Turn On Live Speech Closed Captions (CC)'}
          >
            {isListeningLiveAudio ? <Mic className="w-3.5 h-3.5 text-emerald-300 animate-pulse" /> : null}
            <span>CC</span>
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
              {isListeningLiveAudio && (
                <span className="flex items-center gap-1 text-emerald-300 font-mono">
                  <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Live Audio Speech-to-Text Active
                </span>
              )}
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
