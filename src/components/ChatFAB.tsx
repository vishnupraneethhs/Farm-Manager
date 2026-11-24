import { useState, useEffect, useRef } from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { FarmChatScreen } from '@/screens/FarmChatScreen';

/**
 * ChatFAB — Floating AI chat button that persists on all screens.
 * Opens a full-screen slide-up chat panel.
 */
export function ChatFAB() {
  const [open, setOpen] = useState(false);
  const [hasNewMsg, setHasNewMsg] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when chat is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setHasNewMsg(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Keyboard close (Escape)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* ── FAB Button ── */}
      {!open && (
        <button
          id="farm-chat-fab"
          onClick={() => setOpen(true)}
          aria-label="Open AI Farm Assistant"
          className="fixed bottom-6 right-5 z-40 group flex items-center gap-0 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/40 transition-all duration-300 hover:gap-2 hover:pr-4 active:scale-90"
          style={{ padding: '14px' }}
        >
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-30 animate-ping" />
          <Bot size={24} className="relative text-white flex-shrink-0" />
          {/* Expandable label on hover */}
          <span className="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold text-white transition-all duration-300 group-hover:max-w-xs">
            Ask FarmBot
          </span>
          {/* Unread badge */}
          {hasNewMsg && (
            <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white" />
          )}
        </button>
      )}

      {/* ── Chat Panel Overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Panel slides up from bottom */}
          <div
            ref={panelRef}
            className="mt-auto w-full max-w-lg mx-auto animate-slideup rounded-t-3xl sm:rounded-3xl sm:mb-4 overflow-hidden shadow-2xl bg-gray-50"
            style={{ maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close bar */}
            <div className="flex items-center justify-between bg-white px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-600" />
                <span className="text-sm font-bold text-gray-800">FarmBot AI Assistant</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 active:scale-90"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat content */}
            <div className="overflow-hidden" style={{ height: 'calc(92vh - 64px)' }}>
              <FarmChatScreen />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
