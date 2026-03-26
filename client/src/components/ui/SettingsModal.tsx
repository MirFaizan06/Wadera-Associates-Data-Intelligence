import { useEffect, useRef, useState } from 'react';
import { X, Globe, DollarSign, Check, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { useCurrency, SUPPORTED_CURRENCIES } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

// ── Flag image helper ─────────────────────────────────────────────────────────
// Uses flagcdn.com for reliable cross-platform flag images (no emoji issues)
function Flag({ code, size = 20 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/${Math.round(size * 1.33)}x${size}/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/${Math.round(size * 2.66)}x${size * 2}/${code.toLowerCase()}.png 2x`}
      width={Math.round(size * 1.33)}
      height={size}
      alt=""
      aria-hidden
      className="rounded-sm object-cover shrink-0"
      style={{ width: Math.round(size * 1.33), height: size }}
      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
}

// ── Language → ISO country code map ─────────────────────────────────────────
const LANGUAGE_FLAG_CODES: Record<string, string> = {
  en: 'gb',
  zh: 'cn',
  es: 'es',
  de: 'de',
  fr: 'fr',
  pt: 'br',
  ru: 'ru',
  ja: 'jp',
  ar: 'sa',
  hi: 'in',
  ko: 'kr',
  id: 'id',
};

// ── Currency metadata ────────────────────────────────────────────────────────
const CURRENCY_META: Record<string, { flagCode: string; label: string }> = {
  INR: { flagCode: 'in', label: 'Indian Rupee' },
  USD: { flagCode: 'us', label: 'US Dollar' },
  EUR: { flagCode: 'eu', label: 'Euro' },
  GBP: { flagCode: 'gb', label: 'British Pound' },
  PKR: { flagCode: 'pk', label: 'Pakistani Rupee' },
  SAR: { flagCode: 'sa', label: 'Saudi Riyal' },
  AED: { flagCode: 'ae', label: 'UAE Dirham' },
  JPY: { flagCode: 'jp', label: 'Japanese Yen' },
};

// ─────────────────────────────────────────────────────────────────────────────
// First-visit tooltip
// ─────────────────────────────────────────────────────────────────────────────
const TOOLTIP_STORAGE_KEY = 'wa_settings_tooltip_shown';

interface TooltipProps {
  targetRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function SettingsTooltip({ targetRef, onClose }: TooltipProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade in after 1.5 s, auto-close after 5 s
  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 1500);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400); // wait for fade-out
    }, 6500);
    return () => {
      clearTimeout(showTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose]);

  const handleClose = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(onClose, 400);
  };

  // Position tooltip below/near the target button
  const [pos, setPos] = useState({ top: 0, right: 0 });
  useEffect(() => {
    if (targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [targetRef]);

  return (
    <div
      className={cn(
        'fixed z-[9999] transition-all duration-400',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      )}
      style={{ top: pos.top, right: pos.right }}
      role="tooltip"
    >
      <div className="bg-brand-navy text-white text-sm rounded-xl shadow-xl px-4 py-3 max-w-[260px] relative">
        {/* Arrow */}
        <div className="absolute -top-2 right-3 w-4 h-2 overflow-hidden">
          <div className="w-3 h-3 bg-brand-navy rotate-45 translate-y-1 translate-x-0.5" />
        </div>
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
          aria-label="Close tooltip"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <p className="font-semibold mb-1 pr-4">{t('settings.tooltipTitle')}</p>
        <p className="text-white/75 text-xs leading-relaxed">{t('settings.tooltipBody')}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings modal
// ─────────────────────────────────────────────────────────────────────────────
interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { currency, setCurrency } = useCurrency();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title')}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Settings className="h-4 w-4 text-brand-blue" aria-hidden />
            </div>
            <h2 className="text-base font-bold text-gray-900">{t('settings.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label={t('settings.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* ── Language section ──────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-brand-blue" aria-hidden />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t('settings.languageTitle')}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">{t('settings.languageHint')}</p>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map(lang => {
                const isActive = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all',
                      isActive
                        ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <Flag code={LANGUAGE_FLAG_CODES[lang.code] ?? 'un'} size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{lang.name}</p>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-brand-blue" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Currency section ──────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-brand-blue" aria-hidden />
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t('settings.currencyTitle')}
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">{t('settings.currencyHint')}</p>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_CURRENCIES.map(code => {
                const meta = CURRENCY_META[code] ?? { flagCode: 'un', label: code };
                const isActive = currency === code;
                return (
                  <button
                    key={code}
                    onClick={() => setCurrency(code)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all',
                      isActive
                        ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <Flag code={meta.flagCode} size={18} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{code}</p>
                      <p className="text-[10px] text-gray-400 truncate">{meta.label}</p>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-brand-blue" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-brand-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            {t('settings.doneBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: manages first-visit tooltip state
// ─────────────────────────────────────────────────────────────────────────────
export function useFirstVisitTooltip() {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(TOOLTIP_STORAGE_KEY)) {
      setShowTooltip(true);
      localStorage.setItem(TOOLTIP_STORAGE_KEY, '1');
    }
  }, []);

  return { showTooltip, closeTooltip: () => setShowTooltip(false) };
}
