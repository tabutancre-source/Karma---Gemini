import React, { useState } from 'react';
import { KarmaUser } from '../types/karma';
import { haptics } from '../utils/haptics';
import { Share2, Download, Copy, Check } from 'lucide-react';

interface SocialStoryCardModalProps {
  users: KarmaUser[];
  onClose: () => void;
}

export const SocialStoryCardModal: React.FC<SocialStoryCardModalProps> = ({ users, onClose }) => {
  const [theme, setTheme] = useState<'scroccone' | 'santo' | 'ruota'>('scroccone');
  const [copied, setCopied] = useState(false);

  // Find lowest karma (with debt) and highest karma
  const sorted = [...users].sort((a, b) => a.karmaPoints - b.karmaPoints);
  const lowestUser = sorted[0] || users[0];
  const highestUser = [...users].sort((a, b) => b.karmaPoints - a.karmaPoints)[0] || users[0];

  const targetUser = theme === 'santo' ? highestUser : lowestUser;

  const handleShare = async () => {
    haptics.playTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Karma Status: ${targetUser.name}`,
          text: theme === 'santo'
            ? `🏆 ${targetUser.name} è il Santo ufficiale del gruppo con ${targetUser.karmaPoints} Punti Karma su Karma App!`
            : `👀 ${targetUser.name} è stato eletto Scroccone della Settimana su Karma App. Urge riscatto!`,
          url: window.location.href,
        });
        return;
      } catch {}
    }

    // Fallback: copy text
    const text = `🏆 Karma Status: ${targetUser.name} (${targetUser.karmaPoints} pts) - Karma App: Split Payment & Social Gamification`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="apple-glass rounded-3xl p-6 max-w-sm w-full border border-white shadow-2xl my-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900">
            Card per Storie Instagram
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Theme Picker */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTheme('scroccone')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              theme === 'scroccone' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Scroccone
          </button>
          <button
            type="button"
            onClick={() => setTheme('santo')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              theme === 'santo' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Santo
          </button>
          <button
            type="button"
            onClick={() => setTheme('ruota')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              theme === 'ruota' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Ruota
          </button>
        </div>

        {/* 9:16 Instagram Story Preview Frame */}
        <div className="relative aspect-[9/16] w-full rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col justify-between text-center select-none bg-gradient-to-b from-[#1C1C1E] via-[#2C2C2E] to-[#1C1C1E] border border-white/10">
          {/* Subtle Ambient Glowing Orbs */}
          {theme === 'santo' ? (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
          ) : (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />
          )}

          {/* Top Karma Brand Wordmark */}
          <div className="relative z-10 flex items-center justify-between text-white/80 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-orange-500 to-rose-500 flex items-center justify-center text-[10px] text-white">
                ☯
              </span>
              <span>KARMA</span>
            </div>
            <span className="text-[10px] tracking-wider uppercase text-white/50">Gruppo Ufficiale</span>
          </div>

          {/* Middle Story Content */}
          <div className="relative z-10 my-auto py-4">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase mb-4 bg-white/10 backdrop-blur-md text-white border border-white/15">
              {theme === 'santo'
                ? '⭐ SANTO DEL MESE ⭐'
                : theme === 'ruota'
                ? '🎲 ESTRATTO DALLA RUOTA'
                : '🚨 SCROCCONE DELLA SETTIMANA 🚨'}
            </div>

            {/* Avatar */}
            <div className="mx-auto w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-orange-400 via-rose-500 to-amber-400 shadow-xl mb-3 flex items-center justify-center">
              <div className="w-full h-full bg-white/90 rounded-2xl flex items-center justify-center text-4xl">
                {targetUser.avatarEmoji}
              </div>
            </div>

            <h4 className="text-2xl font-black text-white tracking-tight">
              {targetUser.name}
            </h4>
            <div className="text-sm font-mono font-bold text-orange-400 mt-0.5">
              {targetUser.karmaPoints} Punti Karma
            </div>

            <p className="text-xs text-white/70 italic mt-3 max-w-[220px] mx-auto leading-relaxed">
              {theme === 'santo'
                ? '"Ha offerto più cene lui che la Caritas locale. Eroe nazionale."'
                : theme === 'ruota'
                ? '"Il destino ha parlato: stasera paga lui per tutti. Senza pietà."'
                : '"Ha sviluppato l\'invisibilità al momento del POS. Urge riscatto immediato."'}
            </p>
          </div>

          {/* Bottom Sticker Call to Action */}
          <div className="relative z-10 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-white/80">
            Split Payment &amp; Social Gamification
          </div>
        </div>

        {/* Share & Download Actions */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiato!' : 'Condividi Storia'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
