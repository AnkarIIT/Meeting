import React from 'react';
import { Channel, User, Message } from '../types';
import { MOCK_USERS } from '../constants';

interface SidebarProps {
  activeChannelId: string;
  onChannelSelect: (id: string) => void;
  currentUser: User;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  messages: Message[];
  channels: Channel[];
}

const StatusDot: React.FC<{ status: User['status'] }> = ({ status }) => {
  if (status === 'offline') return null;
  
  const baseClasses = "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-[#1C1C1E] rounded-full shadow-sm";
  
  switch (status) {
    case 'online': 
      return <div className={`${baseClasses} bg-green-500`} title="Online"></div>;
    case 'away': 
      return <div className={`${baseClasses} bg-yellow-400`} title="Away"></div>;
    case 'busy': 
      return <div className={`${baseClasses} bg-red-500`} title="Busy"></div>;
    default: 
      return null;
  }
};

const Sidebar: React.FC<SidebarProps> = ({ 
  activeChannelId, 
  onChannelSelect, 
  currentUser,
  isDarkMode,
  toggleDarkMode,
  messages,
  channels: allChannels
}) => {
  const publicChannels = allChannels.filter(c => c.type !== 'dm');
  const dms = allChannels.filter(c => c.type === 'dm');

  const getUserStatusForDM = (dmId: string): User['status'] => {
    const userId = dmId.split('-')[1];
    return MOCK_USERS[userId]?.status || 'offline';
  };

  const getLastMessageForDM = (dmId: string) => {
    const channelMessages = messages.filter(m => m.channelId === dmId);
    return channelMessages.length > 0 ? channelMessages[channelMessages.length - 1] : null;
  };

  return (
    <div className="w-72 glass-panel bg-white/40 dark:bg-black/40 rounded-3xl border border-white/20 dark:border-white/10 flex flex-col shadow-2xl overflow-hidden shrink-0">
      {/* App Header */}
      <div className="p-6 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Lumina</h1>
          <p className="text-[10px] uppercase tracking-widest font-black opacity-30 dark:text-white">Dev Environment</p>
        </div>
        <button 
          onClick={toggleDarkMode}
          className="p-2.5 rounded-2xl bg-white/50 dark:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-sm border border-white/20"
        >
          {isDarkMode ? (
            <svg className="w-5 h-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
          ) : (
            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Search Bar */}
        <div className="px-4 mb-4">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Jump to..." 
              className="w-full bg-white/30 dark:bg-white/5 border border-white/20 dark:border-white/5 rounded-2xl py-2 px-4 pl-10 text-xs text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Public Channels */}
        <div className="px-3 mb-6">
          <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Public Channels</span>
            <button className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <div className="space-y-0.5">
            {publicChannels.map(channel => (
              <div 
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={`px-4 py-2 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-200 group ${
                  activeChannelId === channel.id 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                    : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-400'
                }`}
              >
                <span className={`text-base font-bold transition-opacity ${activeChannelId === channel.id ? 'opacity-100' : 'opacity-40'}`}>#</span>
                <span className="flex-1 font-bold text-sm truncate tracking-tight">{channel.name}</span>
                {channel.unreadCount > 0 && activeChannelId !== channel.id && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500 text-white ring-2 ring-white/10">
                    {channel.unreadCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Separator / Divider */}
        <div className="relative py-2 overflow-hidden px-4 mb-2">
           <div className="w-full border-t border-gray-200 dark:border-white/5"></div>
        </div>

        {/* Direct Messages Section with distinct visual container */}
        <div className="px-3">
          <div className="bg-white/10 dark:bg-white/5 rounded-[2.5rem] p-2 border border-white/10 shadow-inner">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Direct Messages</span>
              <div className="p-1.5 bg-blue-500/10 rounded-lg">
                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
              </div>
            </div>
            <div className="space-y-1 mt-1">
              {dms.map(dm => {
                const status = getUserStatusForDM(dm.id);
                const lastMsg = getLastMessageForDM(dm.id);
                const isSelected = activeChannelId === dm.id;

                return (
                  <div 
                    key={dm.id}
                    onClick={() => onChannelSelect(dm.id)}
                    className={`px-3 py-3 rounded-[2rem] flex items-center gap-3 cursor-pointer transition-all duration-300 group ${
                      isSelected 
                        ? 'bg-white dark:bg-[#1C1C1E] shadow-xl shadow-black/10 scale-[1.02] border border-white/40 dark:border-white/5' 
                        : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img src={dm.icon} className={`w-10 h-10 rounded-2xl object-cover shadow-sm border transition-all ${isSelected ? 'border-blue-500' : 'border-black/5 dark:border-white/10'}`} alt="" />
                      <StatusDot status={status} />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-black truncate text-[13px] tracking-tight ${isSelected ? 'text-blue-500' : 'dark:text-white'}`}>
                          {dm.name}
                        </span>
                      </div>
                      {lastMsg ? (
                        <p className={`text-[11px] truncate leading-tight font-medium ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>
                          {lastMsg.userId === 'me' ? 'You: ' : ''}{lastMsg.text}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500/40 italic font-medium">No messages yet</p>
                      )}
                    </div>
                    {!isSelected && dm.unreadCount > 0 && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* User Status Footer */}
      <div className="p-4 bg-white/10 dark:bg-black/20 border-t border-white/10">
        <div className="p-3 bg-white/40 dark:bg-white/5 rounded-2xl flex items-center gap-3 border border-white/20 shadow-sm">
          <div className="relative shrink-0">
            <img src={currentUser.avatar} className="w-10 h-10 rounded-xl shadow-inner border border-white/40" alt="" />
            <StatusDot status={currentUser.status} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black truncate dark:text-white tracking-tight">{currentUser.name}</div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Active Now</div>
            </div>
          </div>
          <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;