import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, Share2, PlusSquare, Send, Check, ShieldCheck } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface PWAInstallBannerProps {
  onTestNotification: () => void;
  telegramLinked: boolean;
  onToggleTelegram: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onTestNotification,
  telegramLinked,
  onToggleTelegram,
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    // Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (typeof Notification !== 'undefined') {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestPushPermission = async () => {
    haptics.playTap();
    if (typeof Notification === 'undefined') {
      alert('Le notifiche push non sono supportate in questo browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        onTestNotification();
      }
    } catch {}
  };

  if (dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 border-b border-orange-200/50 py-2.5 px-4">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Info */}
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold">Karma su iPhone (PWA): </span>
            <span className="text-slate-600 hidden sm:inline">
              {isStandalone
                ? 'App installata sulla Home. Notifiche attive!'
                : 'Aggiungi alla Home per ricevere le push del Condono su iOS.'}
            </span>
            <span className="text-slate-600 sm:hidden">
              {isStandalone ? 'App installata!' : 'Installa su Home per le push.'}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isStandalone && (
            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                setShowIOSModal(true);
              }}
              className="py-1 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3 h-3 text-orange-500" />
              <span>Aggiungi a Home</span>
            </button>
          )}

          {notificationPermission !== 'granted' ? (
            <button
              type="button"
              onClick={requestPushPermission}
              className="py-1 px-2.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3 h-3" />
              <span>Attiva Push (Tap)</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <Check className="w-3 h-3" />
              <span>Push OK</span>
            </div>
          )}

          {/* Telegram Fallback Link */}
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              onToggleTelegram();
            }}
            className={`py-1 px-2.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              telegramLinked
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title="Piano B per iPhone: Notifiche istantanee via Bot Telegram"
          >
            <Send className="w-3 h-3 text-sky-500" />
            <span className="hidden md:inline">Bot Telegram</span>
            {telegramLinked && <Check className="w-3 h-3 text-sky-600" />}
          </button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-600 px-1 py-0.5 text-xs cursor-pointer"
            aria-label="Chiudi banner"
          >
            ✕
          </button>
        </div>
      </div>

      {/* iOS Safari Onboarding Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
          <div className="apple-glass rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-white shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center text-2xl mx-auto mb-3 shadow-md">
              ☯
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center">
              Installa Karma su iPhone
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1 mb-5 leading-relaxed">
              Apple permette le notifiche push web su iOS solo per i siti salvati sulla schermata Home. Bastano 2 tocchi:
            </p>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-800 shrink-0 mt-0.5">
                  <Share2 className="w-4 h-4 text-sky-500" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">1. Tocca &quot;Condividi&quot;</div>
                  <div className="text-slate-500 mt-0.5">Nella barra inferiore di Safari su iPhone (icona quadrato con freccia).</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-white shadow-xs flex items-center justify-center text-slate-800 shrink-0 mt-0.5">
                  <PlusSquare className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">2. &quot;Aggiungi alla schermata Home&quot;</div>
                  <div className="text-slate-500 mt-0.5">Scorri leggermente il menu e tocca Aggiungi.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="w-7 h-7 rounded-xl bg-white shadow-xs flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-emerald-900">3. Apri da Home &amp; Tocca Notifiche</div>
                  <div className="text-emerald-700 mt-0.5">Si apre a schermo intero come vera app nativa, con push istantanee per ogni Condono!</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
