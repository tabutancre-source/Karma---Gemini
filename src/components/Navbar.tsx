import React from 'react';
import { Volume2, VolumeX, Sparkles, HeartHandshake, Trophy, Bell, Gift, Database } from 'lucide-react';
import { haptics } from '../utils/haptics';

export type NavTab = 'wheel' | 'forgive' | 'leaderboard' | 'favors' | 'notifications';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  unseenCount?: number;
  onOpenLedger: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  soundEnabled,
  onToggleSound,
  unseenCount = 0,
  onOpenLedger,
}) => {
  return (
    <>
      <header className="sticky top-0 z-40 w-full apple-glass border-b border-slate-200/60 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              onTabChange('wheel');
            }}
            className="text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 via-rose-500 to-amber-500 flex items-center justify-center text-white text-base shadow-sm">
              ☯
            </span>
            <span>Karma</span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                onTabChange('wheel');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'wheel'
                  ? 'text-orange-600 border-b-2 border-orange-500 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Ruota</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                onTabChange('forgive');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'forgive'
                  ? 'text-rose-600 border-b-2 border-rose-500 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Il Condono</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                onTabChange('leaderboard');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'leaderboard'
                  ? 'text-amber-600 border-b-2 border-amber-500 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Classifica</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                onTabChange('favors');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'favors'
                  ? 'text-amber-700 border-b-2 border-amber-600 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Favori</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                onTabChange('notifications');
              }}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 relative ${
                currentTab === 'notifications'
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifiche</span>
              {unseenCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          </nav>

          {/* Zone 3: Actions (Ledger & Audio Haptics) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptics.playTap();
                onOpenLedger();
              }}
              className="py-1.5 px-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Apri registro immutabile append-only"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Registro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleSound();
                if (!soundEnabled) haptics.playTap();
              }}
              className="p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
              title={soundEnabled ? 'Disattiva feedback aptico' : 'Attiva feedback aptico'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-orange-500" />
                  <span className="hidden sm:inline">Audio Aptico</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Muto</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Standalone Mobile Bottom Tab Bar (mounted outside header to avoid iOS sticky context issues) */}
      <nav
        aria-label="Navigazione principale mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 grid grid-cols-5 items-center h-16 px-1 shadow-lg"
      >
        <button
          type="button"
          onClick={() => {
            haptics.playTap();
            onTabChange('wheel');
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            currentTab === 'wheel' ? 'text-orange-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Ruota</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.playTap();
            onTabChange('forgive');
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            currentTab === 'forgive' ? 'text-rose-600 font-bold' : 'text-slate-500'
          }`}
        >
          <HeartHandshake className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Condono</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.playTap();
            onTabChange('leaderboard');
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            currentTab === 'leaderboard' ? 'text-amber-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Status</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.playTap();
            onTabChange('favors');
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer ${
            currentTab === 'favors' ? 'text-amber-700 font-bold' : 'text-slate-500'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Favori</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.playTap();
            onTabChange('notifications');
          }}
          className={`flex flex-col items-center justify-center h-full relative cursor-pointer ${
            currentTab === 'notifications' ? 'text-slate-900 font-bold' : 'text-slate-500'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Feed</span>
          {unseenCount > 0 && (
            <span className="absolute top-2.5 right-4 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
      </nav>
    </>
  );
};
