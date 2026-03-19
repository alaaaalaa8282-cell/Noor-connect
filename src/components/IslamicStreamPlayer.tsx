/**
 * Islamic Stream Player
 * HLS streaming component for Makkah and Madinah with dark Islamic aesthetic
 * Dependencies: hls.js (MIT License)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  Loader2,
  Moon,
  Radio,
  Volume2,
  VolumeX,
  Heart,
  Share2,
  Settings,
  Wifi,
  WifiOff,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircle,
  Bell,
  MoreVertical,
  Signal,
  Activity,
  Zap,
  Globe,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { fetchSaudiPlaylist, FALLBACK_STREAMS, type Channel } from '@/lib/m3u-parser';

type StreamLocation = 'makkah' | 'madinah';

interface StreamConfig {
  channel: Channel | null;
  isLoading: boolean;
  error: string | null;
  isPlaying: boolean;
  isBuffering: boolean;
  viewerCount: number;
  quality: string;
  latency: number;
  bitrate: number;
}

const PARTICLE_LAYER = Array.from({ length: 8 }, (_, index) => ({
  left: `${(index * 11) % 96 + 2}%`,
  top: `${(index * 15) % 90 + 5}%`,
  delay: `${index * 0.34}s`,
  size: `${4 + (index % 3) * 2}px`,
  opacity: 0.25 + (index % 3) * 0.15,
}));

export default function IslamicStreamPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // Store stream URLs separately so we don't re-trigger HLS init on state updates
  const streamUrlsRef = useRef<Record<StreamLocation, string | null>>({
    makkah: FALLBACK_STREAMS.makkah?.url || null,
    madinah: FALLBACK_STREAMS.madinah?.url || null,
  });

  const [activeTab, setActiveTab] = useState<StreamLocation>('makkah');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [showStats, setShowStats] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState('excellent');
  const [streamStats, setStreamStats] = useState({
    fps: 30,
    droppedFrames: 0,
    bandwidth: 0,
    bufferHealth: 100,
  });

  const [streams, setStreams] = useState<Record<StreamLocation, StreamConfig>>({
    makkah: {
      channel: FALLBACK_STREAMS.makkah,
      isLoading: true,
      error: null,
      isPlaying: false,
      isBuffering: false,
      viewerCount: Math.floor(Math.random() * 50000) + 25000,
      quality: 'HD',
      latency: 2.1,
      bitrate: 2500,
    },
    madinah: {
      channel: FALLBACK_STREAMS.madinah,
      isLoading: true,
      error: null,
      isPlaying: false,
      isBuffering: false,
      viewerCount: Math.floor(Math.random() * 40000) + 20000,
      quality: 'HD',
      latency: 2.3,
      bitrate: 2300,
    },
  });

  // Declare currentStream early to avoid hoisting issues
  const currentStream = streams[activeTab];

  // Enhanced controls auto-hide
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (currentStream.isPlaying && !isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [currentStream.isPlaying, isFullscreen]);

  // Picture-in-Picture toggle
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  }, []);

  // Update stream stats
  const updateStreamStats = useCallback(() => {
    if (hlsRef.current && videoRef.current) {
      const hls = hlsRef.current;
      const video = videoRef.current;
      
      setStreamStats({
        fps: Math.round(30 + Math.random() * 5),
        droppedFrames: Math.floor(Math.random() * 3),
        bandwidth: Math.round(hls.currentLevel ? hls.levels[hls.currentLevel].bitrate / 1000 : 2500),
        bufferHealth: Math.round(Math.random() * 20 + 80),
      });
    }
  }, []);

  // Monitor connection quality
  useEffect(() => {
    const monitorConnection = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        const speed = connection.effectiveType || '4g';
        setConnectionSpeed(speed);
      }
    };

    monitorConnection();
    const interval = setInterval(monitorConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update stats periodically
  useEffect(() => {
    if (currentStream.isPlaying) {
      const interval = setInterval(updateStreamStats, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStream.isPlaying, updateStreamStats]);

  // Simulate viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setStreams(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          viewerCount: prev[activeTab].viewerCount + Math.floor(Math.random() * 200 - 100),
        },
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);
  useEffect(() => {
    const loadPlaylist = async () => {
      const playlist = await fetchSaudiPlaylist();

      const makkahChannel = playlist.makkah || FALLBACK_STREAMS.makkah;
      const madinahChannel = playlist.madinah || FALLBACK_STREAMS.madinah;

      // Store URLs in ref so initializeHLS can read them without being in dep array
      streamUrlsRef.current = {
        makkah: makkahChannel?.url || null,
        madinah: madinahChannel?.url || null,
      };

      setStreams(prev => ({
        makkah: { ...prev.makkah, channel: makkahChannel, isLoading: false },
        madinah: { ...prev.madinah, channel: madinahChannel, isLoading: false },
      }));
    };

    loadPlaylist();
  }, []);

  // Destroy HLS helper
  const destroyHLS = useCallback(() => {
    const video = videoRef.current;
    const hls = hlsRef.current;

    if (video) {
      video.pause();
      video.src = '';
      video.load();
    }

    if (hls) {
      hlsRef.current = null;
      setTimeout(() => {
        try { hls.destroy(); } catch (_) {}
      }, 100);
    }
  }, []);

  // Initialize HLS — only depends on activeTab, not on streams state
  const initializeHLS = useCallback((url: string, tab: StreamLocation) => {
    const video = videoRef.current;
    if (!video) return;

    destroyHLS();

    setStreams(prev => ({
      ...prev,
      [tab]: { ...prev[tab], isLoading: true, error: null, isPlaying: false },
    }));

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3,
        startLevel: -1,          // auto pick best level
        abrEwmaDefaultEstimate: 500000, // start bandwidth estimate at 500kbps
      });

      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(url);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        // Debug: Log available qualities
        console.log('Available qualities:', data.levels.map((level) => `${level.height}p`));
        
        // Force highest quality
        hls.currentLevel = data.levels.length - 1;
        
        setStreams(prev => ({
          ...prev,
          [tab]: { ...prev[tab], isLoading: false, isPlaying: true, isBuffering: false },
        }));
        video.play().catch(() => {
          // Autoplay blocked — user needs to click play
          setStreams(prev => ({
            ...prev,
            [tab]: { ...prev[tab], isPlaying: false },
          }));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            const msg = data.type === Hls.ErrorTypes.NETWORK_ERROR
              ? 'Network error. Please check your connection.'
              : 'Failed to load stream. Please try again.';
            setStreams(prev => ({
              ...prev,
              [tab]: { ...prev[tab], error: msg, isLoading: false, isBuffering: false },
            }));
          }
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDING, () => {
        setStreams(prev => ({ ...prev, [tab]: { ...prev[tab], isBuffering: true } }));
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setStreams(prev => ({ ...prev, [tab]: { ...prev[tab], isBuffering: false } }));
      });

      hls.attachMedia(video);

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setStreams(prev => ({
          ...prev,
          [tab]: { ...prev[tab], isLoading: false, isPlaying: true },
        }));
        video.play().catch(() => {});
      }, { once: true });
    } else {
      setStreams(prev => ({
        ...prev,
        [tab]: { ...prev[tab], error: 'HLS is not supported in your browser.', isLoading: false },
      }));
    }
  }, [destroyHLS]);

  // Trigger HLS ONLY when activeTab changes or playlist loads — NOT on stream state changes
  const activeTabRef = useRef<StreamLocation>(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
    const url = streamUrlsRef.current[activeTab];
    if (url) {
      initializeHLS(url, activeTab);
    }

    return () => { destroyHLS(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // When playlist finishes loading, init if URL changed from fallback
  useEffect(() => {
    const url = streamUrlsRef.current[activeTabRef.current];
    if (url) {
      initializeHLS(url, activeTabRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrlsRef.current.makkah, streamUrlsRef.current.madinah]);

  // Retry
  const handleRetry = useCallback(() => {
    const url = streamUrlsRef.current[activeTab];
    if (url) {
      setStreams(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], error: null, isLoading: true },
      }));
      initializeHLS(url, activeTab);
    }
  }, [activeTab, initializeHLS]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setStreams(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], isPlaying: true } }));
    } else {
      video.pause();
      setStreams(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], isPlaying: false } }));
    }
  }, [activeTab]);

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!isFullscreen) {
        await (container.requestFullscreen?.() ?? (container as any).webkitRequestFullscreen?.());
      } else {
        await (document.exitFullscreen?.() ?? (document as any).webkitExitFullscreen?.());
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, []);

  // Volume
  const handleVolumeChange = useCallback((value: number[]) => {
    const v = value[0];
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    if (v > 0 && isMuted) setIsMuted(false);
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const statusLabel = currentStream.isPlaying ? 'LIVE' : 'Standby';
  const fadeOpacity = activeTab === 'makkah' ? 1 : 0.94;

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-gradient-to-br from-gray-950 via-emerald-950/20 to-gray-950 text-white shadow-2xl border border-white/10 rounded-[32px] overflow-hidden group ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      onMouseEnter={() => {
        setShowControls(true);
        resetControlsTimer();
      }}
      onMouseLeave={() => currentStream.isPlaying && setShowControls(false)}
      onClick={() => {
        setShowControls(true);
        resetControlsTimer();
      }}
    >
      <style>{`
        @keyframes sacredDust {
          0% { transform: translateY(0) scale(0.9); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.05); opacity: 0.6; }
          100% { transform: translateY(10px) scale(0.95); opacity: 0.2; }
        }
        @keyframes sacredSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(52, 211, 153, 0.6); }
          50% { box-shadow: 0 0 40px rgba(52, 211, 153, 0.9); }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .floating-particle { animation: sacredDust 8s ease-in-out infinite; }
        .sacred-spinner { animation: sacredSpin 2.2s linear infinite; transform-origin: center; }
        .live-indicator { animation: pulse-glow 2s ease-in-out infinite; }
        .slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>

      {/* Enhanced Header */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              {currentStream.isPlaying && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full live-indicator" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Live Transmission</h1>
              <p className="text-sm text-white/70">{currentStream.channel?.name || 'Connecting...'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewer Count */}
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
              <Eye className="w-4 h-4 text-white/70" />
              <span className="text-sm text-white/70">{currentStream.viewerCount.toLocaleString()}</span>
            </div>

            {/* Quality Badge */}
            <Badge variant="secondary" className="bg-black/40 text-white/70 border border-white/10">
              {currentStream.quality}
            </Badge>

            {/* Connection Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
              connectionSpeed === 'excellent' ? 'bg-green-500/20 text-green-400' : 
              connectionSpeed === 'good' ? 'bg-yellow-500/20 text-yellow-400' : 
              'bg-red-500/20 text-red-400'
            }`}>
              {connectionSpeed === 'excellent' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="text-xs">{connectionSpeed}</span>
            </div>

            {/* Action Buttons */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <Share2 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

        {/* Modern Location Tabs */}
      <div className="absolute top-20 left-0 right-0 z-20 flex justify-center px-4">
        <div className="flex items-center gap-1 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          {(['makkah', 'madinah'] as StreamLocation[]).map((location) => (
            <Button
              key={location}
              variant={activeTab === location ? "default" : "ghost"}
              onClick={() => setActiveTab(location)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === location 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="capitalize">{location}</span>
                {activeTab === location && currentStream.isPlaying && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Enhanced Video Container */}
      <div className="relative w-full aspect-video bg-black rounded-[32px] overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5" />
          {PARTICLE_LAYER.map((particle, index) => (
            <span
              key={index}
              className="floating-particle absolute rounded-full bg-gradient-to-br from-emerald-400/30 to-transparent"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
                animationDelay: particle.delay,
              }}
            />
          ))}
        </div>

        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          muted={isMuted}
          onClick={togglePlay}
        />

        {/* Overlay Controls */}
        <div className={`absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Top Overlay Stats */}
          {showStats && (
            <div className="flex justify-center">
              <div className="bg-black/80 backdrop-blur-md rounded-lg p-3 border border-white/10">
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div className="text-center">
                    <div className="text-green-400 font-mono">{streamStats.fps}</div>
                    <div className="text-white/60">FPS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-mono">{streamStats.bandwidth}</div>
                    <div className="text-white/60">Mbps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-mono">{currentStream.latency}s</div>
                    <div className="text-white/60">Latency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-mono">{streamStats.bufferHealth}%</div>
                    <div className="text-white/60">Buffer</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Center Play Button */}
          {!currentStream.isLoading && !currentStream.error && !currentStream.isPlaying && (
            <div className="flex-1 flex items-center justify-center">
              <Button
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-2xl group"
              >
                <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
          )}

          {/* Loading State */}
          {currentStream.isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <Sparkles className="absolute inset-0 w-16 h-16 text-emerald-400 animate-pulse" />
              </div>
              <p className="text-white/70 text-sm">Connecting to sacred stream...</p>
            </div>
          )}

          {/* Buffering Indicator */}
          {currentStream.isBuffering && !currentStream.isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-black/80 backdrop-blur-md rounded-full p-4 border border-white/10">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            </div>
          )}

          {/* Error State */}
          {currentStream.error && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 text-center max-w-md px-4">{currentStream.error}</p>
              <Button
                onClick={handleRetry}
                className="px-6 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                Retry Connection
              </Button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-t-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={togglePlay}
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  {currentStream.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.1}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowStats(!showStats)}
                  variant="ghost"
                  size="icon"
                  className={`w-8 h-8 rounded-full ${showStats ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  <Activity className="w-4 h-4" />
                </Button>

                <Button
                  onClick={togglePiP}
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Minimize className="w-4 h-4" />
                </Button>

                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
          {/* Settings Panel */}
      {showSettings && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Stream Settings</h3>
              <Button
                onClick={() => setShowSettings(false)}
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Quality Selection */}
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">Stream Quality</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Auto', '1080p', '720p', '480p'].map((q) => (
                    <Button
                      key={q}
                      variant={quality === q.toLowerCase() ? "default" : "outline"}
                      onClick={() => setQuality(q.toLowerCase())}
                      className="justify-center"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Connection Stats */}
              <div>
                <h4 className="text-sm font-medium text-white/70 mb-3">Connection Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-emerald-400 font-mono">{streamStats.bandwidth} Mbps</div>
                    <div className="text-white/60 text-xs">Bandwidth</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-blue-400 font-mono">{currentStream.latency}s</div>
                    <div className="text-white/60 text-xs">Latency</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-green-400 font-mono">{streamStats.fps} FPS</div>
                    <div className="text-white/60 text-xs">Frame Rate</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-purple-400 font-mono">{streamStats.bufferHealth}%</div>
                    <div className="text-white/60 text-xs">Buffer Health</div>
                  </div>
                </div>
              </div>

              {/* Audio Settings */}
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">Audio Volume</label>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>Muted</span>
                  <span>{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                  <span>Full</span>
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <h4 className="text-sm font-medium text-white/70 mb-3">Advanced Options</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowStats(!showStats)}
                    className="w-full justify-between"
                  >
                    <span>Show Stream Stats</span>
                    <Activity className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="w-full justify-between"
                  >
                    <span>Reconnect Stream</span>
                    <Zap className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-12 right-6 h-40 w-40 rounded-full bg-emerald-500/20 blur-[70px]" />
        <div className="absolute bottom-10 left-6 h-32 w-32 rounded-full bg-blue-500/25 blur-[60px]" />
      </div>
    </div>
  );
}
