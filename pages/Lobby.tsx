import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, X, BarChart2 } from 'lucide-react';
import { useMediaStream } from '../hooks/useMediaStream';

interface LobbyProps {
  meetingId: string;
  userName: string;
  setUserName: (name: string) => void;
  onJoin: () => void;
  onBack: () => void;
  media: ReturnType<typeof useMediaStream>;
}

const Lobby: React.FC<LobbyProps> = ({ 
  meetingId, 
  userName, 
  setUserName, 
  onJoin, 
  onBack, 
  media 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const { stream, isMuted, isVideoOff, toggleAudio, toggleVideo, initStream } = media;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Join Preferences
  const [joinMuted, setJoinMuted] = useState(false);
  const [joinVideoOff, setJoinVideoOff] = useState(false);

  useEffect(() => {
    initStream();
  }, [initStream]);

  // Re-attach stream when stream changes OR when video is toggled back on (remounted)
  useEffect(() => {
    const attachStream = (ref: React.RefObject<HTMLVideoElement>) => {
      if (ref.current && stream) {
        ref.current.srcObject = stream;
      }
    };

    attachStream(videoRef);
    if (isSettingsOpen) {
      attachStream(modalVideoRef);
    }
  }, [stream, isVideoOff, isSettingsOpen]);

  const handleJoinMeeting = () => {
    // Enforce preferences: if user wants to join muted/off but currently isn't, toggle it.
    // Note: toggle functions update state in parent, which might be async, 
    // but the track disabling is synchronous in the hook.
    if (joinMuted && !isMuted) {
        toggleAudio();
    }
    if (joinVideoOff && !isVideoOff) {
        toggleVideo();
    }
    onJoin();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-gray-800 relative">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Main Preview Container */}
        <div className="flex flex-col space-y-6">
          <div className="relative aspect-video bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/50 group ring-4 ring-white/20">
             {stream && !isVideoOff ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform scale-x-[-1]" 
                />
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/40 text-gray-400">
                    <span className="text-lg font-medium">Camera is off</span>
                </div>
             )}
             
             {/* Settings Icon Toggle (Top Right) */}
             <button 
                onClick={() => setIsSettingsOpen(true)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/20 hover:bg-black/30 backdrop-blur-md text-white border border-white/10 transition-all z-20 shadow-sm"
                title="Audio & Video Settings"
             >
                <Settings size={20} />
             </button>

             {/* Preview Overlay Controls (Bottom Center) */}
             <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
                <button 
                  onClick={toggleAudio}
                  className={`p-4 rounded-full transition-all duration-200 border ${
                    !isMuted 
                      ? 'bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-white/20 shadow-lg' 
                      : 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                  }`}
                >
                  {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
                <button 
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all duration-200 border ${
                    !isVideoOff 
                      ? 'bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border-white/20 shadow-lg' 
                      : 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                  }`}
                >
                  {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
                </button>
             </div>
          </div>
          
          {/* Info text */}
          <div className="text-center">
             <p className="text-sm text-gray-500 bg-white/40 inline-block px-4 py-1.5 rounded-full border border-white/30">
               Check your hair and audio before joining
             </p>
          </div>
        </div>

        {/* Join Controls */}
        <div className="flex flex-col space-y-8">
           <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900">Ready to join?</h2>
              <p className="text-gray-500 text-lg">You are entering room <span className="text-brand-600 font-mono font-medium bg-brand-50 px-2 py-0.5 rounded border border-brand-100">{meetingId}</span></p>
           </div>

           <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600 ml-1">Display Name</label>
                <input 
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-white/40 border border-white/50 text-gray-900 text-lg px-5 py-4 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent focus:outline-none transition-all placeholder-gray-400 shadow-sm hover:bg-white/50"
                />
              </div>

              <div className="flex flex-col gap-3">
                 <button 
                    onClick={handleJoinMeeting}
                    disabled={!userName.trim()}
                    className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg py-4 px-6 rounded-xl shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                 >
                   Join Meeting
                 </button>
                 <button 
                    onClick={onBack}
                    className="w-full py-3 text-gray-500 hover:text-gray-800 font-medium hover:bg-white/30 rounded-xl transition-colors"
                 >
                   Cancel
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/80 backdrop-blur-2xl w-full max-w-2xl rounded-3xl shadow-2xl border border-white/60 flex flex-col overflow-hidden max-h-[90vh]">
            
            <div className="p-6 border-b border-gray-200/50 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Settings className="text-brand-500" />
                Device Settings
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto">
              
              {/* Video Test Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Camera Preview</label>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${!isVideoOff ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isVideoOff ? 'Off' : 'Active'}
                  </span>
                </div>
                <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative group">
                  {stream && !isVideoOff ? (
                    <video 
                      ref={modalVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform scale-x-[-1]" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                       <VideoOff size={48} className="mb-2 opacity-50" />
                       <span>Camera is turned off</span>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4">
                     <button 
                      onClick={toggleVideo}
                      className={`px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-all ${
                        !isVideoOff ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-brand-500 text-white hover:bg-brand-600'
                      }`}
                     >
                       {isVideoOff ? 'Turn On' : 'Turn Off'}
                     </button>
                  </div>
                </div>
              </div>

              {/* Audio Test Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Microphone Test</label>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${!isMuted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isMuted ? 'Muted' : 'Active'}
                  </span>
                </div>
                
                <div className="bg-white/50 p-4 rounded-2xl border border-white/60 space-y-4">
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={toggleAudio}
                        className={`p-3 rounded-full border ${
                          isMuted 
                            ? 'bg-red-100 text-red-500 border-red-200' 
                            : 'bg-brand-100 text-brand-600 border-brand-200'
                        }`}
                      >
                         {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <div className="flex-1">
                          <div className="text-sm text-gray-600 mb-2 font-medium">Input Level</div>
                          {/* Audio Visualizer */}
                          <AudioLevelIndicator stream={stream} isMuted={isMuted} />
                      </div>
                   </div>
                   <p className="text-xs text-gray-500 pl-1">
                     Speak into your microphone to test the input level.
                   </p>
                </div>
              </div>

               {/* Join Preferences */}
               <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Join Preferences</label>
                  <div className="bg-white/50 p-4 rounded-2xl border border-white/60 space-y-3">
                      <ToggleSwitch 
                        label="Join with microphone muted" 
                        checked={joinMuted} 
                        onChange={() => setJoinMuted(!joinMuted)} 
                      />
                      <ToggleSwitch 
                        label="Join with camera turned off" 
                        checked={joinVideoOff} 
                        onChange={() => setJoinVideoOff(!joinVideoOff)} 
                      />
                  </div>
               </div>

            </div>
            
            <div className="p-6 bg-gray-50/50 border-t border-gray-200/50 flex justify-end">
               <button 
                 onClick={() => setIsSettingsOpen(false)}
                 className="bg-brand-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
               >
                 Done
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// Toggle Switch Component
const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between cursor-pointer" onClick={onChange}>
        <span className="text-gray-700 font-medium">{label}</span>
        <div className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-brand-500' : 'bg-gray-300'}`}>
            <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    </div>
);

// Internal Component for visualizing audio level
const AudioLevelIndicator: React.FC<{ stream: MediaStream | null; isMuted: boolean }> = ({ stream, isMuted }) => {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream || isMuted) {
      setVolume(0);
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        // Calculate average volume
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        // Normalize roughly to 0-100
        setVolume(Math.min(100, (avg / 128) * 100));
        rafRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.error("Audio visualization error:", e);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream, isMuted]);

  return (
    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
      <div 
        className="h-full bg-brand-500 transition-all duration-75 ease-out"
        style={{ width: `${volume}%` }}
      />
    </div>
  );
};

export default Lobby;