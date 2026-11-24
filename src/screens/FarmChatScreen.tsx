import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot, Send, Mic, MicOff, Trash2, Copy, Check,
  WifiOff, AlertCircle, Loader2, Sparkles, RotateCw, ChevronRight,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import {
  sendFarmChat,
  sendFarmChatSimple,
  farmAiConfigured,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  type ChatMessage,
} from '@/lib/farmAi';

// ─── Types ───────────────────────────────────────────────────────────────────
interface UIMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  streaming?: boolean;
  error?: boolean;
  timestamp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-0.5">
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? t('chatCopied') : t('chatCopy')}
    </button>
  );
}

interface BubbleProps {
  msg: UIMessage;
}

function UserBubble({ msg }: BubbleProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%]">
        <div className="rounded-3xl rounded-tr-md bg-emerald-600 px-4 py-3 text-white shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">{formatTime(msg.timestamp)}</p>
      </div>
    </div>
  );
}

function AiBubble({ msg }: BubbleProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="mt-0.5 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-2 shadow-sm">
        <Bot size={16} className="text-white" />
      </div>
      <div className="max-w-[80%] min-w-0">
        <div
          className={`rounded-3xl rounded-tl-md bg-white px-4 py-3 shadow-sm border border-gray-100 ${
            msg.error ? 'border-red-200 bg-red-50' : ''
          }`}
        >
          {msg.streaming && !msg.text ? (
            <TypingDots />
          ) : msg.error ? (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle size={14} /> {msg.text}
            </p>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{msg.text}</p>
          )}
          {msg.streaming && msg.text && (
            <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-emerald-500" />
          )}
        </div>
        {!msg.streaming && !msg.error && msg.text && (
          <div className="ml-1 flex items-center gap-3">
            <p className="text-xs text-gray-400">{formatTime(msg.timestamp)}</p>
            <CopyButton text={msg.text} />
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionChips({ onSelect }: { onSelect: (q: string) => void }) {
  const { t } = useApp();
  const suggKeys = [
    'chatSugg1', 'chatSugg2', 'chatSugg3', 'chatSugg4',
    'chatSugg5', 'chatSugg6', 'chatSugg7', 'chatSugg8',
  ] as const;

  return (
    <div className="px-4 py-3">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {t('chatSuggestionsTitle')}
      </p>
      <div className="flex flex-wrap gap-2">
        {suggKeys.map((key) => (
          <button
            key={key}
            onClick={() => onSelect(t(key))}
            className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-all active:scale-95 hover:bg-emerald-100"
          >
            <ChevronRight size={13} />
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FarmChatScreen() {
  const { t, online, lang } = useApp();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<boolean>(false);

  // Load persisted history on mount
  useEffect(() => {
    const history = loadChatHistory();
    if (history.length > 0) {
      setMessages(history.map((m) => ({ ...m, id: uid() })));
    } else {
      // Welcome message
      setMessages([
        {
          id: uid(),
          role: 'model',
          text: t('chatWelcome'),
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist on change (skip welcome message only scenario)
  useEffect(() => {
    const persistable = messages.filter((m) => !m.streaming && !m.error);
    if (persistable.length > 1) {
      saveChatHistory(persistable.map(({ role, text, timestamp }) => ({ role, text, timestamp })));
    }
  }, [messages]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setListening(true);
    const rec = new SR();
    rec.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' : '') + transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => { setListening(false); recognitionRef.current = null; };
    recognitionRef.current = rec;
    rec.start();
  };

  const handleClear = () => {
    clearChatHistory();
    setMessages([
      { id: uid(), role: 'model', text: t('chatWelcome'), timestamp: Date.now() },
    ]);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    abortRef.current = false;

    const userMsg: UIMessage = {
      id: uid(), role: 'user', text: text.trim(), timestamp: Date.now(),
    };
    const aiMsgId = uid();
    const aiPlaceholder: UIMessage = {
      id: aiMsgId, role: 'model', text: '', streaming: true, timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setLoading(true);

    // Build history for Gemini (exclude welcome message, exclude streaming placeholders)
    const history: ChatMessage[] = messages
      .filter((m) => !m.streaming && !m.error && m.id !== messages[0]?.id)
      .map(({ role, text, timestamp }) => ({ role, text, timestamp }));

    try {
      if (!online) throw new Error('OFFLINE');
      if (!farmAiConfigured) throw new Error('NO_API_KEY');

      // Try streaming first
      let fullText = '';
      try {
        const stream = sendFarmChat(history, text.trim());
        for await (const chunk of stream) {
          if (abortRef.current) break;
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, text: fullText, streaming: true } : m
            )
          );
        }
      } catch (streamErr) {
        // Fallback to simple non‑streaming call
        fullText = await sendFarmChatSimple(history, text.trim());
      }

      // Finalise message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, text: fullText, streaming: false } : m
        )
      );
    } catch (err) {
      const errMsg =
        (err as Error).message === 'OFFLINE'
          ? t('chatOffline')
          : (err as Error).message === 'NO_API_KEY'
          ? t('chatNoKey')
          : t('chatErrorRetry');

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, text: errMsg, streaming: false, error: true } : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [messages, loading, online, t]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showSuggestions = messages.length <= 1;
  const canSend = input.trim().length > 0 && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[700px] rounded-3xl bg-gray-50 overflow-hidden border border-gray-100 shadow-sm">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/20 p-2.5 backdrop-blur-sm">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base">{t('chatTitle')}</h2>
            <p className="text-xs text-emerald-100">{t('chatSubtitle')}</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-all active:scale-95 hover:bg-white/25"
        >
          <Trash2 size={13} />
          {t('chatNewChat')}
        </button>
      </div>

      {/* ── Status banners ── */}
      {!online && (
        <div className="flex-shrink-0 flex items-center gap-2 bg-amber-50 border-b border-amber-100 px-4 py-2.5 text-sm text-amber-700">
          <WifiOff size={15} /> {t('chatOffline')}
        </div>
      )}
      {!farmAiConfigured && (
        <div className="flex-shrink-0 flex items-center gap-2 bg-blue-50 border-b border-blue-100 px-4 py-2.5 text-xs text-blue-700">
          <AlertCircle size={14} />
          <span>{t('chatNoKey')} —&nbsp;
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              Get free key
            </a>
            &nbsp;→ add to .env as VITE_GEMINI_API_KEY
          </span>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <UserBubble key={msg.id} msg={msg} />
          ) : (
            <AiBubble key={msg.id} msg={msg} />
          )
        )}

        {/* Suggestion chips — only on empty/welcome state */}
        {showSuggestions && !loading && (
          <SuggestionChips onSelect={sendMessage} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Bar ── */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3"
      >
        {/* Voice button */}
        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          className={`flex-shrink-0 rounded-2xl p-3 transition-all active:scale-90 ${
            listening
              ? 'bg-red-100 text-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
          }`}
        >
          {listening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('chatPlaceholder')}
            className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:bg-white min-h-[46px] max-h-[120px]"
            style={{ overflow: 'hidden' }}
          />
          {listening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {lang === 'kn' ? 'ಕೇಳುತ್ತಿದೆ' : 'Listening'}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!canSend}
          className="flex-shrink-0 rounded-2xl bg-emerald-600 p-3 text-white shadow-md shadow-emerald-600/25 transition-all active:scale-90 hover:bg-emerald-700 disabled:opacity-40 disabled:active:scale-100"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
}
export default FarmChatScreen;
