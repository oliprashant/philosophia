'use client';
// src/components/ai/AIChatWidget.tsx
// Floating, collapsible AI assistant chat widget ("Logos").
// Context-aware: picks up the title of the post the user is currently reading
// by reading the document title and any open graph metadata.

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Minimize2, Send, Loader2, RefreshCw } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [postContext, setPostContext] = useState<{ title?: string; excerpt?: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  // Detect current post context from the page
  useEffect(() => {
    if (pathname.startsWith('/blog/')) {
      const title = document.title.replace(' — Philosophia', '');
      const descMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      setPostContext({ title, excerpt: descMeta?.content });
    } else {
      setPostContext({});
    }
  }, [pathname]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting when first opened
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: postContext.title
          ? `Welcome. I see you're reading *"${postContext.title}"*. I'm Logos, your philosophical companion. Ask me anything about the ideas in this piece, or explore any thread of thought.`
          : "Welcome to Philosophia. I'm Logos — your companion through ideas. Ask me about any post, philosophical concept, or let me recommend something to read.",
      }]);
    }
  }, [open, postContext.title]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: postContext,
        }),
      });

      if (!res.ok) throw new Error('Chat API error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I seem to be temporarily unreachable. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, messages, loading, postContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetConversation = () => {
    setMessages([{
      role: 'assistant',
      content: "The conversation has been cleared. Where shall we begin?",
    }]);
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); }}
          aria-label="Open AI assistant"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-glow-burgundy hover:scale-105 transition-transform flex items-center justify-center animate-float"
        >
          <MessageSquare size={22} />
        </button>
      )}

      {/* ── Chat window ── */}
      {open && (
        <div
          className={`
            fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-[var(--bg-primary)] border border-[var(--border)]
            shadow-card rounded-sm flex flex-col transition-all duration-300 overflow-hidden
            ${minimized ? 'h-12' : 'h-[520px]'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-cormorant)' }}>
                Logos <span className="text-xs text-[var(--text-faint)] font-sans font-normal">· AI Companion</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={resetConversation} title="Reset" className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"><RefreshCw size={13} /></button>
              <button onClick={() => setMinimized(!minimized)} title="Minimize" className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"><Minimize2 size={13} /></button>
              <button onClick={() => setOpen(false)} title="Close" className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors"><X size={13} /></button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center mr-2 mt-0.5 shrink-0 font-sans">L</div>
                    )}
                    <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                      {msg.content.split('\n').map((line, j) => (
                        <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-xs flex items-center justify-center font-sans">L</div>
                    <div className="chat-bubble-ai flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin text-[var(--text-faint)]" />
                      <span className="text-[var(--text-faint)] italic text-xs">thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[var(--border)] p-3 shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Logos anything…"
                    rows={1}
                    className="flex-1 resize-none bg-[var(--bg-secondary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-sans focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-faint)] text-[var(--text-primary)]"
                    style={{ maxHeight: '96px', minHeight: '38px' }}
                    onInput={e => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = 'auto';
                      t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="w-9 h-9 flex items-center justify-center bg-[var(--accent)] text-white rounded hover:bg-[var(--accent-light)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    aria-label="Send"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-[10px] font-sans text-[var(--text-faint)] mt-1.5 text-center">
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
