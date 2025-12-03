import React, { useState, useEffect } from 'react';
import { Video, Keyboard, Plus, Lock, Copy, Check, ArrowRight, Loader2, Database } from 'lucide-react';
import { backendService } from '../services/backendService';
import { MeetingRoom } from '../types';

interface HomeProps {
  onJoinMeeting: (id: string, name: string) => void;
  userId: string;
}

const Home: React.FC<HomeProps> = ({ onJoinMeeting, userId }) => {
  // Tabs: 'join' or 'create'
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('create');
  
  // Create State
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{roomId: string, password: string} | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createName, setCreateName] = useState('');

  // Join State
  const [roomId, setRoomId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Copy Feedback
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Debug: Active Rooms List
  const [activeRooms, setActiveRooms] = useState<MeetingRoom[]>([]);

  useEffect(() => {
    // Refresh rooms list on mount to help user debug
    setActiveRooms(backendService.getAllRooms());
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
        // Call backend to create room (password auto-generated for security)
        const { roomId, passwordRaw } = await backendService.createMeeting(userId);
        setCreatedRoomInfo({ roomId, password: passwordRaw });
        // Refresh debug list
        setActiveRooms(backendService.getAllRooms());
    } catch (err) {
        console.error("Failed to create meeting", err);
    } finally {
        setCreateLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoomId = roomId.trim();
    const cleanPass = passcode.trim();
    const cleanName = joinName.trim();

    if (!cleanRoomId || !cleanPass || !cleanName) return;

    setJoinLoading(true);
    setJoinError('');

    try {
        const result = await backendService.joinMeeting(userId, cleanName, cleanRoomId, cleanPass);
        
        if (result.success) {
            onJoinMeeting(cleanRoomId, cleanName);
        } else {
            setJoinError(result.error || "Failed to join meeting.");
        }
    } catch (err) {
        console.error("Join error:", err);
        setJoinError("An unexpected error occurred. Please try again.");
    } finally {
        setJoinLoading(false);
    }
  };

  const enterCreatedRoom = async () => {
      if (!createdRoomInfo || !createName.trim()) return;
      // Auto-join the room we just created
      const result = await backendService.joinMeeting(userId, createName.trim(), createdRoomInfo.roomId, createdRoomInfo.password);
      if (result.success) {
          onJoinMeeting(createdRoomInfo.roomId, createName.trim());
      } else {
          alert("Error entering room: " + result.error);
      }
  };

  const copyToClipboard = (text: string, type: 'id' | 'pass') => {
      navigator.clipboard.writeText(text);
      if (type === 'id') {
          setCopiedId(true);
          setTimeout(() => setCopiedId(false), 2000);
      } else {
          setCopiedPass(true);
          setTimeout(() => setCopiedPass(false), 2000);
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-200/40 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-200/40 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full z-10 text-center bg-white/30 backdrop-blur-3xl p-1 rounded-3xl shadow-xl ring-1 ring-white/60 mb-6">
        
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-white/40 rounded-3xl mb-1">
            <button 
                onClick={() => { setActiveTab('create'); setCreatedRoomInfo(null); setJoinError(''); }}
                className={`py-3 rounded-2xl font-semibold transition-all ${activeTab === 'create' ? 'bg-white shadow-md text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Create
            </button>
            <button 
                 onClick={() => { setActiveTab('join'); setCreatedRoomInfo(null); }}
                 className={`py-3 rounded-2xl font-semibold transition-all ${activeTab === 'join' ? 'bg-white shadow-md text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Join
            </button>
        </div>

        <div className="p-7 space-y-6">
            <div className="flex justify-center">
                <div className="p-4 bg-white/60 rounded-2xl shadow-lg border border-white/60 backdrop-blur-md">
                    <Video size={48} className="text-brand-500" />
                </div>
            </div>
            
            <div>
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-2">
                    {activeTab === 'create' ? 'Start a Meeting' : 'Join a Meeting'}
                </h1>
                <p className="text-gray-600">
                    {activeTab === 'create' 
                        ? 'Secure, password-protected rooms.' 
                        : 'Enter credentials to connect.'}
                </p>
            </div>

            {/* CREATE FLOW */}
            {activeTab === 'create' && (
                !createdRoomInfo ? (
                    <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4 pt-2">
                        <button 
                            type="submit"
                            disabled={createLoading}
                            className="w-full flex items-center justify-center space-x-3 bg-brand-500 hover:bg-brand-600 text-white p-4 rounded-xl font-semibold transition-all shadow-lg shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                        >
                            {createLoading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                            <span>Generate Secure Room</span>
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="bg-white/50 border border-brand-200 rounded-xl p-4 text-left space-y-3">
                            <p className="text-sm text-brand-700 font-semibold text-center mb-2">Room Created Successfully!</p>
                            
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Room ID</label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800 font-mono text-lg">
                                        {createdRoomInfo.roomId}
                                    </code>
                                    <button onClick={() => copyToClipboard(createdRoomInfo.roomId, 'id')} className="p-2 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-500 transition-colors">
                                        {copiedId ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Password</label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-200 text-gray-800 font-mono text-lg">
                                        {createdRoomInfo.password}
                                    </code>
                                    <button onClick={() => copyToClipboard(createdRoomInfo.password, 'pass')} className="p-2 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-500 transition-colors">
                                        {copiedPass ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                            
                            <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                                ⚠️ Save these credentials. You will need them to re-join.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <input 
                                type="text"
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Your Name"
                                autoComplete="off"
                                className="w-full bg-white/40 border border-white/40 text-gray-800 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-400 focus:outline-none placeholder-gray-500"
                            />
                            <button 
                                onClick={enterCreatedRoom}
                                disabled={!createName.trim()}
                                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 hover:shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                            >
                                <span>Enter Room</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )
            )}

            {/* JOIN FLOW */}
            {activeTab === 'join' && (
                <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3 pt-2">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Keyboard size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            value={roomId}
                            onChange={(e) => { setRoomId(e.target.value); setJoinError(''); }}
                            placeholder="Meeting Room ID"
                            autoComplete="off"
                            className="w-full bg-white/40 border border-white/40 text-gray-800 pl-10 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-brand-400 focus:outline-none placeholder-gray-500 transition-all shadow-inner"
                        />
                    </div>
                    
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="password" 
                            value={passcode}
                            onChange={(e) => { setPasscode(e.target.value); setJoinError(''); }}
                            placeholder="Meeting Passcode"
                            autoComplete="new-password"
                            className="w-full bg-white/40 border border-white/40 text-gray-800 pl-10 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-brand-400 focus:outline-none placeholder-gray-500 transition-all shadow-inner"
                        />
                    </div>

                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                        </div>
                        <input 
                            type="text"
                            value={joinName}
                            onChange={(e) => { setJoinName(e.target.value); setJoinError(''); }}
                            placeholder="Display Name"
                            autoComplete="off"
                            className="w-full bg-white/40 border border-white/40 text-gray-800 pl-10 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-brand-400 focus:outline-none placeholder-gray-500 transition-all shadow-inner"
                        />
                    </div>

                    {joinError && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100 flex items-start gap-2">
                             <span>•</span> {joinError}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={joinLoading}
                        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl border border-transparent transition-all disabled:opacity-50 hover:shadow-lg shadow-brand-500/20 mt-1 flex justify-center items-center gap-2"
                    >
                        {joinLoading ? <Loader2 className="animate-spin" /> : <span>Join Meeting</span>}
                    </button>
                </form>
            )}
        </div>
        
        <div className="pb-6 text-xs text-gray-400">
           <p>Taskflow Meet Secure &copy; 2025</p>
        </div>
      </div>
      
      {/* DEBUG SECTION: LIST LOCAL ROOMS */}
      {activeRooms.length > 0 && (
          <div className="z-10 bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30 max-w-md w-full animate-in slide-in-from-bottom-5">
              <h3 className="text-xs font-bold text-gray-600 uppercase flex items-center gap-2 mb-2">
                  <Database size={12} /> Local Debug: Available Rooms
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-hide">
                  {activeRooms.map(room => (
                      <div key={room.roomId} className="bg-white/50 p-2 rounded flex justify-between items-center text-xs">
                          <span className="font-mono text-gray-800">{room.roomId}</span>
                          <span className="text-gray-500">{new Date(room.createdAt).toLocaleTimeString()}</span>
                      </div>
                  ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2 italic text-center">
                  * Only rooms created in this browser profile are visible here.
              </p>
          </div>
      )}
    </div>
  );
};

export default Home;