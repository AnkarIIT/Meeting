import React, { useState, useEffect } from 'react';
import { MeetingState } from './types';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import EndMeeting from './pages/EndMeeting';
import { useMediaStream } from './hooks/useMediaStream';

const App: React.FC = () => {
  const [meetingState, setMeetingState] = useState<MeetingState>(MeetingState.HOME);
  const [meetingId, setMeetingId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  
  // Persistent User ID for Backend Logic (Simulating Auth)
  // Changed to sessionStorage so new tabs act as new users
  const [userId] = useState(() => {
      const stored = sessionStorage.getItem('tf_meet_userid');
      if (stored) return stored;
      
      // Safe fallback for insecure contexts where crypto.randomUUID might be undefined
      let newId;
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        newId = crypto.randomUUID();
      } else {
        newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      }
      
      sessionStorage.setItem('tf_meet_userid', newId);
      return newId;
  });
  
  // Lifted state for media to persist across Lobby -> Room transition
  const media = useMediaStream();

  const handleJoinInit = (id: string, name: string) => {
    setMeetingId(id);
    setUserName(name);
    setMeetingState(MeetingState.LOBBY);
  };

  const handleEnterRoom = () => {
    setMeetingState(MeetingState.JOINED);
  };

  const handleLeave = () => {
    media.stopStream();
    setMeetingState(MeetingState.RATING); // Redirect to Rating screen instead of Home
    setMeetingId('');
  };

  const handleRateFinished = () => {
    setMeetingState(MeetingState.HOME);
  };

  const handleBackToHome = () => {
    media.stopStream();
    setMeetingState(MeetingState.HOME);
  };

  return (
    <div className="font-sans antialiased text-white h-screen w-screen overflow-hidden">
      {meetingState === MeetingState.HOME && (
        <Home 
          onJoinMeeting={handleJoinInit} 
          userId={userId}
        />
      )}
      
      {meetingState === MeetingState.LOBBY && (
        <Lobby 
          meetingId={meetingId}
          userName={userName}
          setUserName={setUserName}
          onJoin={handleEnterRoom}
          onBack={handleBackToHome}
          media={media}
        />
      )}

      {meetingState === MeetingState.JOINED && (
        <Room 
          meetingId={meetingId}
          userName={userName}
          userId={userId}
          media={media}
          onLeave={handleLeave}
        />
      )}

      {meetingState === MeetingState.RATING && (
        <EndMeeting onHome={handleRateFinished} />
      )}
    </div>
  );
};

export default App;