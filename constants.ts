
import { User, Channel, Message } from './types';

export const ME: User = {
  id: 'me',
  name: 'Senior Dev',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SeniorDev',
  status: 'online',
  isMe: true
};

export const INITIAL_CHANNELS: Channel[] = [
  { id: 'general', name: 'general', type: 'public', unreadCount: 0 },
  { id: 'projects', name: 'project-lumina', type: 'public', unreadCount: 3 },
  { id: 'design', name: 'design-assets', type: 'public', unreadCount: 0 },
  { id: 'random', name: 'random', type: 'public', unreadCount: 12 },
  { id: 'dm-sarah', name: 'Sarah Chen', type: 'dm', unreadCount: 0, icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
  { id: 'dm-james', name: 'James Wilson', type: 'dm', unreadCount: 1, icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    channelId: 'general',
    userId: 'sarah',
    text: 'Hey team, did we finalize the API docs for the Gemini integration?',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    channelId: 'general',
    userId: 'james',
    text: 'I think we are still waiting for the backend schemas.',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    channelId: 'general',
    userId: 'james',
    text: 'Actually, just saw them in the git repo. Checking now!',
    timestamp: new Date(Date.now() - 3450000),
  },
  {
    id: '4',
    channelId: 'general',
    userId: 'me',
    text: 'Great. Let me know if you need help with the frontend mapping.',
    timestamp: new Date(Date.now() - 3400000),
  }
];

export const MOCK_USERS: Record<string, User> = {
  'sarah': { id: 'sarah', name: 'Sarah Chen', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'online' },
  'james': { id: 'james', name: 'James Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', status: 'away' },
  'me': ME,
  'ai': { id: 'ai', name: 'Lumina AI', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AI', status: 'online' }
};

export const SIMULATED_MESSAGES = [
  "Has anyone seen the latest build?",
  "The design looks clean, good job everyone!",
  "Is the coffee machine working again?",
  "Remember to update your daily status.",
  "That bug in the chat scroll is finally fixed!",
  "Lunch today at 12?",
  "Check out this cool new React library I found.",
  "Working on the thread view component now."
];
