import { useState, useEffect, useCallback, useRef } from 'react';

export type VideoQuality = 'high' | 'medium' | 'low';
export type ConnectionQuality = 'good' | 'fair' | 'poor';

const CONSTRAINTS = {
  high: { width: 1280, height: 720, frameRate: 30 },
  medium: { width: 640, height: 480, frameRate: 24 },
  low: { width: 320, height: 240, frameRate: 15 }
};

export const useMediaStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(true);
  
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>('high');
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('good');
  
  // Track if user has manually overridden quality
  const [isManualQuality, setIsManualQuality] = useState(false);
  const isManualQualityRef = useRef(false);

  // Keep stream ref in sync for effects
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  // Keep manual mode ref in sync for event listeners to prevent stale closures
  useEffect(() => {
    isManualQualityRef.current = isManualQuality;
  }, [isManualQuality]);

  const applyConstraints = useCallback(async (quality: VideoQuality) => {
    const s = streamRef.current;
    if (!s) return;
    const videoTrack = s.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      await videoTrack.applyConstraints(CONSTRAINTS[quality]);
      setCurrentQuality(quality);
    } catch (err) {
      console.warn(`Failed to apply ${quality} constraints:`, err);
    }
  }, []);

  // Network Monitoring for Adaptive Bitrate
  useEffect(() => {
    // Check for Network Information API support
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    const updateNetworkStatus = () => {
      if (!connection) return;
      
      const type = connection.effectiveType; // '4g', '3g', '2g', 'slow-2g'
      let newConnQuality: ConnectionQuality = 'good';
      
      if (type === 'slow-2g' || type === '2g') {
        newConnQuality = 'poor';
        // Only apply adaptive changes if NOT in manual mode
        if (!isManualQualityRef.current) applyConstraints('low');
      } else if (type === '3g') {
        newConnQuality = 'fair';
        if (!isManualQualityRef.current) applyConstraints('medium');
      } else {
        newConnQuality = 'good';
        // Auto-upgrade to high if network allows and in auto mode
        if (!isManualQualityRef.current) applyConstraints('high');
      }
      setConnectionQuality(newConnQuality);
    };

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
      updateNetworkStatus(); // Initial check
    }

    return () => {
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [applyConstraints]);

  const initStream = useCallback(async () => {
    // Fallback mechanism: Try High -> Medium -> Low -> Default
    const attempts: VideoQuality[] = ['high', 'medium', 'low'];
    
    let mediaStream: MediaStream | null = null;

    if (!navigator.mediaDevices) {
        setError("Media devices not supported in this browser or context (requires HTTPS or localhost).");
        return;
    }

    for (const quality of attempts) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            ...CONSTRAINTS[quality],
            facingMode: 'user'
          }
        });
        setCurrentQuality(quality);
        break; // Success
      } catch (err) {
        console.warn(`Failed to init stream at ${quality} quality:`, err);
        // Continue to next lower quality
      }
    }

    // Final fallback: try without specific video constraints
    if (!mediaStream) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setCurrentQuality('low'); // Assume low if defaults needed
      } catch (err) {
        console.error("All media stream attempts failed:", err);
        setError("Could not access camera or microphone. Please check permissions.");
        return;
      }
    }
      
    // Immediately disable tracks to match default OFF state
    mediaStream.getAudioTracks().forEach(track => {
      track.enabled = false;
    });
    mediaStream.getVideoTracks().forEach(track => {
      track.enabled = false;
    });

    setStream(mediaStream);
    setIsMuted(true);
    setIsVideoOff(true);
    setError(null);
    setIsManualQuality(false); // Reset to auto on init
  }, []);

  const toggleAudio = useCallback(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsMuted(!audioTracks[0].enabled);
      }
    }
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => {
          track.enabled = !track.enabled;
        });
        setIsVideoOff(!videoTracks[0].enabled);
      }
    }
  }, [stream]);

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Exposed function for manual selection or resetting to auto
  const setVideoQuality = useCallback(async (quality: VideoQuality | 'auto') => {
    if (quality === 'auto') {
      setIsManualQuality(false);
      // Attempt to restore high quality as baseline, or let network listener pick it up
      await applyConstraints('high'); 
    } else {
      setIsManualQuality(true);
      await applyConstraints(quality);
    }
  }, [applyConstraints]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    stream,
    error,
    isMuted,
    isVideoOff,
    currentQuality,
    isManualQuality,
    connectionQuality,
    initStream,
    toggleAudio,
    toggleVideo,
    setVideoQuality,
    stopStream
  };
};