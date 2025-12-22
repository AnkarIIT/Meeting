import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';

interface MessageItemProps {
  message: Message;
  user: User;
  isGrouped: boolean;
  onReply: () => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
  onToggleReaction?: (id: string, emoji: string) => void;
  currentUserId: string;
}

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🚀', '👀'];

/**
 * A lightweight markdown parser for chat messages.
 * Supports: **bold**, *italic*, `inline code`, and ```code blocks```.
 */
const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  // Split by code blocks first to protect code content from other formatting
  const blockParts = text.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {blockParts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3).trim();
          return (
            <pre key={i} className="my-3 p-4 bg-black/5 dark:bg-white/5 rounded-2xl font-mono text-[13px] overflow-x-auto border border-black/5 dark:border-white/5 shadow-inner leading-relaxed">
              <code>{code}</code>
            </pre>
          );
        }

        // Handle inline formatting for non-block parts
        let subParts: (string | React.ReactNode)[] = [part];

        // Bold: **text**
        subParts = subParts.flatMap((p, idx1) => {
          if (typeof p !== 'string') return p;
          const bits = p.split(/(\*\*.*?\*\*)/g);
          return bits.map((bit, idx2) => 
            bit.startsWith('**') && bit.endsWith('**') 
              ? <strong key={`${idx1}-${idx2}`} className="font-extrabold text-gray-900 dark:text-white">{bit.slice(2, -2)}</strong> 
              : bit
          );
        });

        // Italic: *text*
        subParts = subParts.flatMap((p, idx1) => {
          if (typeof p !== 'string') return p;
          const bits = p.split(/(\*.*?\*)/g);
          return bits.map((bit, idx2) => 
            bit.startsWith('*') && bit.endsWith('*') 
              ? <em key={`${idx1}-${idx2}`} className="italic opacity-90">{bit.slice(1, -1)}</em> 
              : bit
          );
        });

        // Inline Code: `code`
        subParts = subParts.flatMap((p, idx1) => {
          if (typeof p !== 'string') return p;
          const bits = p.split(/(`.*?`)/g);
          return bits.map((bit, idx2) => 
            bit.startsWith('`') && bit.endsWith('`') 
              ? <code key={`${idx1}-${idx2}`} className="px-1.5 py-0.5 bg-black/5 dark:bg-white/10 rounded-lg font-mono text-[0.85em] border border-black/5 dark:border-white/10 text-blue-600 dark:text-blue-400 mx-0.5">{bit.slice(1, -1)}</code> 
              : bit
          );
        });

        return <span key={i}>{subParts}</span>;
      })}
    </>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  user, 
  isGrouped, 
  onReply, 
  onDelete, 
  onEdit, 
  onToggleReaction,
  currentUserId 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editInputRef.current.value.length, editInputRef.current.value.length);
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (dateInput: Date | string, showFullDate: boolean = false) => {
    const date = new Date(dateInput);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (!showFullDate) return timeString;
    if (messageDate.getTime() === today.getTime()) return `Today at ${timeString}`;
    if (messageDate.getTime() === yesterday.getTime()) return `Yesterday at ${timeString}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeString}`;
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text && onEdit) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(message.text);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this message?')) {
      setIsDeleting(true);
      setTimeout(() => onDelete(message.id), 400);
    }
  };

  const handleReaction = (emoji: string) => {
    onToggleReaction?.(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ReactionsDisplay = () => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {(Object.entries(message.reactions) as [string, string[]][]).map(([emoji, userIds]) => {
          if (userIds.length === 0) return null;
          const hasReacted = userIds.includes(currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => onToggleReaction?.(message.id, emoji)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-bold transition-all ${
                hasReacted 
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <span>{emoji}</span>
              <span>{userIds.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const AttachmentCard = () => {
    if (!message.attachment) return null;
    return (
      <div className="mt-2 p-3 bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-2xl flex items-center gap-3 w-fit max-w-full shadow-sm group/attach">
        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        </div>
        <div className="flex flex-col min-w-0 pr-4">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{message.attachment.name}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase">{formatFileSize(message.attachment.size)} • {message.attachment.type.split('/')[1] || 'FILE'}</span>
        </div>
        <button className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-400 transition-colors opacity-0 group-hover/attach:opacity-100">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
      </div>
    );
  }

  const ActionsOverlay = () => (
    <div className={`absolute top-[-16px] right-4 hidden group-hover:flex items-center gap-1 bg-white/95 dark:bg-[#2C2C2E]/95 glass-panel border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-1 z-20 ${isDeleting ? 'pointer-events-none opacity-0' : ''}`}>
      <button 
        onClick={(e) => { e.stopPropagation(); onReply(); }} 
        className="p-2 hover:bg-blue-500 hover:text-white rounded-xl transition-all text-gray-500"
        title="Reply in thread"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
      </button>
      
      {user.isMe && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} 
          className="p-2 hover:bg-amber-500 hover:text-white rounded-xl transition-all text-gray-500"
          title="Edit message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
      )}

      <div className="relative" ref={pickerRef}>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
          className={`p-2 hover:bg-pink-500 hover:text-white rounded-xl transition-all ${showEmojiPicker ? 'bg-pink-500 text-white' : 'text-gray-500'}`} 
          title="React"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>
        
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 p-1 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl flex gap-1 z-30 animate-in fade-in slide-in-from-bottom-1">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={(e) => { e.stopPropagation(); handleReaction(emoji); }}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-lg transition-transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <button 
        onClick={handleDelete}
        className="p-2 hover:bg-rose-500 hover:text-white rounded-xl transition-all text-gray-500"
        title="Delete message"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  );

  const renderMessageContent = () => {
    if (isEditing) {
      return (
        <div className="mt-2 w-full">
          <textarea
            ref={editInputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-white dark:bg-[#1C1C1E] border border-blue-500 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-800 dark:text-gray-200 min-h-[60px]"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-500 text-white text-[11px] font-bold rounded-lg hover:bg-blue-600 transition-colors">Save Changes</button>
            <button onClick={() => { setIsEditing(false); setEditText(message.text); }} className="px-3 py-1 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[11px] font-bold rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition-colors">Cancel</button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col">
        {message.text && (
          <div className="text-gray-800 dark:text-gray-200 text-[14.5px] leading-[1.6] font-medium whitespace-pre-wrap break-words">
            <MarkdownText text={message.text} />
          </div>
        )}
        <AttachmentCard />
        <ReactionsDisplay />
      </div>
    );
  };

  const animationClasses = isDeleting ? 'animate-out fade-out' : 'animate-in fade-in slide-in-from-bottom-1';

  if (isGrouped) {
    return (
      <div className={`group relative flex items-start px-4 hover:bg-black/5 dark:hover:bg-white/5 py-0.5 transition-colors rounded-xl mx-2 mt-0 ${isEditing ? 'bg-blue-500/5 ring-1 ring-blue-500/20 py-2' : ''} ${animationClasses}`}>
        <div className="w-[60px] shrink-0 flex justify-center pt-1 pr-1">
          <span className="text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 tabular-nums transition-opacity select-none">{formatTime(message.timestamp, false)}</span>
        </div>
        <div className="flex-1 min-w-0">{renderMessageContent()}</div>
        {!isEditing && !isDeleting && <ActionsOverlay />}
      </div>
    );
  }

  return (
    <div className={`group relative flex items-start gap-4 px-4 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-3xl mx-2 mt-4 first:mt-0 ${message.isAI ? 'bg-blue-500/5 border border-blue-500/10' : ''} ${isEditing ? 'bg-blue-500/5 ring-1 ring-blue-500/20' : ''} ${animationClasses}`}>
      <div className="relative shrink-0">
        <img src={user.avatar} className="w-11 h-11 rounded-2xl object-cover shadow-md transition-transform group-hover:scale-105" alt={user.name} />
        {user.status && user.status !== 'offline' && (
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white dark:border-[#1C1C1E] rounded-full shadow-sm ${user.status === 'online' ? 'bg-green-500' : user.status === 'away' ? 'bg-amber-400' : 'bg-rose-500'}`}></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`font-extrabold text-[15px] tracking-tight hover:underline cursor-pointer ${message.isAI ? 'text-blue-500' : 'text-gray-900 dark:text-white'}`}>{user.name}</span>
          {message.isAI && <span className="text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-lg uppercase tracking-widest shadow-sm">AI</span>}
          <span className="text-[10px] text-gray-400 font-bold tracking-tight tabular-nums opacity-60">{formatTime(message.timestamp, true)}</span>
        </div>
        {renderMessageContent()}
      </div>
      {!isEditing && !isDeleting && <ActionsOverlay />}
    </div>
  );
};

export default MessageItem;