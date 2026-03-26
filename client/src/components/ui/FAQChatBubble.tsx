import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Maximize2, Minimize2, ChevronLeft, Bot, CornerDownLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  link: { label: string; href: string } | null;
}

type MsgRole = 'bot' | 'user';
interface Message {
  id: string;
  role: MsgRole;
  text: string;
  linkLabel?: string;
  linkHref?: string;
}

// Render **bold** markdown in answer text
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

const WELCOME_ID = '__welcome__';

export default function FAQChatBubble() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Load FAQ JSON
  useEffect(() => {
    fetch('/faq-data.json')
      .then(r => r.json())
      .then((data: FAQItem[]) => setFaqs(data))
      .catch(() => {});
  }, []);

  // Welcome message when panel opens
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: WELCOME_ID,
        role: 'bot',
        text: t('faq.welcome'),
      }]);
    }
  }, [open, messages.length, t]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleQuestion = (faq: FAQItem) => {
    setView('chat');
    const userMsg: Message = { id: `u-${faq.id}`, role: 'user', text: faq.question };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const botMsg: Message = {
        id: `b-${faq.id}-${Date.now()}`,
        role: 'bot',
        text: faq.answer,
        linkLabel: faq.link?.label,
        linkHref: faq.link?.href,
      };
      setMessages(prev => [...prev, botMsg]);
    }, 700);
  };

  const handleReset = () => {
    setView('list');
    setMessages([{
      id: WELCOME_ID,
      role: 'bot',
      text: t('faq.welcome'),
    }]);
  };

  const panelClass = cn(
    'fixed z-[9980] flex flex-col bg-white shadow-2xl transition-all duration-300',
    fullscreen
      ? 'inset-0 rounded-none'
      : [
          // Desktop: bottom-right floating panel
          'bottom-20 right-4 rounded-2xl border border-gray-200',
          'w-[360px] max-w-[calc(100vw-2rem)]',
          'h-[520px] max-h-[calc(100vh-6rem)]',
          // Mobile: bottom sheet
          'sm:bottom-20 sm:right-4',
        ].join(' ')
  );

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? t('faq.close') : t('faq.open')}
        className={cn(
          'fixed bottom-5 right-5 z-[9981] flex items-center justify-center',
          'w-13 h-13 rounded-full shadow-lg transition-all duration-300',
          'bg-brand-blue hover:bg-blue-700 text-white',
          open && 'rotate-0 scale-95'
        )}
        style={{ width: 52, height: 52 }}
      >
        {open
          ? <X className="h-5 w-5" aria-hidden />
          : <MessageCircle className="h-5 w-5" aria-hidden />}

        {/* Pulse ring on first render (only when closed) */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-brand-blue/40 animate-ping" aria-hidden />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className={panelClass}>
          {/* Panel header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-navy rounded-t-2xl shrink-0">
            <div className="bg-blue-700 p-1.5 rounded-full">
              <Bot className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{t('faq.title')}</p>
              <p className="text-xs text-blue-300">{t('faq.subtitle')}</p>
            </div>
            <div className="flex items-center gap-1">
              {/* Back to list (only in chat view) */}
              {view === 'chat' && (
                <button
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={t('faq.backToList')}
                  title={t('faq.backToList')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {/* Fullscreen toggle */}
              <button
                onClick={() => setFullscreen(f => !f)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={fullscreen ? t('faq.exitFullscreen') : t('faq.fullscreen')}
                title={fullscreen ? t('faq.exitFullscreen') : t('faq.fullscreen')}
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label={t('faq.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div
            ref={bodyRef}
            className="flex-1 overflow-y-auto overscroll-contain"
          >
            {view === 'list' ? (
              /* FAQ list view */
              <div className="p-3 space-y-1">
                {/* Welcome bubble */}
                <div className="flex items-start gap-2 mb-3">
                  <div className="bg-brand-navy p-1.5 rounded-full shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" aria-hidden />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-gray-700 max-w-[85%]">
                    {t('faq.welcome')}
                  </div>
                </div>
                <p className="text-xs text-gray-400 font-medium px-1 mb-2">{t('faq.pickQuestion')}</p>
                {faqs.map(faq => (
                  <button
                    key={faq.id}
                    onClick={() => handleQuestion(faq)}
                    className="w-full text-left text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 hover:border-brand-blue hover:bg-blue-50 text-gray-700 hover:text-brand-blue transition-colors flex items-center gap-2 group"
                  >
                    <CornerDownLeft className="h-3.5 w-3.5 text-gray-300 group-hover:text-brand-blue shrink-0 transition-colors" aria-hidden />
                    {faq.question}
                  </button>
                ))}
              </div>
            ) : (
              /* Chat conversation view */
              <div className="p-3 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex items-start gap-2',
                      msg.role === 'user' && 'flex-row-reverse'
                    )}
                  >
                    {msg.role === 'bot' && (
                      <div className="bg-brand-navy p-1.5 rounded-full shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-white" aria-hidden />
                      </div>
                    )}
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%]',
                        msg.role === 'bot'
                          ? 'bg-gray-100 text-gray-700 rounded-tl-sm'
                          : 'bg-brand-blue text-white rounded-tr-sm'
                      )}
                    >
                      {msg.role === 'bot' ? <RichText text={msg.text} /> : msg.text}
                      {msg.linkHref && msg.linkLabel && (
                        <div className="mt-2">
                          <Link
                            to={msg.linkHref}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue bg-white border border-brand-blue/30 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors"
                          >
                            {msg.linkLabel} →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div className="flex items-start gap-2">
                    <div className="bg-brand-navy p-1.5 rounded-full shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-white" aria-hidden />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <p className="text-center text-xs text-gray-400">{t('faq.footer')}</p>
          </div>
        </div>
      )}
    </>
  );
}
