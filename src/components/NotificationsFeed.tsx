import React from 'react';
import { KarmaActivity, KarmaUser } from '../types/karma';
import { Sparkles, HeartHandshake, CheckCircle2, Coffee, MessageSquareDashed } from 'lucide-react';

interface NotificationsFeedProps {
  activities: KarmaActivity[];
  users: KarmaUser[];
}

export const NotificationsFeed: React.FC<NotificationsFeedProps> = ({ activities, users }) => {
  const getUser = (id?: string) =>
    users.find((u) => u.id === id) || {
      name: 'Qualcuno',
      avatarEmoji: '👤',
      avatarBg: 'from-slate-400 to-slate-500',
    };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-slate-200">
          <MessageSquareDashed className="w-3.5 h-3.5" />
          Zero Drammi
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Notifiche Nonchalant
        </h1>
        <p className="mt-2 text-slate-500 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          Il feed asciutto e privo di imbarazzi di ciò che accade nel gruppo. Quando qualcuno condona o paga, Karma lo dice senza giri di parole.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="apple-glass-card rounded-3xl p-12 text-center border border-white">
          <p className="text-xs text-slate-400">Nessuna notifica recente nel gruppo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => {
            const actor = getUser(act.actorId);
            return (
              <div
                key={act.id}
                className="apple-glass-card rounded-3xl p-4 sm:p-5 border border-white/80 flex items-start gap-3.5 hover:shadow-sm transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-gradient-to-tr ${actor.avatarBg} shrink-0 mt-0.5 shadow-xs`}
                >
                  {act.type === 'wheel' && <Sparkles className="w-4 h-4 text-white" />}
                  {act.type === 'forgiveness' && <HeartHandshake className="w-4 h-4 text-white" />}
                  {act.type === 'settle' && <CheckCircle2 className="w-4 h-4 text-white" />}
                  {act.type === 'coffee' && <Coffee className="w-4 h-4 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {actor.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {act.message}
                  </p>
                  {act.pointsEarned > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <span>+{act.pointsEarned} Punti Karma</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
