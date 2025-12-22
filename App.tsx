import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ThreadWindow from './components/ThreadWindow';
import { Message, Channel, User } from './types';
import { INITIAL_CHANNELS, INITIAL_MESSAGES, ME, SIMULATED_MESSAGES, MOCK_USERS } from './constants';
import { askGemini } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [channels, setChannels] = useState<Channel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [lastActiveThreadId, setLastActiveThreadId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  useEffect(() => {
    if (activeThreadId) {
      setLastActiveThreadId(activeThreadId);
    }
  }, [activeThreadId]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Clear unread count when channel is opened
  useEffect(() => {
    setChannels(prev => prev.map(c => 
      c.id === activeChannelId ? { ...c, unreadCount: 0 } : c
    ));
  }, [activeChannelId]);

  // Simulated Real-time Messages
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMsg = SIMULATED_MESSAGES[Math.floor(Math.random() * SIMULATED_MESSAGES.length)];
      
      const channelPool = ['general', 'projects', 'dm-sarah', 'dm-james'];
      const randomChannel = channelPool[Math.floor(Math.random() * channelPool.length)];
      
      let userId = ['sarah', 'james'][Math.floor(Math.random() * 2)];

      if (randomChannel === 'dm-sarah') userId = 'sarah';
      if (randomChannel === 'dm-james') userId = 'james';
      
      const newMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        channelId: randomChannel,
        userId: userId,
        text: randomMsg,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);

      setChannels(prev => prev.map(c => {
        if (c.id === randomChannel && c.id !== activeChannelId) {
          return { ...c, unreadCount: c.unreadCount + 1 };
        }
        return c;
      }));
    }, 25000);

    return () => clearInterval(interval);
  }, [activeChannelId]);

  const handleSendMessage = async (text: string, parentId?: string, file?: File) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      channelId: activeChannelId,
      userId: ME.id,
      text: text,
      timestamp: new Date(),
      parentId: parentId,
      attachment: file ? {
        name: file.name,
        size: file.size,
        type: file.type
      } : undefined
    };

    setMessages(prev => [...prev, newMessage]);

    if (text.startsWith('/ask-ai')) {
      const prompt = text.replace('/ask-ai', '').trim();
      if (prompt) {
        setIsTyping(true);
        const [aiResponseText] = await Promise.all([
          askGemini(prompt),
          new Promise(resolve => setTimeout(resolve, 1500))
        ]);
        setIsTyping(false);
        
        const aiMessage: Message = {
          id: Math.random().toString(36).substr(2, 9),
          channelId: activeChannelId,
          userId: 'ai',
          text: aiResponseText,
          timestamp: new Date(),
          isAI: true,
          parentId: parentId
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id && m.parentId !== id));
    if (activeThreadId === id) setActiveThreadId(null);
  };

  const handleEditMessage = (id: string, newText: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text: newText } : m));
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      
      const reactions = { ...(m.reactions || {}) };
      const currentEmojiUsers = (reactions[emoji] || []) as string[];
      
      let newUserIds: string[];
      if (currentEmojiUsers.includes(ME.id)) {
        newUserIds = currentEmojiUsers.filter(uid => uid !== ME.id);
      } else {
        newUserIds = [...currentEmojiUsers, ME.id];
      }
      
      if (newUserIds.length === 0) {
        delete reactions[emoji];
      } else {
        reactions[emoji] = newUserIds;
      }
      
      return { ...m, reactions };
    }));
  };

  const activeChannelMessages = messages.filter(m => m.channelId === activeChannelId && !m.parentId);
  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const isDM = activeChannel.type === 'dm';

  const getRecipientStatus = () => {
    if (!isDM) return undefined;
    const userId = activeChannelId.split('-')[1];
    return MOCK_USERS[userId]?.status || 'offline';
  };
  
  const threadIdToShow = activeThreadId || lastActiveThreadId;
  const activeThreadMessage = messages.find(m => m.id === threadIdToShow);
  const threadReplies = messages.filter(m => m.parentId === threadIdToShow);

  return (
    <div className="flex h-screen w-screen p-4 gap-4 overflow-hidden relative">
      <div className="absolute inset-0 bg-black/10 dark:bg-transparent pointer-events-none"></div>
      
      <Sidebar 
        activeChannelId={activeChannelId} 
        onChannelSelect={(id) => {
          setActiveChannelId(id);
          setActiveThreadId(null);
        }}
        currentUser={ME}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        messages={messages}
        channels={channels}
      />
      
      <main className="flex flex-1 min-w-0 gap-4 overflow-hidden">
        <div className="flex-1 glass-panel bg-white/60 dark:bg-[#1C1C1E]/60 rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 flex transition-all duration-500 ease-in-out">
          <div className="flex-1 min-w-0">
            <ChatWindow 
              channelName={activeChannel.name}
              isDM={isDM}
              recipientStatus={getRecipientStatus()}
              messages={activeChannelMessages}
              onSendMessage={(text, file) => handleSendMessage(text, undefined, file)}
              onOpenThread={(id) => setActiveThreadId(id)}
              onDeleteMessage={handleDeleteMessage}
              onEditMessage={handleEditMessage}
              onToggleReaction={handleToggleReaction}
              isTyping={isTyping}
              currentUserId={ME.id}
            />
          </div>
          
          <div 
            className={`overflow-hidden transition-all duration-500 ease-in-out border-l border-white/20 dark:border-white/10 ${
              activeThreadId ? 'w-[400px] opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <div className={`w-[400px] h-full transform transition-transform duration-500 ease-in-out ${
              activeThreadId ? 'translate-x-0' : 'translate-x-full'
            }`}>
              {activeThreadMessage && (
                <ThreadWindow 
                  parentMessage={activeThreadMessage}
                  replies={threadReplies}
                  onClose={() => setActiveThreadId(null)}
                  onSendMessage={(text, file) => handleSendMessage(text, threadIdToShow!, file)}
                  onDeleteMessage={handleDeleteMessage}
                  onEditMessage={handleEditMessage}
                  onToggleReaction={handleToggleReaction}
                  currentUserId={ME.id}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;