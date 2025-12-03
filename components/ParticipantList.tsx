import React from 'react';
import { X, Mic, MicOff, Video, VideoOff, UserMinus, Shield } from 'lucide-react';
import { Participant } from '../types';

interface ParticipantListProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onRemoveParticipant?: (id: string) => void;
  onToggleMuteParticipant?: (id: string) => void;
  onToggleVideoParticipant?: (id: string) => void;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ 
  isOpen, 
  onClose, 
  participants,
  onRemoveParticipant,
  onToggleMuteParticipant,
  onToggleVideoParticipant
}) => {
  if (!isOpen) return null;

  // Identify if local user is host
  const localParticipant = participants.find(p => p.isLocal);
  const isLocalHost = localParticipant?.role === 'host';

  // Sort: Host first, then others
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.role === 'host' && b.role !== 'host') return -1;
    if (a.role !== 'host' && b.role === 'host') return 1;
    return 0; 
  });

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white/60 backdrop-blur-2xl border-l border-white/30 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ring-1 ring-white/20">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/30 backdrop-blur-sm">
        <h2 className="font-semibold text-lg text-gray-800">Participants ({participants.length})</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/40 text-gray-500 hover:text-gray-800 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {sortedParticipants.map((p) => {
            // Can control if: I am host, target is not me.
            const canControl = isLocalHost && !p.isLocal;

            return (
              <div key={p.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-white/20 hover:border-white/40 shadow-sm backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${
                        p.isLocal ? 'bg-gradient-to-br from-brand-400 to-brand-600' : 'bg-gray-400'
                    }`}>
                        {p.mockImage ? (
                            <img src={p.mockImage} alt={p.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            p.name.charAt(0).toUpperCase()
                        )}
                        {p.role === 'host' && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 p-0.5 rounded-full border border-white" title="Host">
                                <Shield size={10} fill="currentColor" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">
                            {p.name} {p.isLocal && '(You)'}
                        </span>
                        <span className="text-xs text-gray-500">
                            {p.role === 'host' ? 'Host' : 'Participant'}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    {/* Audio Status / Control */}
                    {canControl ? (
                        <button 
                            onClick={() => onToggleMuteParticipant?.(p.id)}
                            title={p.isMuted ? "Force Unmute (Request)" : "Mute Participant"}
                            className={`p-1.5 rounded-full transition-colors ${
                                p.isMuted 
                                ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                                : 'bg-white/50 text-gray-600 hover:text-brand-600 hover:bg-brand-100'
                            }`}
                        >
                            {p.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        </button>
                    ) : (
                        <div 
                            title={p.isMuted ? "Muted" : "Unmuted"}
                            className={`p-1.5 rounded-full ${
                                p.isMuted 
                                ? 'bg-red-100 text-red-500' 
                                : 'bg-white/50 text-gray-600'
                            }`}
                        >
                            {p.isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                        </div>
                    )}

                    {/* Video Status / Control */}
                    {canControl ? (
                        <button 
                            onClick={() => onToggleVideoParticipant?.(p.id)}
                            title={p.isVideoOff ? "Request Video On" : "Disable Video"}
                            className={`p-1.5 rounded-full transition-colors ${
                                p.isVideoOff 
                                ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                                : 'bg-white/50 text-gray-600 hover:text-brand-600 hover:bg-brand-100'
                            }`}
                        >
                            {p.isVideoOff ? <VideoOff size={14} /> : <Video size={14} />}
                        </button>
                    ) : (
                        <div 
                            title={p.isVideoOff ? "Camera Off" : "Camera On"}
                            className={`p-1.5 rounded-full ${
                                p.isVideoOff 
                                ? 'bg-red-100 text-red-500' 
                                : 'bg-white/50 text-gray-600'
                            }`}
                        >
                            {p.isVideoOff ? <VideoOff size={14} /> : <Video size={14} />}
                        </div>
                    )}

                    {/* Remove Action (Host Only) */}
                    {canControl && (
                        <button 
                            onClick={() => onRemoveParticipant?.(p.id)}
                            title="Remove from meeting"
                            className="p-1.5 rounded-full bg-white/50 text-gray-400 hover:bg-red-500 hover:text-white transition-colors ml-1"
                        >
                            <UserMinus size={14} />
                        </button>
                    )}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default ParticipantList;