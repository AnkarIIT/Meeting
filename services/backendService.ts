import { MeetingRoom, MeetingParticipant } from '../types';

/**
 * MOCK BACKEND SERVICE
 * 
 * In a real application, this would be a Node.js/Express server connecting to PostgreSQL.
 * Here, we simulate the database using LocalStorage to persist data across page reloads.
 * We also verify storage events to sync across tabs.
 */

const DB_KEYS = {
  ROOMS: 'tf_meet_rooms',
  PARTICIPANTS: 'tf_meet_participants',
};

// Helper: Safe UUID Generation (Works in secure and insecure contexts)
export function getUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for insecure contexts (e.g. 192.168.x.x)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper: Consistent Hashing
// We use a simple DJB2 implementation to ensure that hashing is consistent 
// across Secure (localhost) and Insecure (IP) contexts. 
// Using crypto.subtle in one and fallback in another would break password validation.
async function safeHash(plainText: string): Promise<string> {
  if (!plainText) return '';
  
  let hash = 5381;
  for (let i = 0; i < plainText.length; i++) {
      const char = plainText.charCodeAt(i);
      hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
  }
  return 'hash-' + (hash >>> 0).toString(16);
}

// Helper: Get DB State
function getRooms(): Record<string, MeetingRoom> {
  try {
    const data = localStorage.getItem(DB_KEYS.ROOMS);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function getParticipants(): MeetingParticipant[] {
  try {
    const data = localStorage.getItem(DB_KEYS.PARTICIPANTS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Helper: Save DB State
function saveRooms(rooms: Record<string, MeetingRoom>) {
  localStorage.setItem(DB_KEYS.ROOMS, JSON.stringify(rooms));
  // Dispatch event for same-tab updates if needed, though 'storage' event covers cross-tab
}

function saveParticipants(participants: MeetingParticipant[]) {
  localStorage.setItem(DB_KEYS.PARTICIPANTS, JSON.stringify(participants));
}

export const backendService = {
  
  /**
   * CREATE MEETING
   * Generates a room with a hashed password.
   */
  async createMeeting(hostUserId: string, password?: string): Promise<{ roomId: string, passwordRaw: string }> {
    const roomId = Math.random().toString(36).substring(2, 7) + '-' + Math.random().toString(36).substring(2, 7);
    // If no password provided, generate a random one
    const passwordRaw = password || Math.random().toString(36).substring(2, 8);
    
    const passwordHash = await safeHash(passwordRaw);

    const newRoom: MeetingRoom = {
      roomId,
      passwordHash,
      hostUserId,
      isActive: true,
      createdAt: Date.now(),
    };

    const rooms = getRooms();
    rooms[roomId] = newRoom;
    saveRooms(rooms);

    return { roomId, passwordRaw };
  },

  /**
   * JOIN MEETING
   * Validates Room ID and Password, then records entry.
   */
  async joinMeeting(userId: string, userName: string, roomId: string, passwordPlain: string): Promise<{ success: boolean, error?: string, role?: 'host' | 'guest' }> {
    const rooms = getRooms();
    const cleanRoomId = roomId.trim();
    const cleanPassword = passwordPlain.trim();
    const cleanUserName = userName.trim();
    
    const room = rooms[cleanRoomId];

    // 1. Validate Room Exists
    if (!room) {
      return { success: false, error: "Room not found. Check the Room ID." };
    }

    // 2. Validate Room Active
    if (!room.isActive) {
      return { success: false, error: "This meeting has ended." };
    }

    // 3. Validate Password
    const inputHash = await safeHash(cleanPassword);
    
    if (inputHash !== room.passwordHash) {
      return { success: false, error: "Incorrect password." };
    }

    // 4. Determine Role
    const role = room.hostUserId === userId ? 'host' : 'guest';

    // 5. Record Participant Entry (DB Insert)
    const participants = getParticipants();
    
    // Check if already joined (active) to allow re-entry
    // We filter out any previous sessions for this user in this room to "update" them
    const others = participants.filter(p => !(p.userId === userId && p.roomId === cleanRoomId));
    
    const newParticipant: MeetingParticipant = {
        id: getUUID(),
        roomId: cleanRoomId,
        userId,
        userName: cleanUserName,
        role,
        joinedAt: Date.now(),
        isMuted: false,       // Default state
        isVideoOff: false,    // Default state
        isScreenSharing: false // Default state
    };
    
    others.push(newParticipant);
    saveParticipants(others);

    return { success: true, role };
  },

  /**
   * UPDATE PARTICIPANT STATE (Signaling)
   * Broadcasts media state changes (mute/video/screen) to other peers via DB.
   * Optimized to avoid unnecessary writes.
   */
  async updateParticipantState(userId: string, roomId: string, updates: Partial<Pick<MeetingParticipant, 'isMuted' | 'isVideoOff' | 'isScreenSharing'>>) {
    const participants = getParticipants();
    const index = participants.findIndex(p => p.userId === userId && p.roomId === roomId && !p.leftAt);
    
    if (index !== -1) {
      // Check if values actually changed to reduce latency/writes
      const current = participants[index];
      const hasChanges = Object.entries(updates).some(([key, val]) => current[key as keyof MeetingParticipant] !== val);
      
      if (hasChanges) {
          participants[index] = { ...current, ...updates };
          saveParticipants(participants);
      }
    }
  },

  /**
   * LEAVE MEETING
   * Updates the participant record with left_at timestamp.
   */
  async leaveMeeting(userId: string, roomId: string): Promise<void> {
    const participants = getParticipants();
    const index = participants.findIndex(p => p.userId === userId && p.roomId === roomId && !p.leftAt);
    
    if (index !== -1) {
      participants[index].leftAt = Date.now();
      saveParticipants(participants);
    }
  },

  /**
   * GET ROOM DETAILS (Optional - for UI)
   */
  async getRoomDetails(roomId: string): Promise<MeetingRoom | null> {
      const rooms = getRooms();
      return rooms[roomId] || null;
  },

  /**
   * GET ALL ROOMS (Debug/Dev Only)
   * Useful to see what rooms exist in the current browser storage
   */
  getAllRooms(): MeetingRoom[] {
      const rooms = getRooms();
      return Object.values(rooms).filter(r => r.isActive).sort((a,b) => b.createdAt - a.createdAt);
  },

  /**
   * VALIDATE SESSION
   * Checks if a user is legally inside a room (useful for page reloads)
   */
  isUserActiveInRoom(userId: string, roomId: string): boolean {
      const participants = getParticipants();
      return participants.some(p => p.userId === userId && p.roomId === roomId && !p.leftAt);
  },

  /**
   * GET PARTICIPANTS FOR ROOM
   * Returns list of active participants
   */
  getParticipantsForRoom(roomId: string): MeetingParticipant[] {
      const participants = getParticipants();
      return participants.filter(p => p.roomId === roomId && !p.leftAt);
  },

  /**
   * SUBSCRIBE TO DB UPDATES
   * Listens for changes in localStorage (cross-tab sync)
   */
  subscribeToUpdates(callback: () => void): () => void {
      const handler = (event: StorageEvent) => {
          if (event.key === DB_KEYS.PARTICIPANTS || event.key === DB_KEYS.ROOMS) {
              callback();
          }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
  }
};