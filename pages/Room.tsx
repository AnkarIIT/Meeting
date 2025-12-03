import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMediaStream } from '../hooks/useMediaStream';
import MeetingControls from '../components/MeetingControls';
import VideoFeed from '../components/VideoFeed';
import ChatPanel from '../components/ChatPanel';
import ParticipantList from '../components/ParticipantList';
import { Participant, ChatMessage } from '../types';
import { Copy, Check } from 'lucide-react';
import { backendService } from '../services/backendService';

interface RoomProps {
  meetingId: string;
  userName: string;
  userId: string;
  media: ReturnType<typeof useMediaStream>;
  onLeave: () => void;
}

const Room: React.FC<RoomProps> = ({ meetingId, userName, userId, media, onLeave }) => {
  const { stream, isMuted, isVideoOff, connectionQuality, toggleAudio, toggleVideo } = media;
  
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  
  const screenStreamRef = useRef<MediaStream | null>(null);

  // 1. Initialize Local Participant
  useEffect(() => {
    // Security Check
    if (!backendService.isUserActiveInRoom(userId, meetingId)) {
        alert("Session invalid or expired. Please re-join.");
        onLeave();
        return;
    }

    setLocalParticipant({
        id: userId,
        name: userName,
        isMuted: isMuted,
        isVideoOff: isVideoOff,
        isScreenSharing: false,
        isLocal: true,
        stream: stream,
        role: 'host',
        connectionQuality: connectionQuality,
    });
  }, [userId, meetingId, userName, stream, onLeave]);

  // 2. Fetch Remote Participants (Live Sync via Signaling)
  const syncParticipants = useCallback(() => {
      const dbParticipants = backendService.getParticipantsForRoom(meetingId);
      
      const others = dbParticipants
        .filter(p => p.userId !== userId) // Exclude self
        .map(p => ({
            id: p.userId,
            name: p.userName,
            isMuted: p.isMuted,            // Sync Real-time State (Signaling)
            isVideoOff: p.isVideoOff,      // Sync Real-time State (Signaling)
            isScreenSharing: p.isScreenSharing, // Sync Real-time State (Signaling)
            isLocal: false,
            stream: null, // Remote streams are simulated in this environment
            role: p.role,
            connectionQuality: 'good'
        } as Participant));

      setRemoteParticipants(others);
  }, [meetingId, userId]);

  useEffect(() => {
      // Initial fetch
      syncParticipants();
      
      // Subscribe to backend/storage events for real-time signaling
      const unsubscribe = backendService.subscribeToUpdates(syncParticipants);
      return unsubscribe;
  }, [syncParticipants]);


  // 3. Sync Local Media State AND Broadcast to Backend (Signaling)
  useEffect(() => {
    if (!localParticipant) return;

    let activeStream = stream;
    if (isScreenSharing && screenStreamRef.current) {
      activeStream = screenStreamRef.current;
    }
    
    // If screen sharing, we effectively "show video" (the screen), overriding the camera off state for the feed
    const shouldShowVideo = isScreenSharing ? false : isVideoOff;

    // Update Local State for UI
    setLocalParticipant(prev => prev ? {
        ...prev,
        isMuted,
        isVideoOff: shouldShowVideo,
        stream: activeStream,
        isScreenSharing,
        connectionQuality
    } : null);

    // Broadcast State to Peers via Backend (Signaling)
    // We send 'isVideoOff' as 'shouldShowVideo' so peers know if they should render a feed or avatar
    backendService.updateParticipantState(userId, meetingId, {
      isMuted,
      isVideoOff: shouldShowVideo,
      isScreenSharing
    });

  }, [isMuted, isVideoOff, stream, isScreenSharing, connectionQuality, userId, meetingId]);

  // Cleanup screen share on unmount
  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Handle Safe Leave with Confirmation
  const handleLeaveClick = () => {
    setIsLeaveModalOpen(true);
  };

  const confirmLeave = () => {
      setIsLeaveModalOpen(false);
      backendService.leaveMeeting(userId, meetingId).then(() => {
          onLeave();
      });
  };

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string, timestamp?: number }) => {
    const newMsg: ChatMessage = {
      id: msg.id || Date.now().toString(),
      timestamp: msg.timestamp || Date.now(),
      ...msg
    };
    setMessages(prev => [...prev, newMsg]);
    if (!isChatOpen && !msg.isSystem && !msg.isAi) {
      setUnreadMessages(prev => prev + 1);
    }
  };

  const handleSendMessage = (text: string) => {
      if (text.startsWith('[AI_RESPONSE]')) {
          const cleanText = text.replace('[AI_RESPONSE]', '');
          addMessage({
              senderId: 'ai-assistant',
              senderName: 'Taskflow AI',
              text: `[AI_RESPONSE]${cleanText}`,
              isAi: true
          });
          return;
      }
    addMessage({ senderId: userId, senderName: userName, text });
  };

  // Refactored Screen Share Logic
  const handleStopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
  }, []);

  const handleStartScreenShare = useCallback(async () => {
    try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        
        displayStream.getVideoTracks()[0].onended = () => {
            handleStopScreenShare();
        };

        screenStreamRef.current = displayStream;
        setIsScreenSharing(true);
    } catch (err: any) {
        if (err.name === 'NotAllowedError') return;
        console.error("Screen share error:", err);
        alert("Failed to share screen. Please check permissions.");
    }
  }, [handleStopScreenShare]);

  const toggleScreenShare = () => {
    if (isScreenSharing) {
        handleStopScreenShare();
    } else {
        handleStartScreenShare();
    }
  };

  const handleRemoveParticipant = (id: string) => {
      // In a real app, this sends a signal to the backend to force remove the user
      // For now, we simulate by removing from local view, though a sync might bring them back if logic isn't enforcing kick
      setRemoteParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleMutePeer = (id: string) => {
    // Optimistic UI update
    setRemoteParticipants(prev => prev.map(p => p.id === id ? { ...p, isMuted: !p.isMuted } : p));
  };

  const handleToggleVideoPeer = (id: string) => {
    // Optimistic UI update
    setRemoteParticipants(prev => prev.map(p => p.id === id ? { ...p, isVideoOff: !p.isVideoOff } : p));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Combined Participants State ---
  const participants = useMemo(() => {
    const list: Participant[] = [];
    if (localParticipant) {
      list.push(localParticipant);
    }
    return list.concat(remoteParticipants);
  }, [localParticipant, remoteParticipants]);

  // --- Layout Logic ---
  const featuredParticipant = useMemo(() => {
    // 1. Priority: Screen Sharer
    const sharer = participants.find(p => p.isScreenSharing);
    if (sharer) return sharer;

    // 2. Default: First participant (usually Host/Local)
    return participants[0];
  }, [participants]);

  const filmstripParticipants = useMemo(() => {
    return participants.filter(p => p.id !== featuredParticipant?.id);
  }, [participants, featuredParticipant]);
  
  const MAX_FILMSTRIP = 3;
  const visibleFilmstrip = filmstripParticipants.slice(0, MAX_FILMSTRIP);
  const overflowCount = filmstripParticipants.length - MAX_FILMSTRIP;

  return (
    <div className="flex h-screen bg-transparent overflow-hidden relative">
      
      {/* Sidebar Overlays (Z-Index High) */}
      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        messages={messages}
        onSendMessage={handleSendMessage}
        localUserName={userName}
      />
      <ParticipantList 
           isOpen={isParticipantsOpen}
           onClose={() => setIsParticipantsOpen(false)}
           participants={participants}
           onRemoveParticipant={handleRemoveParticipant}
           onToggleMuteParticipant={handleMutePeer}
           onToggleVideoParticipant={handleToggleVideoPeer}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col p-4 gap-4 transition-all duration-300 ${isChatOpen || isParticipantsOpen ? 'mr-96' : ''}`}>
        
        {/* Top Header (Minimal) */}
        <div className="absolute top-6 left-6 z-10 flex items-center space-x-3">
             <div className="bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2 shadow-sm ring-1 ring-white/10">
                 <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Room</span>
                 <span className="text-sm font-bold text-gray-800 font-mono">{meetingId}</span>
                 <button onClick={copyLink} className="ml-1 p-1 hover:bg-white/50 rounded-full text-gray-600 transition-colors">
                    {copied ? <Check size={14} className="text-brand-600" /> : <Copy size={14} />}
                 </button>
             </div>
        </div>

        {/* Featured Video (Spotlight) */}
        <div className="flex-1 w-full relative min-h-0">
           {participants.length > 0 && featuredParticipant ? (
               <VideoFeed 
                 key={featuredParticipant.id} 
                 participant={featuredParticipant} 
                 variant="featured" 
               />
           ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-500 bg-white/20 backdrop-blur-sm rounded-3xl border border-white/20 shadow-inner">
                   <div className="text-center">
                       <p className="text-lg font-medium">Waiting for others...</p>
                       <p className="text-sm opacity-70">Share the Room ID to invite others</p>
                   </div>
               </div>
           )}
        </div>

        {/* Bottom Filmstrip */}
        {visibleFilmstrip.length > 0 && (
          <div className="h-32 w-full flex justify-center gap-3">
              {visibleFilmstrip.map(p => (
                   <div key={p.id} className="w-48 h-full">
                       <VideoFeed participant={p} variant="list" />
                   </div>
              ))}
              
              {/* Overflow Card */}
              {overflowCount > 0 && (
                  <div className="w-32 h-full flex items-center justify-center bg-white/30 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg text-gray-700 font-bold text-lg ring-1 ring-white/20">
                      +{overflowCount}
                  </div>
              )}
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
             <MeetingControls 
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                isScreenSharing={isScreenSharing}
                showChat={isChatOpen}
                showParticipants={isParticipantsOpen}
                unreadMessages={unreadMessages}
                meetingId={meetingId}
                onToggleMute={toggleAudio}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={toggleScreenShare}
                onToggleChat={() => { setIsChatOpen(!isChatOpen); setIsParticipantsOpen(false); setUnreadMessages(0); }}
                onToggleParticipants={() => { setIsParticipantsOpen(!isParticipantsOpen); setIsChatOpen(false); }}
                onLeave={handleLeaveClick}
             />
        </div>
      </div>

      {/* Leave Confirmation Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white/80 backdrop-blur-2xl max-w-sm w-full rounded-2xl shadow-2xl border border-white/60 p-6 text-center transform transition-all scale-100">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Leave Meeting?</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to exit the call?</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsLeaveModalOpen(false)}
                        className="flex-1 py-3 text-gray-700 bg-white/50 hover:bg-white/80 border border-gray-200 rounded-xl font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmLeave}
                        className="flex-1 py-3 text-white bg-red-500 hover:bg-red-600 rounded-xl font-semibold shadow-lg shadow-red-500/20 transition-colors"
                    >
                        Leave
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Room;