export interface User {
  id: string;
  name: string;
  avatar?: string;
}

export interface Participant {
  id: string;
  name: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isLocal: boolean;
  stream?: MediaStream | null;
  role: 'host' | 'guest';
  connectionQuality?: 'good' | 'fair' | 'poor';
  // For simulation purposes
  mockImage?: string; 
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isAi?: boolean;
}

export enum MeetingState {
  HOME = 'HOME',
  LOBBY = 'LOBBY',
  JOINED = 'JOINED',
  RATING = 'RATING',
  ENDED = 'ENDED'
}

export interface AiResponse {
  text: string;
}

// --- Backend / DB Types ---

export interface MeetingRoom {
  roomId: string;
  passwordHash: string;
  hostUserId: string;
  isActive: boolean;
  createdAt: number;
}

export interface MeetingParticipant {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  role: 'host' | 'guest';
  joinedAt: number;
  leftAt?: number;
  // Signaling State
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}