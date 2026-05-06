import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ArrowRight, ExternalLink, Repeat } from 'lucide-react';
import clsx from 'clsx';
import {
  answerQuestion,
  AssistantPersona,
  PERSONAS,
  SUGGESTED_QUESTIONS,
  AssistantResponse,
  DataRef,
  detectGenZTrigger,
  genZifyResponse,
} from '../lib/assistantEngine';
import { useSettings } from '../hooks/useSettings';

const REF_TYPE_STYLES: Record<DataRef['type'], { color: string; emoji: string }> = {
  community:  { color: 'bg-blue-50 text-blue-700 border-blue-200',         emoji: '👥' },
  event:      { color: 'bg-violet-50 text-violet-700 border-violet-200',   emoji: '📅' },
  meetup:     { color: 'bg-teal-50 text-teal-700 border-teal-200',         emoji: '⚡' },
  speaker:    { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', emoji: '🎤' },
  video:      { color: 'bg-orange-50 text-orange-700 border-orange-200',   emoji: '🎬' },
  topic:      { color: 'bg-orange-50 text-orange-700 border-orange-200',   emoji: '🔥' },
  github:     { color: 'bg-slate-100 text-slate-700 border-slate-300',     emoji: '🐙' },
  influencer: { color: 'bg-rose-50 text-rose-700 border-rose-200',         emoji: '⭐' },
  discord:    { color: 'bg-indigo-50 text-indigo-700 border-indigo-200',   emoji: '💬' },
  podcast:    { color: 'bg-pink-50 text-pink-700 border-pink-200',         emoji: '🎙' },
};

interface QAExchange {
  id: string;
  question: string;
  persona: AssistantPersona;
  response: AssistantResponse;          // original
  genZResponse: AssistantResponse;      // Gen Z translated
  showAsGenZ: boolean;                  // current display mode
}

function DataRefCard({ ref }: { ref: DataRef }) {
  const style = REF_TYPE_STYLES[ref.type];
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={clsx('text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-wide', style.color)}>
            {style.emoji} {ref.type}
          </span>
          {ref.meta && <span className="text-[10px] text-gray-400 font-medium">{ref.meta}</span>}
        </div>
        {ref.href && (
          <a href={ref.href} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500 flex-shrink-0">
            <ExternalLink size={10} />
          </a>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-900 leading-tight">{ref.label}</p>
      <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{ref.sub}</p>
    </div>
  );
}

function AnswerBlock({
  exchange,
  onToggleTranslate,
}: {
  exchange: QAExchange;
  onToggleTranslate: (id: string) => void;
}) {
  const personaInfo = PERSONAS.find(p => p.id === exchange.persona)!;
  const displayResp = exchange.showAsGenZ ? exchange.genZResponse : exchange.response;
  // Render the answer with bold for **markdown**
  const answerHtml = displayResp.answer.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith('**') && chunk.endsWith('**')
      ? <strong key={i} className="text-gray-900">{chunk.slice(2, -2)}</strong>
      : <span key={i}>{chunk}</span>
  );

  return (
    <div className="space-y-3">
      {/* User question */}
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white text-sm px-3.5 py-2 rounded-2xl rounded-br-md max-w-[85%] leading-relaxed">
          <span className="text-[10px] opacity-70 block mb-0.5">{personaInfo.emoji} {personaInfo.label}</span>
          {exchange.question}
        </div>
      </div>

      {/* Assistant answer */}
      <div className="flex gap-2">
        <div className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          exchange.showAsGenZ
            ? 'bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600'
            : 'bg-gradient-to-br from-violet-500 to-blue-600'
        )}>
          <Sparkles size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Mode chip + translate button */}
          <div className="flex items-center justify-between gap-2 px-1">
            {exchange.showAsGenZ ? (
              <span className="text-[10px] font-bold text-pink-600 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded">
                ✨ Gen Z mode · slay
              </span>
            ) : (
              <span className="text-[10px] font-medium text-gray-400">Standard response</span>
            )}
            <button
              onClick={() => onToggleTranslate(exchange.id)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 hover:text-violet-600 transition-colors group"
            >
              <Repeat size={10} className="group-hover:rotate-180 transition-transform duration-300" />
              {exchange.showAsGenZ ? 'Translate to standard' : 'Translate to Gen Z ✨'}
            </button>
          </div>

          {/* Answer text */}
          <div className={clsx(
            'rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line border',
            exchange.showAsGenZ
              ? 'bg-gradient-to-br from-pink-50 to-violet-50 border-pink-200 text-gray-800'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          )}>
            {answerHtml}
          </div>

          {/* Data references — same data, just labeled */}
          {displayResp.dataReferences.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                {exchange.showAsGenZ ? 'The receipts (from the dashboard)' : 'From the dashboard'}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {displayResp.dataReferences.map((ref, i) => (
                  <DataRefCard key={i} ref={ref} />
                ))}
              </div>
            </div>
          )}

          {/* Recommended actions */}
          {displayResp.recommendedActions.length > 0 && (
            <div className={clsx(
              'rounded-xl p-3 border',
              exchange.showAsGenZ
                ? 'bg-fuchsia-50 border-fuchsia-200'
                : 'bg-emerald-50 border-emerald-200'
            )}>
              <p className={clsx(
                'text-[10px] font-bold uppercase tracking-wider mb-1.5',
                exchange.showAsGenZ ? 'text-fuchsia-700' : 'text-emerald-700'
              )}>
                {exchange.showAsGenZ ? '✨ The plays bestie' : '▶ Recommended actions'}
              </p>
              <ul className="space-y-1.5">
                {displayResp.recommendedActions.map((a, i) => (
                  <li key={i} className={clsx(
                    'text-xs leading-relaxed flex gap-1.5',
                    exchange.showAsGenZ ? 'text-fuchsia-900' : 'text-emerald-900'
                  )}>
                    <span className={clsx(
                      'font-bold flex-shrink-0',
                      exchange.showAsGenZ ? 'text-fuchsia-500' : 'text-emerald-500'
                    )}>{i + 1}.</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {displayResp.tabHint && (
            <p className="text-[11px] text-gray-400 px-1 italic">
              💡 Tip: open the <strong className="text-gray-600">{displayResp.tabHint}</strong> tab for the full picture.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AskAssistant() {
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);
  const [persona, setPersona] = useState<AssistantPersona>('campaign-marketing');
  const [input, setInput] = useState('');
  const [exchanges, setExchanges] = useState<QAExchange[]>([]);
  const [sparkleTaps, setSparkleTaps] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Gen Z mode is now global — read from settings
  const genZModeUnlocked = settings.genZUnlocked;
  const defaultGenZ = settings.genZMode;
  const setDefaultGenZ = (val: boolean) => update({ genZMode: val, genZUnlocked: true });
  const setGenZModeUnlocked = (val: boolean) => update({ genZUnlocked: val });

  // Listen for ⌘/ shortcut from App
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-ask-hub', handler);
    return () => window.removeEventListener('open-ask-hub', handler);
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [exchanges, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Sparkle-icon tap: 5 taps within 3 seconds unlocks Gen Z mode
  useEffect(() => {
    if (sparkleTaps >= 5) {
      setGenZModeUnlocked(true);
      setDefaultGenZ(true);
      setSparkleTaps(0);
    }
    const t = setTimeout(() => setSparkleTaps(0), 3000);
    return () => clearTimeout(t);
  }, [sparkleTaps]);

  const submit = (q?: string) => {
    const question = (q ?? input).trim();
    if (!question) return;
    const triggered = detectGenZTrigger(question);
    const response = answerQuestion(question, persona);
    const genZResponse = genZifyResponse(response);
    if (triggered) {
      setGenZModeUnlocked(true);
      setDefaultGenZ(true);
    }
    const showAsGenZ = triggered || defaultGenZ;
    setExchanges(prev => [...prev, {
      id: `${Date.now()}`,
      question,
      persona,
      response,
      genZResponse,
      showAsGenZ,
    }]);
    setInput('');
  };

  const toggleTranslate = (id: string) => {
    setGenZModeUnlocked(true);
    setExchanges(prev => prev.map(ex =>
      ex.id === id ? { ...ex, showAsGenZ: !ex.showAsGenZ } : ex
    ));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const personaInfo = PERSONAS.find(p => p.id === persona)!;
  const suggestions = SUGGESTED_QUESTIONS[persona];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          aria-label="Open Ask the Hub"
        >
          <Sparkles size={16} />
          <span className="text-sm font-semibold">Ask the Hub</span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] max-w-full bg-white shadow-2xl border-l border-gray-200 flex flex-col">
            {/* Header */}
            <div className={clsx(
              'px-4 py-3 flex items-center gap-2 flex-shrink-0 transition-all',
              defaultGenZ
                ? 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600'
                : 'bg-gradient-to-r from-violet-600 to-blue-600'
            )}>
              <button
                onClick={() => setSparkleTaps(t => t + 1)}
                title={genZModeUnlocked ? '✨ secret mode unlocked' : 'tap me a few times…'}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur hover:bg-white/30 transition-all active:scale-90"
              >
                <Sparkles size={15} className={clsx('text-white', defaultGenZ && 'animate-pulse')} />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Ask the Hub
                  {defaultGenZ && <span className="text-[9px] font-semibold bg-white/30 px-1.5 py-0.5 rounded backdrop-blur">slay mode ✨</span>}
                </h2>
                <p className="text-[11px] text-white/80">
                  {defaultGenZ
                    ? 'Serving recs in Gen Z (no cap)'
                    : 'Synthesizes answers from your dashboard data'}
                </p>
              </div>
              {genZModeUnlocked && (
                <button
                  onClick={() => setDefaultGenZ(!defaultGenZ)}
                  title={defaultGenZ ? 'Switch to standard' : 'Switch to Gen Z'}
                  className="text-white/90 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors text-xs font-semibold"
                >
                  {defaultGenZ ? '📋 pro' : '✨ slay'}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Persona selector */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">I am a…</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PERSONAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-left',
                      persona === p.id
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    )}
                  >
                    <span>{p.emoji}</span>
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 italic">Focus: {personaInfo.focus}</p>
            </div>

            {/* Conversation */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {exchanges.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-violet-500 to-blue-600 rounded-full flex items-center justify-center mb-2">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <p className="text-sm font-bold text-gray-700">Ask anything about your product</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      I'll pull from communities, events, influencers, GitHub, and topics to give you tailored {personaInfo.label.toLowerCase()} recommendations.
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Try a question</p>
                    <div className="space-y-1.5">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => submit(s)}
                          className="w-full text-left text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 transition-all flex items-center gap-2 group"
                        >
                          <span className="flex-1">{s}</span>
                          <ArrowRight size={11} className="opacity-30 group-hover:opacity-100 group-hover:text-violet-500 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                exchanges.map(ex => (
                  <AnswerBlock key={ex.id} exchange={ex} onToggleTranslate={toggleTranslate} />
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3 flex-shrink-0 bg-white">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  rows={2}
                  placeholder={`Ask about your product as a ${personaInfo.label}…`}
                  className="w-full px-3 py-2 pr-11 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={() => submit()}
                  disabled={!input.trim()}
                  className={clsx(
                    'absolute right-2 bottom-2 p-2 rounded-lg transition-all',
                    input.trim()
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  )}
                >
                  <Send size={13} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 px-1">
                Synthesizes from {280}+ data points across the dashboard. Press Enter to send · Shift+Enter for new line.
                {!genZModeUnlocked && <span className="opacity-30"> · psst, there&apos;s a hidden mode somewhere ✨</span>}
              </p>
              {exchanges.length > 0 && (
                <button
                  onClick={() => setExchanges([])}
                  className="text-[10px] text-gray-400 hover:text-red-500 mt-1 underline"
                >
                  Clear conversation
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating button — also visible in drawer-bg as a mobile trigger */}
      <MessageCircle className="hidden" />
    </>
  );
}
