import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, FileText } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateAiResponse } from '../services/geminiService';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  localUserName: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  messages, 
  onSendMessage,
  localUserName
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isAiThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleAiHelp = async () => {
    setIsAiThinking(true);
    const context = messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
    const prompt = inputValue || "Summarize the chat so far.";
    
    // Optimistic UI for AI
    onSendMessage(`@AI ${prompt}`); 
    setInputValue('');

    const aiReply = await generateAiResponse(context, prompt);
    
    onSendMessage(`[AI_RESPONSE]${aiReply}`);
    setIsAiThinking(false);
  };

  const handleSummarize = async () => {
    if (messages.length === 0) return;

    setIsAiThinking(true);
    // Visual cue that request was sent
    onSendMessage("Requesting meeting summary...");

    const context = messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
    const prompt = "Please provide a concise summary of the conversation so far, highlighting key decisions, action items, and open questions.";

    const aiReply = await generateAiResponse(context, prompt);

    // Inject response
    onSendMessage(`[AI_RESPONSE]**Meeting Summary:**\n\n${aiReply}`);
    setIsAiThinking(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white/60 backdrop-blur-2xl border-l border-white/30 shadow-2xl flex flex-col z-50 ring-1 ring-white/20">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/30 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
            <h2 className="font-semibold text-lg text-gray-800">Messages</h2>
            <button
                onClick={handleSummarize}
                disabled={messages.length === 0 || isAiThinking}
                className="px-3 py-1.5 bg-gradient-to-r from-brand-100 to-green-100 hover:from-brand-200 hover:to-green-200 text-brand-700 border border-brand-200/50 rounded-lg transition-all text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Generate AI Summary"
            >
                <Sparkles size={14} className="text-brand-600" />
                <span>AI Summary</span>
            </button>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/40 text-gray-500 hover:text-gray-800 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <p>No messages yet.</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}
        
        {messages.map((msg) => {
           const isMe = msg.senderName === localUserName;
           const isAi = msg.isAi || msg.text.startsWith('[AI_RESPONSE]');
           const cleanText = msg.text.replace('[AI_RESPONSE]', '');

           if (isAi) {
               return (
                   <div key={msg.id} className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center space-x-2 mb-1">
                            <div className="bg-gradient-to-r from-brand-400 to-green-500 p-1 rounded-full shadow-sm">
                                <Sparkles size={12} className="text-white" />
                            </div>
                            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-green-600">Taskflow AI</span>
                            <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="bg-white/70 border border-brand-200/50 text-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[95%] shadow-sm backdrop-blur-sm prose prose-sm prose-p:my-1 prose-headings:my-2">
                            <div className="text-sm whitespace-pre-wrap font-medium">{cleanText}</div>
                        </div>
                   </div>
               )
           }

           return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className="flex items-baseline space-x-2 mb-1">
                <span className="text-xs font-medium text-gray-500">{msg.senderName}</span>
                <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className={`px-4 py-2 rounded-2xl max-w-[85%] break-words shadow-sm backdrop-blur-sm ${
                isMe 
                  ? 'bg-brand-500 text-white rounded-tr-none shadow-brand-500/10' 
                  : 'bg-white/60 text-gray-800 border border-white/40 rounded-tl-none'
              }`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          );
        })}
        {isAiThinking && (
             <div className="flex items-center space-x-2 text-brand-500 text-sm animate-pulse px-2">
                <Sparkles size={16} />
                <span>AI is analyzing...</span>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/30 border-t border-white/20 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send a message..."
            className="w-full bg-white/40 border border-white/30 text-gray-800 pl-4 pr-24 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:border-brand-300/50 placeholder-gray-500 shadow-sm transition-all"
          />
          <div className="absolute right-2 top-1.5 flex items-center space-x-1">
            <button
              type="button"
              onClick={handleAiHelp}
              title="Ask AI"
              className="p-1.5 text-brand-500 hover:text-brand-600 hover:bg-brand-50/50 rounded-full transition-colors"
            >
              <Sparkles size={18} />
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/20"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;