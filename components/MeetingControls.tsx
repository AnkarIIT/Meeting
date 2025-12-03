import React from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MonitorUp, MessageSquare, Users 
} from 'lucide-react';

interface MeetingControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  showChat: boolean;
  showParticipants: boolean;
  unreadMessages: number;
  meetingId: string;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onLeave: () => void;
}

const MeetingControls: React.FC<MeetingControlsProps> = ({
  isMuted,
  isVideoOff,
  isScreenSharing,
  showChat,
  showParticipants,
  unreadMessages,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onLeave,
}) => {
  return (
    <div className="flex justify-center w-full pointer-events-none">
      <div className="flex items-center gap-3 px-6 py-3 bg-white/40 backdrop-blur-xl border border-white/40 rounded-full shadow-2xl pointer-events-auto transition-all hover:bg-white/50 ring-1 ring-white/30">
        
        {/* Mic Toggle */}
        <ControlBtn 
          isOn={!isMuted} 
          onIcon={<Mic size={20} />} 
          offIcon={<MicOff size={20} />} 
          onClick={onToggleMute} 
          label={isMuted ? "Unmute" : "Mute"}
        />

        {/* Video Toggle */}
        <ControlBtn 
          isOn={!isVideoOff} 
          onIcon={<Video size={20} />} 
          offIcon={<VideoOff size={20} />} 
          onClick={onToggleVideo} 
          label={isVideoOff ? "Start Video" : "Stop Video"}
        />

        {/* Screen Share */}
        <ControlBtn 
          isOn={isScreenSharing} 
          onIcon={<MonitorUp size={20} />} 
          offIcon={<MonitorUp size={20} />} 
          onClick={onToggleScreenShare} 
          label="Share Screen"
          activeColor="bg-brand-100 text-brand-700 hover:bg-brand-200"
          inactiveColor="bg-white/50 text-gray-600 hover:bg-gray-100 border-white/40 hover:text-gray-900"
        />

        <div className="w-px h-8 bg-white/30 mx-1"></div>

        {/* End Call */}
        <button 
          onClick={onLeave}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3.5 flex items-center justify-center transition-all shadow-lg hover:scale-105 hover:shadow-red-500/30"
          title="Leave Meeting"
        >
          <PhoneOff size={20} fill="currentColor" />
        </button>

        <div className="w-px h-8 bg-white/30 mx-1"></div>

        {/* Secondary Controls (Chat/Users) */}
        <div className="flex items-center gap-2">
            <SecondaryBtn 
                isActive={showChat}
                onClick={onToggleChat}
                icon={<MessageSquare size={18} />}
                badgeCount={unreadMessages}
                label="Chat"
            />
            <SecondaryBtn 
                isActive={showParticipants}
                onClick={onToggleParticipants}
                icon={<Users size={18} />}
                label="Participants"
            />
        </div>
      </div>
    </div>
  );
};

interface ControlBtnProps {
  isOn: boolean;
  onIcon: React.ReactNode;
  offIcon: React.ReactNode;
  onClick: () => void;
  label: string;
  activeColor?: string;
  inactiveColor?: string;
}

const ControlBtn: React.FC<ControlBtnProps> = ({ isOn, onIcon, offIcon, onClick, label, activeColor, inactiveColor }) => {
  return (
    <button
      onClick={onClick}
      className={`p-3.5 rounded-full transition-all duration-200 border border-transparent ${
        isOn 
          ? (activeColor || 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20') 
          : (inactiveColor || 'bg-white/50 text-red-500 hover:bg-red-50 border-red-100')
      }`}
      title={label}
    >
      {isOn ? onIcon : offIcon}
    </button>
  );
};

const SecondaryBtn: React.FC<{ isActive: boolean, onClick: () => void, icon: React.ReactNode, badgeCount?: number, label: string }> = ({ 
    isActive, onClick, icon, badgeCount, label 
}) => (
    <button 
        onClick={onClick}
        className={`relative p-3.5 rounded-full transition-all duration-200 border border-transparent ${
            isActive 
            ? 'bg-brand-100 text-brand-700 border-brand-200' 
            : 'bg-transparent hover:bg-white/40 text-gray-600 hover:text-gray-900'
        }`}
        title={label}
    >
        {icon}
        {badgeCount ? (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
        ) : null}
    </button>
);

export default MeetingControls;