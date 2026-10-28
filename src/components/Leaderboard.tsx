import React, { useState } from 'react';
import { KarmaUser } from '../types/karma';
import { getKarmaStatus } from '../utils/karmaLogic';
import { haptics } from '../utils/haptics';
import { SocialStoryCardModal } from './SocialStoryCardModal';
import { Trophy, Coffee, Flame, Crown, Shield, ShieldOff, Share2, Calendar, RotateCcw } from 'lucide-react';

interface LeaderboardProps {
  users: KarmaUser[];
  onOfferCoffee: (giverId: string, receiverId: string) => void;
  onToggleImmunity: (userId: string) => void;
  onResetSeason: () => void;
  currentUserId: string;
  seasonName: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  users,
  onOfferCoffee,
  onToggleImmunity,
  onResetSeason,
  currentUserId,
  seasonName,
}) => {
  const [selectedUserForCoffee, setSelectedUserForCoffee] = useState<KarmaUser | null>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showSeasonResetConfirm, setShowSeasonResetConfirm] = useState(false);

  const sortedUsers = [...users].sort((a, b) => b.karmaPoints - a.karmaPoints);

  const handleCoffeeGift = (receiver: KarmaUser) => {
    haptics.playTap();
    onOfferCoffee(currentUserId, receiver.id);
    setSelectedUserForCoffee(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header Intro */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-amber-100">
          <Trophy className="w-3.5 h-3.5" />
          The Status Board · Gruppo Privato
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Karma Leaderboard
        </h1>
        <p className="mt-2 text-slate-500 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          Classifica sociale basata su generosità e affidabilità. Con immunità per chi è in pausa e reset a stagioni per non lasciare nessuno &quot;scroccone a vita&quot;.
        </p>
      </div>

      {/* Season Bar & Story Card Sharing Actions */}
      <div className="apple-glass-card rounded-2xl p-3.5 sm:p-4 mb-6 border border-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900">{seasonName}</span>
            <span className="text-slate-500 hidden sm:inline"> · Saldi e Karma calcolati per il gruppo</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              setShowStoryModal(true);
            }}
            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Card Instagram</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              setShowSeasonResetConfirm(true);
            }}
            className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Nuova stagione: resetta i punteggi per ricominciare"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">Nuova Stagione</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {sortedUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 items-end max-w-2xl mx-auto pt-6">
          {/* #2 Rank */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-tr ${sortedUsers[1].avatarBg} shadow-md ring-2 ring-orange-300 ring-offset-2`}
              >
                {sortedUsers[1].avatarEmoji}
              </div>
              <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-700 shadow-2xs">
                2
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 truncate max-w-[90px] text-center">
              {sortedUsers[1].name}
            </div>
            <div className="text-[11px] font-mono text-orange-600 font-bold">
              {sortedUsers[1].karmaPoints} pts
            </div>
            <div className="w-full h-20 bg-gradient-to-t from-orange-100/70 to-orange-50/20 rounded-t-2xl mt-2 flex items-center justify-center text-xs font-bold text-orange-400">
              #2
            </div>
          </div>

          {/* #1 Rank (Center, Highest) */}
          <div className="flex flex-col items-center -mt-6">
            <Crown className="w-6 h-6 text-amber-500 mb-1 animate-bounce" />
            <div className="relative mb-2">
              <div
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-3xl bg-gradient-to-tr ${sortedUsers[0].avatarBg} shadow-xl ring-4 ring-amber-400 ring-offset-2 animate-pulse`}
              >
                {sortedUsers[0].avatarEmoji}
              </div>
              <span className="absolute -top-2 -right-1 w-7 h-7 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs font-black text-amber-950 shadow-2xs">
                1
              </span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 truncate max-w-[110px] text-center">
              {sortedUsers[0].name}
            </div>
            <div className="text-xs font-mono text-amber-600 font-black">
              {sortedUsers[0].karmaPoints} pts
            </div>
            <div className="w-full h-28 bg-gradient-to-t from-amber-200/80 to-amber-50/30 rounded-t-2xl mt-2 flex flex-col items-center justify-center text-xs font-bold text-amber-700 shadow-2xs">
              <span className="text-base font-black">#1</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold">Santo</span>
            </div>
          </div>

          {/* #3 Rank */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-tr ${sortedUsers[2].avatarBg} shadow-md ring-2 ring-emerald-300 ring-offset-2`}
              >
                {sortedUsers[2].avatarEmoji}
              </div>
              <span className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-800 shadow-2xs">
                3
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 truncate max-w-[90px] text-center">
              {sortedUsers[2].name}
            </div>
            <div className="text-[11px] font-mono text-emerald-600 font-bold">
              {sortedUsers[2].karmaPoints} pts
            </div>
            <div className="w-full h-16 bg-gradient-to-t from-emerald-100/60 to-emerald-50/20 rounded-t-2xl mt-2 flex items-center justify-center text-xs font-bold text-emerald-500">
              #3
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="space-y-3">
        {sortedUsers.map((user, index) => {
          const status = getKarmaStatus(user.karmaPoints, {
            hasImmunity: user.hasImmunity,
            unpaidDebt: 12,
            oldestDebtDays: 16,
          });
          const isCurrentUser = user.id === currentUserId;

          return (
            <div
              key={user.id}
              className={`apple-glass-card rounded-3xl p-4 sm:p-5 border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isCurrentUser
                  ? 'border-orange-200/90 shadow-md bg-white/90'
                  : 'border-white/80'
              }`}
            >
              {/* Left Zone: Rank, Avatar, Titles */}
              <div className="flex items-center gap-3.5 flex-1">
                <span className="text-sm font-extrabold font-mono text-slate-400 w-5 text-center">
                  #{index + 1}
                </span>

                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-gradient-to-tr ${user.avatarBg} transition-all duration-300 ${
                      status.isBlurred
                        ? 'blur-[2px] opacity-60 hover:blur-none hover:opacity-100'
                        : status.avatarRingClass
                    }`}
                  >
                    {user.avatarEmoji}
                  </div>
                  {isCurrentUser && (
                    <span className="absolute -bottom-1 -left-1 text-[9px] bg-slate-900 text-white font-bold px-1 rounded-full">
                      Tu
                    </span>
                  )}
                  {user.hasImmunity && (
                    <span className="absolute -top-1 -left-1 text-[10px] bg-indigo-600 text-white font-bold p-0.5 rounded-full shadow-2xs">
                      🛡️
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {user.name}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${status.badgeColor}`}
                    >
                      {status.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">
                    &quot;{status.dryRemark}&quot;
                  </p>
                </div>
              </div>

              {/* Right Zone: Score & Immunity Toggle / Coffee */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-right">
                  <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tabular-nums flex items-center gap-1 sm:justify-end">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span>{user.karmaPoints}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">pts</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Offerti: €{user.totalOffered.toFixed(1)} · Condonati: €{user.totalForgiven.toFixed(1)}
                  </div>
                </div>

                {/* Immunity Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    haptics.playTap();
                    onToggleImmunity(user.id);
                  }}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    user.hasImmunity
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
                  title={user.hasImmunity ? 'Disattiva immunità' : 'Attiva immunità (protegge da sfocatura)'}
                >
                  {user.hasImmunity ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{user.hasImmunity ? 'Immune' : 'Proteggi'}</span>
                </button>

                {/* Coffee gift action */}
                {!isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      haptics.playTap();
                      setSelectedUserForCoffee(user);
                    }}
                    className="py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-orange-200/50 cursor-pointer"
                    title={`Offri un caffè a ${user.name} (+50 Karma)`}
                  >
                    <Coffee className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Offri Caffè</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Coffee Gift Modal */}
      {selectedUserForCoffee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
          <div className="apple-glass rounded-3xl p-6 max-w-sm w-full border border-white shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mx-auto mb-3">
              ☕
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Offri un caffè a {selectedUserForCoffee.name}?
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Un gesto disinteressato. Regala +50 Karma a {selectedUserForCoffee.name} per aiutarlo a salire nella classifica del gruppo.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserForCoffee(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleCoffeeGift(selectedUserForCoffee)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Offri Ora (+50 pts)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Season Reset Confirmation Modal */}
      {showSeasonResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
          <div className="apple-glass rounded-3xl p-6 max-w-sm w-full border border-white shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl mx-auto mb-3">
              🔄
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Iniziare una Nuova Stagione?
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Tutti i punti Karma ripartono da una base equilibrata. Così nessuno rimane &quot;scroccone a vita&quot; e la sfida ricomincia pulita.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSeasonResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.playTap();
                  onResetSeason();
                  setShowSeasonResetConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors cursor-pointer"
              >
                Ricomincia Stagione
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instagram Story Card Modal */}
      {showStoryModal && (
        <SocialStoryCardModal
          users={users}
          onClose={() => setShowStoryModal(false)}
        />
      )}
    </div>
  );
};
