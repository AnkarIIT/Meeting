import React, { useRef, useEffect, useState } from 'react';
import { Message, User } from '../types';
import { MOCK_USERS } from '../constants';
import MessageItem from './MessageItem';

interface ChatWindowProps {
  channelName: string;
  messages: Message[];
  onSendMessage: (text: string, file?: File) => void;
  onOpenThread: (messageId: string) => void;
  onDeleteMessage: (id: string) => void;
  onEditMessage?: (id: string, newText: string) => void;
  onToggleReaction?: (id: string, emoji: string) => void;
  isTyping?: boolean;
  isDM?: boolean;
  currentUserId: string;
  recipientStatus?: User['status'];
}

const DayDivider: React.FC<{ date: Date | string }> = ({ date }) => {
  const d = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  let label = d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  if (messageDate.getTime() === today.getTime()) label = 'Today';
  else if (messageDate.getTime() === yesterday.getTime()) label = 'Yesterday';

  return (
    <div className="flex items-center gap-4 my-8 px-4 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
      <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
      <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 bg-white dark:bg-[#1C1C1E] px-3 py-1 rounded-full border border-gray-100 dark:border-white/5 shadow-sm">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-white/10"></div>
    </div>
  );
};

const HeaderStatusDot: React.FC<{ status?: User['status'] }> = ({ status }) => {
  if (!status || status === 'offline') return null;
  
  const colors = {
    online: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    away: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]',
    busy: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  };

  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status]}`}></div>;
};

const MAIN_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '👀', '✨', '🔥', '💯', '🤔', '👋', '💻'];

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  channelName, 
  messages, 
  onSendMessage, 
  onOpenThread,
  onDeleteMessage,
  onEditMessage,
  onToggleReaction,
  isTyping,
  isDM,
  currentUserId,
  recipientStatus
}) => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(messages.length);

  const checkIfAtBottom = () => {
    if (!scrollRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    return scrollHeight - scrollTop - clientHeight < 50;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
      setHasNewMessages(false);
      setShowScrollButton(false);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const atBottom = checkIfAtBottom();
    setShowScrollButton(!atBottom);
    if (atBottom) setHasNewMessages(false);
  };

  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      if (checkIfAtBottom()) {
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        setHasNewMessages(true);
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (isTyping && checkIfAtBottom()) {
      setTimeout(() => scrollToBottom('smooth'), 50);
    }
  }, [isTyping]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() || attachedFile) {
      onSendMessage(inputValue, attachedFile || undefined);
      setInputValue('');
      setAttachedFile(null);
      setShowEmojiPicker(false);
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const addEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const filteredMessages = searchQuery.trim() 
    ? messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent min-w-0 relative">
      <div className="h-20 flex items-center px-8 justify-between shrink-0 border-b border-gray-200/30 dark:border-white/5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight dark:text-white">
              {isDM ? channelName : `#${channelName}`}
            </span>
            {isDM && <HeaderStatusDot status={recipientStatus} />}
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {isDM ? `${recipientStatus ? recipientStatus.charAt(0).toUpperCase() + recipientStatus.slice(1) : 'Offline'} • Private` : 'Standard Channel • 24 members'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group flex items-center">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-2xl py-2 px-4 pl-10 text-sm text-gray-900 dark:text-white outline-none transition-all w-48 lg:w-72"
            />
            <svg className="w-4 h-4 absolute left-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-400 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {!isDM && (
            <div className="flex -space-x-2 hidden sm:flex">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://picsum.photos/seed/${i + 20}/100`} className="w-8 h-8 rounded-xl border-2 border-white/50 dark:border-[#1C1C1E] shadow-sm" alt="" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-2 space-y-0.5 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20">
                <span className="text-4xl text-blue-500">{isDM ? '@' : '#'}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">
                {isDM ? `Secure chat with ${channelName}` : `Welcome to #${channelName}`}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {isDM ? 'Only you and the other person can see messages sent here.' : 'The start of something great. Send a message to get the conversation going.'}
              </p>
            </div>
          )}

          {searchQuery && filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-60">
              <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                 <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h4 className="text-lg font-bold dark:text-white">No matches for "{searchQuery}"</h4>
              <p className="text-sm text-gray-500 mt-1">Try a different keyword or clear the search.</p>
            </div>
          )}
          
          {filteredMessages.map((msg, index) => {
            const prevMsg = filteredMessages[index - 1];
            const msgDate = new Date(msg.timestamp);
            const prevMsgDate = prevMsg ? new Date(prevMsg.timestamp) : null;
            
            const isNewDay = !prevMsgDate || !isSameDay(msgDate, prevMsgDate);
            
            const isGrouped = !isNewDay && prevMsg && 
              prevMsg.userId === msg.userId && 
              (msgDate.getTime() - prevMsgDate.getTime()) < 300000;

            return (
              <React.Fragment key={msg.id}>
                {isNewDay && <DayDivider date={msg.timestamp} />}
                <MessageItem 
                  message={msg} 
                  user={MOCK_USERS[msg.userId] || MOCK_USERS.me}
                  isGrouped={!!isGrouped}
                  onReply={() => onOpenThread(msg.id)}
                  onDelete={onDeleteMessage}
                  onEdit={onEditMessage}
                  onToggleReaction={onToggleReaction}
                  currentUserId={currentUserId}
                />
              </React.Fragment>
            );
          })}
          
          {isTyping && !searchQuery && (
            <div className="flex items-center gap-3 p-3 mt-4 bg-blue-500/10 dark:bg-blue-500/5 rounded-2xl w-fit border border-blue-500/20 mx-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <div className="relative shrink-0">
                <img src={MOCK_USERS.ai.avatar} className="w-8 h-8 rounded-xl shadow-sm" alt="AI Avatar" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#1C1C1E] rounded-full"></div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Lumina AI</span>
                  <div className="flex gap-1 items-center pt-0.5">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {showScrollButton && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button 
              onClick={() => scrollToBottom('smooth')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                hasNewMessages 
                ? 'bg-blue-600 text-white border-blue-700 animate-pulse ring-4 ring-blue-500/20' 
                : 'bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              <span className="text-xs font-black uppercase tracking-widest">
                {hasNewMessages ? 'New Messages' : 'Scroll to Bottom'}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="p-8 shrink-0 relative">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-32 left-8 z-50 p-3 bg-white dark:bg-[#2C2C2E] glass-panel border border-gray-200 dark:border-white/10 rounded-[2rem] shadow-2xl animate-in fade-in slide-in-from-bottom-4"
          >
            <div className="grid grid-cols-6 gap-2">
              {MAIN_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-xl hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-transform hover:scale-125 active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[2.5rem] opacity-20 blur group-focus-within:opacity-40 transition-opacity"></div>
          <div className="relative glass-panel bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-[2rem] shadow-xl overflow-hidden">
            <div className="flex items-center px-6 py-2 border-b border-white/10 bg-white/10">
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-1.5 transition-colors rounded-lg ${showEmojiPicker ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-blue-500'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 transition-colors rounded-lg ${attachedFile ? 'text-blue-500 bg-blue-500/10' : 'text-gray-400 hover:text-blue-500'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
              </div>
              <div className="flex-1 text-center">
                 {attachedFile && (
                   <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full animate-in fade-in zoom-in inline-flex items-center gap-1">
                     📎 {attachedFile.name}
                     <button 
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="ml-1.5 hover:text-red-500"
                     >
                       ✕
                     </button>
                   </span>
                 )}
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Markdown Supported</span>
            </div>
            <div className="flex items-end gap-2 p-4">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isDM ? `Message ${channelName}` : `Message #${channelName}`}
                className="flex-1 bg-transparent outline-none resize-none py-1 text-sm text-gray-900 dark:text-white font-medium max-h-32 min-h-[24px]"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() && !attachedFile}
                className={`p-2.5 rounded-2xl transition-all duration-300 ${
                  inputValue.trim() || attachedFile
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 hover:scale-110 active:scale-95' 
                    : 'bg-gray-200 dark:bg-white/5 text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </button>
            </div>
          </div>
        </form>
        <p className="mt-3 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          Press <span className="text-gray-500 dark:text-gray-300">Enter</span> to send • Use <span className="text-blue-500">/ask-ai</span> for Lumina Intelligence
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;