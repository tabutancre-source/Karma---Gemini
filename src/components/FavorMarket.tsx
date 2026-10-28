import React, { useState } from 'react';
import { FavorCoupon, KarmaUser, Debt } from '../types/karma';
import { haptics } from '../utils/haptics';
import { Gift, CheckCircle2, Plus, Sparkles, Clock } from 'lucide-react';

interface FavorMarketProps {
  favors: FavorCoupon[];
  users: KarmaUser[];
  debts: Debt[];
  currentUserId: string;
  onRedeemFavor: (favorId: string) => void;
  onCreateFavor: (
    debtorId: string,
    creditorId: string,
    title: string,
    emoji: string,
    euroEquivalent: number,
    karmaValue: number
  ) => void;
}

export const FAVOR_TEMPLATES = [
  {
    title: 'Passaggio in macchina (salvataggio notturno)',
    emoji: '🚗',
    euroEquivalent: 5.0,
    karmaValue: 120,
    category: 'ride',
  },
  {
    title: 'Guidatore sobrio designato per la serata',
    emoji: '🍺',
    euroEquivalent: 6.0,
    karmaValue: 160,
    category: 'driver',
  },
  {
    title: 'Cena o carbonara cucinata a casa',
    emoji: '🍝',
    euroEquivalent: 8.5,
    karmaValue: 220,
    category: 'dinner',
  },
  {
    title: 'Aiuto montaggio mobile IKEA / trasloco',
    emoji: '📦',
    euroEquivalent: 12.0,
    karmaValue: 300,
    category: 'furniture',
  },
  {
    title: 'Offro il caffè al banco per una settimana',
    emoji: '☕',
    euroEquivalent: 7.0,
    karmaValue: 180,
    category: 'coffee',
  },
];

export const FavorMarket: React.FC<FavorMarketProps> = ({
  favors,
  users,
  debts,
  currentUserId,
  onRedeemFavor,
  onCreateFavor,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCreditorId, setSelectedCreditorId] = useState<string>(
    users.find((u) => u.id !== currentUserId)?.id || users[0]?.id || ''
  );
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(0);
  const [customTitle, setCustomTitle] = useState('');
  const [customAmount, setCustomAmount] = useState<number>(5.0);

  const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-10"

  // Check how many favors current user issued this month (max 3/month to prevent inflation)
  const myMonthlyFavorsCount = favors.filter(
    (f) => f.fromUserId === currentUserId && f.month === currentMonth
  ).length;

  const getUser = (id: string) =>
    users.find((u) => u.id === id) || {
      name: 'Amico',
      avatarEmoji: '👤',
      avatarBg: 'from-slate-400 to-slate-500',
    };

  // Find people the current user owes money to
  const myActiveDebts = debts.filter((d) => d.debtorId === currentUserId && !d.isSettled && !d.isForgiven);

  const handleIssueFavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (myMonthlyFavorsCount >= 3) {
      alert('Limite mensile raggiunto (max 3 favori al mese) per evitare inflazione!');
      return;
    }

    const tpl = FAVOR_TEMPLATES[selectedTemplateIdx];
    const title = customTitle.trim() || tpl.title;
    const emoji = tpl.emoji;
    const euro = customAmount > 0 ? customAmount : tpl.euroEquivalent;
    const karma = tpl.karmaValue;

    haptics.playTap();
    onCreateFavor(currentUserId, selectedCreditorId, title, emoji, euro, karma);
    setShowCreateModal(false);
    setCustomTitle('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-amber-200">
          <Gift className="w-3.5 h-3.5" />
          Moneta Sociale Senza Soldi
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Buoni Favore in Natura
        </h2>
        <p className="mt-2 text-slate-500 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          Non vuoi fare un bonifico da 3,50€? Riscatta un favore concreto (passaggio notturno, cena, montaggio mobile). Il creditore approva con un tap e il debito sparisce.
        </p>
      </div>

      {/* Monthly Budget Counter */}
      <div className="apple-glass-card rounded-2xl p-4 mb-6 border border-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900">Limite Anti-Inflazione: </span>
            <span>Hai usato <strong>{myMonthlyFavorsCount}/3</strong> favori questo mese.</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptics.playTap();
            setShowCreateModal(true);
          }}
          disabled={myMonthlyFavorsCount >= 3}
          className="w-full sm:w-auto py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Emetti Buono Favore</span>
        </button>
      </div>

      {/* Active Favor Coupons List */}
      <div className="space-y-3">
        {favors.length === 0 ? (
          <div className="apple-glass-card rounded-3xl p-10 text-center border border-white">
            <p className="text-xs text-slate-400">Nessun buono favore attivo. Creane uno per ripagare un amico in natura!</p>
          </div>
        ) : (
          favors.map((favor) => {
            const debtor = getUser(favor.fromUserId);
            const creditor = getUser(favor.toUserId);
            const canIApprove = favor.toUserId === currentUserId && !favor.isRedeemed;

            return (
              <div
                key={favor.id}
                className={`apple-glass-card rounded-3xl p-4 sm:p-5 border transition-all ${
                  favor.isRedeemed
                    ? 'border-slate-200/60 opacity-60 bg-slate-50/50'
                    : 'border-white/80 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Emoji + Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                      {favor.emoji}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {favor.title}
                        </span>
                        {favor.isRedeemed ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Riscosso ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Pronto all&apos;uso
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span>Offerto da <strong>{debtor.name}</strong></span>
                        <span>&rarr;</span>
                        <span>A favore di <strong>{creditor.name}</strong></span>
                        <span>·</span>
                        <span className="font-mono font-bold text-slate-800">Valore €{favor.euroEquivalent.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {canIApprove ? (
                      <button
                        type="button"
                        onClick={() => {
                          haptics.playTap();
                          onRedeemFavor(favor.id);
                        }}
                        className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accetta &amp; Salda Debito</span>
                      </button>
                    ) : (
                      <div className="text-xs text-slate-400 font-mono">
                        +{favor.karmaValue} Karma
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Favor Coupon */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
          <div className="apple-glass rounded-3xl p-6 sm:p-7 max-w-md w-full border border-white shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Emetti un Buono Favore</h3>
            <p className="text-xs text-slate-500 mb-4">
              Scegli a chi offrirlo e quale servizio in natura intendi svolgere.
            </p>

            <form onSubmit={handleIssueFavor} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  A quale creditore offri il favore?
                </label>
                <select
                  value={selectedCreditorId}
                  onChange={(e) => setSelectedCreditorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {users
                    .filter((u) => u.id !== currentUserId)
                    .map((u) => {
                      const owed = myActiveDebts.find((d) => d.creditorId === u.id);
                      return (
                        <option key={u.id} value={u.id}>
                          {u.name} {owed ? `(gli devi €${owed.amount.toFixed(2)})` : ''}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Template predefiniti
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {FAVOR_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={tpl.title}
                      type="button"
                      onClick={() => {
                        haptics.playTap();
                        setSelectedTemplateIdx(idx);
                        setCustomAmount(tpl.euroEquivalent);
                      }}
                      className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        selectedTemplateIdx === idx
                          ? 'bg-amber-50 border-amber-300 text-slate-900 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{tpl.emoji}</span>
                        <span className="truncate">{tpl.title}</span>
                      </div>
                      <span className="font-mono font-bold shrink-0 text-slate-800">
                        ~€{tpl.euroEquivalent.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Emetti Buono</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
