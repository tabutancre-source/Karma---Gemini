import React, { useState, useRef } from 'react';
import { Debt, KarmaUser, InsultLevel } from '../types/karma';
import { calculateKarmaForForgiveness } from '../utils/karmaLogic';
import { haptics } from '../utils/haptics';
import { ParticleBurst } from './ParticleBurst';
import { ExternalPayModal } from './ExternalPayModal';
import { Sparkles, HeartHandshake, Plus, Info, GitMerge, DollarSign, Gift, Camera } from 'lucide-react';

interface ForgivenessTouchProps {
  debts: Debt[];
  users: KarmaUser[];
  currentUserId: string;
  insultLevel: InsultLevel;
  onUpdateInsultLevel: (level: InsultLevel) => void;
  onForgiveDebt: (debtId: string, karmaEarned: number) => void;
  onSettleDebt: (debtId: string, method?: 'cash' | 'satispay' | 'revolut' | 'paypal') => void;
  onAddQuickDebt: (
    creditorId: string,
    debtorId: string,
    amount: number,
    description: string,
    receiptImage?: string
  ) => void;
  hasCircularDebts: boolean;
  onOpenCircularModal: () => void;
  onOpenFavorMarket: () => void;
}

export const ForgivenessTouch: React.FC<ForgivenessTouchProps> = ({
  debts,
  users,
  currentUserId,
  insultLevel,
  onUpdateInsultLevel,
  onForgiveDebt,
  onSettleDebt,
  onAddQuickDebt,
  hasCircularDebts,
  onOpenCircularModal,
  onOpenFavorMarket,
}) => {
  const [filter, setFilter] = useState<'all' | 'micro' | 'credits' | 'debts'>('micro');
  const [activeChargingId, setActiveChargingId] = useState<string | null>(null);
  const [chargeProgress, setChargeProgress] = useState<number>(0);
  const [dissolvingId, setDissolvingId] = useState<string | null>(null);
  const [burstCoords, setBurstCoords] = useState<{ x: number; y: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [payModalDebt, setPayModalDebt] = useState<Debt | null>(null);

  // New debt form state
  const [newDebtorId, setNewDebtorId] = useState<string>(
    users.find((u) => u.id !== currentUserId)?.id || users[0]?.id || ''
  );
  const [newAmount, setNewAmount] = useState<number>(2.5);
  const [newDesc, setNewDesc] = useState<string>('Caffè al volo & brioche');
  const [newReceiptImg, setNewReceiptImg] = useState<string | undefined>(undefined);

  const chargeTimerRef = useRef<number | null>(null);
  const chargeStartRef = useRef<number>(0);

  const getUser = (id: string) =>
    users.find((u) => u.id === id) || {
      name: 'Amico',
      avatarEmoji: '👤',
      avatarBg: 'from-slate-300 to-slate-400',
    };

  const activeDebts = debts.filter((d) => !d.isForgiven && !d.isSettled);

  const displayedDebts = activeDebts.filter((d) => {
    if (filter === 'micro') return d.amount <= 6.0;
    if (filter === 'credits') return d.creditorId === currentUserId;
    if (filter === 'debts') return d.debtorId === currentUserId;
    return true;
  });

  const startLongPress = (debt: Debt, e: React.MouseEvent | React.TouchEvent) => {
    const targetElement =
      ((e.currentTarget as HTMLElement).closest('.debt-card') as HTMLElement) ||
      (e.currentTarget as HTMLElement);
    const rect = targetElement.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;

    setActiveChargingId(debt.id);
    setChargeProgress(0);
    chargeStartRef.current = performance.now();
    const duration = 1200; // 1.2s

    haptics.playTick(450);

    const stepAudio = () => {
      const now = performance.now();
      const elapsed = now - chargeStartRef.current;
      const progress = Math.min(1, elapsed / duration);
      setChargeProgress(progress);
      haptics.playChargeStep(progress);

      if (progress < 1) {
        chargeTimerRef.current = requestAnimationFrame(stepAudio);
      } else {
        completeForgiveness(debt, clientX, clientY);
      }
    };

    chargeTimerRef.current = requestAnimationFrame(stepAudio);
  };

  const cancelLongPress = () => {
    if (chargeTimerRef.current) {
      cancelAnimationFrame(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
    setActiveChargingId(null);
    setChargeProgress(0);
  };

  const completeForgiveness = (debt: Debt, x: number, y: number) => {
    if (chargeTimerRef.current) {
      cancelAnimationFrame(chargeTimerRef.current);
      chargeTimerRef.current = null;
    }
    setActiveChargingId(null);
    setChargeProgress(0);

    setDissolvingId(debt.id);
    setBurstCoords({ x, y });
    haptics.playForgiveSound();

    const karmaBonus = calculateKarmaForForgiveness(debt.amount);

    setTimeout(() => {
      onForgiveDebt(debt.id, karmaBonus);
      setDissolvingId(null);
    }, 450);
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtorId || newAmount <= 0) return;
    haptics.playTap();
    onAddQuickDebt(currentUserId, newDebtorId, newAmount, newDesc, newReceiptImg);
    setShowAddModal(false);
    setNewReceiptImg(undefined);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewReceiptImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Particle Burst Layer */}
      {burstCoords && (
        <ParticleBurst
          x={burstCoords.x}
          y={burstCoords.y}
          count={32}
          onComplete={() => setBurstCoords(null)}
        />
      )}

      {/* Header Intro */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-rose-100">
          <HeartHandshake className="w-3.5 h-3.5" />
          Haptic Touch &amp; Social Karma
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Il Condono
        </h1>
        <p className="mt-2 text-slate-500 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          Basta inseguire gli amici per 1,50€. Tieni premuta una card: il debito si dissolve in particelle e si trasforma istantaneamente in Punti Karma nel registro immutabile.
        </p>
      </div>

      {/* Insult Level / Tone of Voice Selector */}
      <div className="apple-glass-card rounded-2xl p-3 sm:p-4 mb-6 border border-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="font-bold">Tono Notifiche Condono:</span>
          <span className="text-slate-400">Scelto dal gruppo</span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              onUpdateInsultLevel('zen');
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              insultLevel === 'zen' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            🌸 Zen
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              onUpdateInsultLevel('ironic');
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              insultLevel === 'ironic' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
            }`}
          >
            😏 Asciutto
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              onUpdateInsultLevel('savage');
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              insultLevel === 'savage' ? 'bg-white text-rose-600 shadow-2xs' : 'text-slate-500'
            }`}
          >
            🔥 Savage
          </button>
        </div>
      </div>

      {/* Circular Debts Detected Banner */}
      {hasCircularDebts && (
        <div className="apple-glass rounded-2xl p-4 mb-6 border border-sky-200/80 bg-sky-50/70 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-sky-950">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
              <GitMerge className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Trovati debiti circolari nel gruppo!</div>
              <div className="text-[11px] text-sky-800">
                Alcuni amici si devono soldi a vicenda: puoi cancellarli con 1 click senza toccare il portafoglio.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              onOpenCircularModal();
            }}
            className="py-2 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shrink-0 shadow-sm transition-all cursor-pointer"
          >
            Compensa Ora
          </button>
        </div>
      )}

      {/* Instructions Banner */}
      <div className="apple-glass-card rounded-2xl p-4 mb-6 border border-white flex items-start gap-3 text-xs text-slate-600">
        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-slate-900">Come funziona il Condono: </span>
          Premi e tieni premuto (~1 secondo) su qualsiasi card di micro-debito. La card si restringerà fino a dissolversi in particelle colorate, tu guadagni +250 Karma e il debitore riceve l&apos;avviso con il tono del gruppo.
        </div>
      </div>

      {/* Filter Tabs & Add Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-2xl overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              setFilter('micro');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filter === 'micro' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Micro-Debiti (&le; €6)
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              setFilter('all');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Tutti ({activeDebts.length})
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              setFilter('credits');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filter === 'credits' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            I Tuoi Crediti
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              setFilter('debts');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              filter === 'debts' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
            }`}
          >
            I Tuoi Debiti
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              onOpenFavorMarket();
            }}
            className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Buoni Favore</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aggiungi Spesa</span>
          </button>
        </div>
      </div>

      {/* Debts List */}
      {displayedDebts.length === 0 ? (
        <div className="apple-glass-card rounded-3xl p-12 text-center border border-white">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-2xl mb-3">
            🕊️
          </div>
          <h3 className="text-lg font-bold text-slate-900">Nessun debito in sospeso</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Tutto in pari o tutti i micro-debiti sono già stati condonati. Il Nirvana finanziario è raggiunto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedDebts.map((debt) => {
            const creditor = getUser(debt.creditorId);
            const debtor = getUser(debt.debtorId);
            const isCharging = activeChargingId === debt.id;
            const isDissolving = dissolvingId === debt.id;
            const isMyCredit = debt.creditorId === currentUserId;
            const karmaPotential = calculateKarmaForForgiveness(debt.amount);

            return (
              <div
                key={debt.id}
                className={`debt-card relative rounded-3xl p-5 border transition-all duration-300 select-none ${
                  isDissolving
                    ? 'scale-0 opacity-0 blur-lg pointer-events-none'
                    : isCharging
                    ? 'scale-[0.96] shadow-2xl bg-orange-50/90 border-orange-300'
                    : 'apple-glass-card border-white/80 hover:shadow-md'
                }`}
              >
                {/* Visual Charge Bar */}
                {isCharging && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-100 rounded-t-3xl overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 transition-all duration-75"
                      style={{ width: `${chargeProgress * 100}%` }}
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg bg-gradient-to-tr ${debtor.avatarBg} shadow-sm`}
                      >
                        {debtor.avatarEmoji}
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white shadow-2xs border border-slate-100">
                        debe
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                        <span>{debtor.name}</span>
                        <span className="text-slate-400 font-normal">&rarr;</span>
                        <span className="text-slate-600">{creditor.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {debt.description}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{debt.createdAt}</span>
                        {debt.receiptImage && (
                          <span className="text-orange-500 font-medium">📷 Scontrino allegato</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
                      €{debt.amount.toFixed(2)}
                    </div>
                    {debt.amount <= 6.0 && (
                      <span className="text-[10px] font-bold text-rose-500 tracking-tight">
                        Micro-debito
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Haptic Condono Zone & External Pay */}
                <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onMouseDown={(e) => startLongPress(debt, e)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onTouchStart={(e) => startLongPress(debt, e)}
                      onTouchEnd={cancelLongPress}
                      onTouchCancel={cancelLongPress}
                      className={`w-full py-2.5 px-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isCharging
                          ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white shadow-md'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100'
                      }`}
                      title="Tieni premuto per condonare"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isCharging ? 'animate-spin' : ''}`} />
                      <span>
                        {isCharging
                          ? `Rilascio a ${Math.round(chargeProgress * 100)}%...`
                          : `Tieni Premuto: Condona (+${karmaPotential} Karma)`}
                      </span>
                    </button>
                  </div>

                  {/* External Pay Modal Button ("Soldi Veri") */}
                  <button
                    type="button"
                    onClick={() => {
                      haptics.playTap();
                      setPayModalDebt(debt);
                    }}
                    className="py-2.5 px-3 rounded-2xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    title="Paga con Satispay, Revolut, PayPal o IBAN"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                    <span>Paga Ora</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* External Pay Modal */}
      {payModalDebt && (
        <ExternalPayModal
          debt={payModalDebt}
          creditor={getUser(payModalDebt.creditorId)}
          onClose={() => setPayModalDebt(null)}
          onConfirmSettlement={(debtId, method) => {
            onSettleDebt(debtId, method);
            setPayModalDebt(null);
          }}
        />
      )}

      {/* Quick Add Debt Modal with Receipt Attachment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
          <div className="apple-glass rounded-3xl p-6 max-w-sm w-full border border-white shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Aggiungi Spesa Rapida</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registra una colazione o uno scontrino al volo.
            </p>

            <form onSubmit={handleCreateDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Chi deve rimborsarti?
                </label>
                <select
                  value={newDebtorId}
                  onChange={(e) => setNewDebtorId(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  {users
                    .filter((u) => u.id !== currentUserId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.karmaPoints} pts)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Importo (€)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={newAmount}
                  onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-base font-bold font-mono rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Motivo
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  placeholder="Es. Caffè e cornetto"
                />
              </div>

              {/* Photo Receipt Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Foto Scontrino (Opzionale)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-orange-500 bg-slate-50 text-slate-600 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    <span>{newReceiptImg ? 'Scontrino Caricato ✓' : 'Carica Foto Scontrino'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                  {newReceiptImg && (
                    <button
                      type="button"
                      onClick={() => setNewReceiptImg(undefined)}
                      className="text-xs text-rose-500 hover:text-rose-700 px-2 cursor-pointer"
                    >
                      Rimuovi
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Salva Spesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
