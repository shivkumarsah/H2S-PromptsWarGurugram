/* eslint-disable */
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTravelStore } from '@/lib/store';
import { Trip, ChatMessage } from '@/lib/types';
import { DEMO_CHAT_SUGGESTIONS } from '@/lib/seed-data';

interface ChatAssistantProps {
  trip: Trip;
  onClose: () => void;
}

export default function ChatAssistant({ trip, onClose }: ChatAssistantProps) {
  const { chatSessions, addChatMessage, setIsChatLoading, isChatLoading } = useTravelStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const session = chatSessions[trip.id];
  const messages = session?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isChatLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${crypto.randomUUID()}_user`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(trip.id, userMessage);
    setInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          sessionId: session?.id || `session_${trip.id}`,
          message: messageText,
          currentItinerary: trip.itinerary,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        addChatMessage(trip.id, data.data);
      }
    } catch (err) {
      addChatMessage(trip.id, {
        id: `msg_${crypto.randomUUID()}_err`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again!",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ width: '380px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">
            🤖
          </div>
          <div>
            <div className="font-semibold text-sm">AI Travel Planner</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">Gemini Active</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost p-2 text-slate-400">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chat-bubble-ai">
              <p className="text-sm leading-relaxed">
                👋 Hi! I'm your AI travel planner powered by Gemini. I can modify your itinerary in real-time!
              </p>
              <p className="text-sm leading-relaxed mt-2 text-slate-400">
                Ask me anything like:
              </p>
              <ul className="text-sm text-slate-300 mt-1 space-y-1">
                <li>• "Make this trip cheaper"</li>
                <li>• "Replace outdoor activities if it rains"</li>
                <li>• "Add nightlife for Friday"</li>
                <li>• "Move the museum visit to Day 2"</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">
                🤖
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors border border-indigo-500/20"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {isChatLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs">
              🤖
            </div>
            <div className="chat-bubble-ai">
              <div className="flex gap-1 items-center py-1">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [-3, 3, -3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay }}
                    className="w-2 h-2 rounded-full bg-indigo-400"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length < 2 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_CHAT_SUGGESTIONS.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                className="text-xs px-3 py-1.5 glass rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask me to modify your trip..."
            className="input-field text-sm py-3"
            disabled={isChatLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isChatLoading || !input.trim()}
            className="btn-primary px-4 flex-shrink-0 relative z-10"
          >
            {isChatLoading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}
