import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import { MOCK_USERS } from '../constants';
import MessageItem from './MessageItem';

interface ThreadWindowProps {
  parentMessage: Message;
  replies: Message[];
  onClose: () => void;
  onSendMessage: (text: string, file?: File) => void;
  onDeleteMessage: (id: string) => void;
  onEditMessage?: (id: string, newText: string) => void;
  onToggleReaction?: (id: string, emoji: string) => void;
  currentUserId: string;
}

const THREAD_EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '👀'];

const ThreadWindow: React.FC<ThreadWindowProps> = ({ 
  parentMessage, 
  replies, 
  onClose, 
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onToggleReaction,
  currentUserId
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

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

  return (
    <div className="flex flex-col h-full bg-white/10 dark:bg-black/20 animate-in slide-in-from-right duration-300 overflow-hidden relative">
      <div className="h-20 border-b border-gray-200/30 dark:border-white/5 flex items-center px-6 justify-between shrink-0">
        <div>
          <h2 className="font-extrabold text-lg dark:text-white tracking-tight">Thread</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Conversation details</p>
        </div>
        <button onClick={onClose} className="p-2.5 hover:bg-white/20 dark:hover:bg-white/10 rounded-2xl text-gray-500 transition-all active:scale-90">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pt-4" ref={scrollRef}>
        <div className="border-b border-white/5 mb-2">
          <MessageItem 
            message={parentMessage} 
            user={MOCK_USERS[parentMessage.userId] || MOCK_USERS.me} 
            isGrouped={false} 
            onReply={() => {}} 
            onDelete={onDeleteMessage}
            onEdit={onEditMessage}
            onToggleReaction={onToggleReaction}
            currentUserId={currentUserId}
          />
        </div>

        <div className="space-y-0.5 pb-6">
          <div className="px-6 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </div>
          {replies.map((msg, index) => {
            const prevMsg = replies[index - 1];
            const isGrouped = prevMsg && 
              prevMsg.userId === msg.userId && 
              (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()) < 300000;

            return (
              <MessageItem 
                key={msg.id} 
                message={msg} 
                user={MOCK_USERS[msg.userId] || MOCK_USERS.me} 
                isGrouped={!!isGrouped} 
                onReply={() => {}} 
                onDelete={onDeleteMessage}
                onEdit={onEditMessage}
                onToggleReaction={onToggleReaction}
                currentUserId={currentUserId}
              />
            );
          })}
        </div>
      </div>

      <div className="p-6 shrink-0 relative">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            className="absolute bottom-40 right-6 z-50 p-2 bg-white dark:bg-[#2C2C2E] glass-panel border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex gap-1">
              {THREAD_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel bg-white/30 dark:bg-white/5 rounded-3xl border border-white/20 overflow-hidden shadow-sm">
          <div className="flex items-center px-4 py-2 border-b border-white/5 bg-white/5 gap-2">
            <button 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <div className="flex-1">
              {attachedFile && (
                <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1 animate-in zoom-in">
                  📎 {attachedFile.name}
                  <button type="button" onClick={() => setAttachedFile(null)} className="hover:text-red-500">✕</button>
                </span>
              )}
            </div>
          </div>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Reply..."
            className="w-full bg-transparent p-4 outline-none resize-none min-h-[80px] text-sm text-gray-900 dark:text-white font-medium"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex justify-end p-3 border-t border-white/10 bg-white/5">
            <button 
              type="submit"
              disabled={!inputValue.trim() && !attachedFile}
              className={`px-5 py-1.5 rounded-2xl text-xs font-bold tracking-tight transition-all ${
                inputValue.trim() || attachedFile
                  ? 'bg-blue-500 text-white shadow-md hover:scale-105 active:scale-95' 
                  : 'bg-gray-200 dark:bg-white/5 text-gray-400'
              }`}
            >
              Send Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ThreadWindow;