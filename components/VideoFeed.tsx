import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, User as UserIcon, MonitorUp, Signal, Wifi, WifiOff } from 'lucide-react';
import { Participant } from '../types';

interface VideoFeedProps {
  participant: Participant;
  variant?: 'featured' | 'list'; // 'featured' = large main view, 'list' = filmstrip view
}

const VideoFeed: React.FC<VideoFeedProps> = ({ participant, variant = 'list' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // We must re-attach the srcObject whenever the video element is mounted (e.g. toggled on)
    // or when the stream source changes (e.g. switch to screen share)
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.isVideoOff]);

  const isFeatured = variant === 'featured';
  const isScreenSharing = participant.isScreenSharing;
  const connectionQuality = participant.connectionQuality || 'good';

  // Determine content to render based on priority:
  // 1. Video Stream (if available and not hidden)
  // 2. Remote Screen Share Placeholder (if remote user is sharing screen)
  // 3. User Avatar/Mock (fallback)
  
  const renderContent = () => {
    // CASE 1: Active Stream (Local or Real WebRTC)
    if (participant.stream && !participant.isVideoOff) {
        return (
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={participant.isLocal} // Always mute local to prevent echo
                className={`w-full h-full ${isScreenSharing ? 'object-contain' : 'object-cover'}`}
            />
        );
    }

    // CASE 2: Remote User Sharing Screen (Simulated - no stream)
    if (isScreenSharing && !participant.stream) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white animate-in fade-in duration-300">
                <MonitorUp size={isFeatured ? 64 : 32} className="mb-4 opacity-50 text-brand-400" />
                <span className="text-sm font-medium opacity-70 text-center px-4">
                    {participant.name} is sharing their screen
                </span>
                {isFeatured && <span className="text-xs text-gray-500 mt-2">(Feed unavailable in simulation)</span>}
            </div>
        );
    }

    // CASE 3: Mock Image (Simulation)
    if (participant.mockImage && !participant.isVideoOff) {
        return (
            <img 
                src={participant.mockImage} 
                alt={participant.name} 
                className="w-full h-full object-cover opacity-90" 
            />
        );
    }

    // CASE 4: Default Avatar (Camera Off or No Signal)
    return (
        <div className="w-full h-full flex items-center justify-center bg-white/30 backdrop-blur-xl">
            <div className={`flex items-center justify-center bg-white/40 backdrop-blur-md rounded-full shadow-inner ${isFeatured ? 'w-32 h-32' : 'w-12 h-12'}`}>
                <UserIcon size={isFeatured ? 64 : 24} className="text-gray-500" />
            </div>
            {/* Status Text for large view */}
            {isFeatured && participant.isVideoOff && (
                <div className="absolute bottom-1/4 text-gray-500 font-medium">Camera is off</div>
            )}
        </div>
    );
  };

  return (
    <div className={`
      relative w-full h-full bg-white/20 backdrop-blur-lg border overflow-hidden shadow-xl transition-all duration-300 group
      ${isScreenSharing 
        ? 'ring-4 ring-brand-500 border-brand-400 shadow-brand-500/30 bg-gray-900/10' 
        : 'ring-1 ring-white/20 border-white/40'
      }
      ${isFeatured ? 'rounded-3xl' : 'rounded-2xl'}
    `}>
      
      {renderContent()}
      
      {/* Poor Connection Warning Overlay */}
      {connectionQuality === 'poor' && !participant.isVideoOff && !isScreenSharing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 animate-in fade-in duration-500">
           <div className="bg-red-500/80 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg">
             <WifiOff size={14} />
             <span>Low Bandwidth</span>
           </div>
        </div>
      )}

      {/* Screen Share Indicator Badge */}
      {isScreenSharing && (
        <div className="absolute top-4 right-4 bg-brand-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse-slow z-10">
            <MonitorUp size={12} />
            <span>Sharing Screen</span>
        </div>
      )}

      {/* Info Overlay */}
      <div className={`absolute flex items-center space-x-2 px-3 py-1.5 rounded-lg backdrop-blur-md bg-white/40 border border-white/20 text-gray-800 shadow-sm transition-opacity duration-300 ${
          isFeatured ? 'top-4 left-4' : 'bottom-2 left-2'
      }`}>
        <div className="flex items-center justify-center">
            {participant.isMuted ? <MicOff size={14} className="text-red-500" /> : <Mic size={14} className="text-brand-600" />}
        </div>
        <span className="text-sm font-medium truncate max-w-[120px]">
          {participant.name} {participant.isLocal && '(You)'}
        </span>
        
        {/* Signal Strength Indicator */}
        <div className="pl-2 border-l border-gray-300/50 ml-1 flex items-center gap-1" title={`Connection: ${connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}`}>
           {connectionQuality === 'good' && (
             <>
               <Signal size={14} className="text-green-600" />
               {isFeatured && <span className="text-[10px] font-semibold text-green-700">Good</span>}
             </>
           )}
           {connectionQuality === 'fair' && (
             <>
               <Wifi size={14} className="text-yellow-600" />
               {isFeatured && <span className="text-[10px] font-semibold text-yellow-700">Fair</span>}
             </>
           )}
           {connectionQuality === 'poor' && (
             <>
               <WifiOff size={14} className="text-red-500" />
               {isFeatured && <span className="text-[10px] font-semibold text-red-600">Poor</span>}
             </>
           )}
        </div>
      </div>
      
      {/* Border Highlight for Speaking (Pulse) */}
      {!participant.isMuted && !participant.isLocal && !isScreenSharing && (
        <div className="absolute inset-0 border-2 border-brand-400/50 rounded-[inherit] pointer-events-none"></div>
      )}
    </div>
  );
};

export default VideoFeed;