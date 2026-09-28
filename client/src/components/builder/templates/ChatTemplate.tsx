'use client';

import { useState } from 'react';
import { Bot, Send, User, Hash, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'bot' | 'team';
  senderName: string;
  text: string;
  time: string;
}

export function ChatTemplate({ title }: { title: string }) {
  const [activeChannel, setActiveChannel] = useState('launch-team');
  const [inputMessage, setInputMessage] = useState('');

  const [channelMessages, setChannelMessages] = useState<Record<string, Message[]>>({
    'launch-team': [
      { id: 'm1', sender: 'team', senderName: 'Alex (Lead Developer)', text: 'Can someone inspect the latest preview deployment build?', time: '10:40 AM' },
      { id: 'm2', sender: 'bot', senderName: 'Blueprint AI Assistant', text: 'All 15 static routes compiled cleanly. Supabase database schema synced with RLS enabled.', time: '10:41 AM' },
    ],
    'support-queue': [
      { id: 'm3', sender: 'team', senderName: 'Support Agent', text: 'Ticket #402: User requesting API terminal contract export.', time: '09:15 AM' },
    ],
    'design-partners': [
      { id: 'm4', sender: 'team', senderName: 'UI Architect', text: 'Reviewing cyan-400 theme accents across viewport breakpoints.', time: 'Yesterday' },
    ],
  });

  const currentMessages = channelMessages[activeChannel] || [];

  const sendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'user',
      senderName: 'You',
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChannelMessages((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), userMsg],
    }));

    const userText = inputMessage.trim();
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        senderName: 'Blueprint AI Assistant',
        text: `Received: "${userText.slice(0, 60)}${userText.length > 60 ? '…' : ''}". AI Engineer context updated.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChannelMessages((prev) => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), botMsg],
      }));
    }, 1000);
  };

  return (
    <main className="min-h-full bg-[#05070a] p-6 text-white font-sans">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Channel List */}
        <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Channels</p>
          </div>
          <div className="space-y-1">
            {[
              { id: 'launch-team', name: 'launch-team' },
              { id: 'support-queue', name: 'support-queue' },
              { id: 'design-partners', name: 'design-partners' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChannel(c.id)}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                  activeChannel === c.id
                    ? 'bg-cyan-400 text-[#05070a] shadow-[0_0_15px_rgba(0,243,255,0.3)]'
                    : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Hash className="h-3.5 w-3.5" />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Conversation Window */}
        <section className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-6 min-h-[500px]">
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <Hash className="h-5 w-5 text-cyan-400" />
                  {activeChannel}
                </h1>
                <p className="mt-1 text-xs text-white/40">{title} — real-time AI conversation workspace</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xl rounded-2xl p-4 space-y-1 ${
                      msg.sender === 'user'
                        ? 'bg-cyan-400 text-[#05070a] font-medium'
                        : msg.sender === 'bot'
                        ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-100'
                        : 'bg-white/[0.05] border border-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 mb-1 font-bold">
                      <span className="flex items-center gap-1">
                        {msg.sender === 'bot' ? <Bot className="h-3 w-3 text-cyan-400" /> : <User className="h-3 w-3" />}
                        {msg.senderName}
                      </span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input Line */}
          <form onSubmit={sendMessage} className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-2.5 focus-within:border-cyan-400/50 transition-colors">
            <input
              type="text"
              placeholder={`Message #${activeChannel}…`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-transparent px-3 text-xs text-white placeholder-white/30 outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 text-[#05070a] disabled:opacity-30 hover:bg-cyan-300 transition-colors shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

