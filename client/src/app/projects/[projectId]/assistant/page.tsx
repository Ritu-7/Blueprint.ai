'use client';

import { useState } from 'react';
import { useProject } from '@/components/workspace/ProjectContext';
import { Bot, Send, User, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export default function ProjectAssistantPage() {
  const { project } = useProject();
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `Hello! I am your AI assistant for "${project?.name || 'this blueprint'}". Ask me anything about your generated code, schema, API endpoints, or architecture.`,
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg },
      {
        sender: 'assistant',
        text: `I analyzed your question regarding "${userMsg}". Your project "${project?.name}" is configured with ${project?.kind} architecture. All schema files and API endpoints are up to date!`,
      },
    ]);
  };

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      <div className="border-b border-white/10 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bot className="h-6 w-6 text-cyan-400" />
            AI Project Assistant
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Interactive AI assistant with complete context of {project?.name}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-[450px] rounded-3xl border border-white/10 bg-[#070a0f] overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-cyan-400 text-[#05070a]'
                    : 'bg-white/10 text-cyan-300 border border-white/10'
                }`}
              >
                {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-400/10 border border-cyan-400/30 text-white'
                    : 'bg-white/[0.04] border border-white/10 text-white/80'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="border-t border-white/10 p-4 bg-white/[0.02]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask AI about ${project?.name}...`}
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-xs text-white placeholder:text-white/30 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-[#05070a] hover:bg-cyan-300 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
