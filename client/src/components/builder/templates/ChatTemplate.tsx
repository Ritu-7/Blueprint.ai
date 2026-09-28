'use client';

import { useState } from 'react';
import { Send, Hash, Users, MessageSquare, Bot, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  content: string;
  timestamp: string;
  isBot?: boolean;
}

export function ChatTemplate({ title }: { title: string }) {
  const [activeChannel, setActiveChannel] = useState('general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'You',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const userText = inputText.trim();
    setInputText('');

    // Optional AI bot auto response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'Blueprint AI Assistant',
          content: `Received message: "${userText}". How can I assist with this channel task?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isBot: true,
        },
      ]);
    }, 1000);
  };

  const handleClearMessages = () => {
    setMessages([]);
    toast.info('Cleared channel history');
  };

  return (
    <main className="flex h-full min-h-[550px] bg-[#05070a] text-white font-sans overflow-hidden">
      {/* Sidebar Channels */}
      <aside className="w-64 border-r border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
            <MessageSquare className="h-5 w-5 text-cyan-300" />
            <span className="font-black text-sm tracking-tight truncate">{title}</span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2 px-2">Channels</p>
          <div className="space-y-1">
            {['general', 'announcements', 'dev-team', 'support'].map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                  activeChannel === ch
                    ? 'bg-cyan-400/10 text-cyan-300 border border-cyan-400/20'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <Hash className="h-3.5 w-3.5 text-cyan-400" />
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-cyan-400" /> Live Workspace
          </span>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col justify-between bg-[#05070a]">
        {/* Channel Header */}
        <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-cyan-300" />
            <h2 className="font-black text-base text-white">{activeChannel}</h2>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearMessages}
              className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/5 transition-colors"
              title="Clear channel chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </header>

        {/* Message Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="py-20 text-center text-xs text-white/30 space-y-2">
              <MessageSquare className="h-8 w-8 mx-auto opacity-30 text-cyan-400" />
              <p>No messages in #{activeChannel} yet.</p>
              <p className="text-[11px] text-white/20">Send a message below to start conversation.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs ${
                  msg.isBot ? 'bg-cyan-400/5 border border-cyan-400/20 rounded-2xl p-4' : ''
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                  {msg.isBot ? <Bot className="h-4 w-4 text-cyan-300" /> : <User className="h-4 w-4 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{msg.sender}</span>
                    <span className="text-[10px] text-white/30">{msg.timestamp}</span>
                  </div>
                  <p className="mt-1 text-white/80 leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Message #${activeChannel}…`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-[#05070a] hover:bg-cyan-300 disabled:opacity-30 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
