import React from 'react';
import { SimplificationAnalysis } from '../utils/debtSimplifier';
import { KarmaUser } from '../types/karma';
import { haptics } from '../utils/haptics';
import { GitMerge, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface CircularDebtModalProps {
  analysis: SimplificationAnalysis;
  users: KarmaUser[];
  onClose: () => void;
  onApplySimplification: () => void;
}

export const CircularDebtModal: React.FC<CircularDebtModalProps> = ({
  analysis,
  users,
  onClose,
  onApplySimplification,
}) => {
  const getUser = (id: string) =>
    users.find((u) => u.id === id) || {
      name: 'Amico',
      avatarEmoji: '👤',
      avatarBg: 'from-slate-400 to-slate-500',
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="apple-glass rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-white shadow-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 text-white flex items-center justify-center shadow-md">
            <GitMerge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-sky-600 tracking-wider uppercase">
              Algoritmo Salva-Amicizia
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              Compensazione Debiti Circolari
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Se Marco deve a Luca, Luca deve a Sofia e Sofia deve a Marco, è inutile scambiarsi soldi tre volte. Karma calcola la posizione netta di ciascuno e cancella i debiti incrociati.
        </p>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-center">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] text-slate-400">Transazioni Attuali</div>
            <div className="text-2xl font-black text-slate-800 font-mono">
              {analysis.originalTransactionsCount}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
            <div className="text-[11px] text-emerald-600 font-semibold">Dopo la Semplificazione</div>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {analysis.simplifiedTransactionsCount}
            </div>
          </div>
        </div>

        {/* Simplified Transactions List */}
        <div className="mb-5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Nuovi Saldi Netti Ottimizzati:
          </div>

          {analysis.simplifiedList.length === 0 ? (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center text-xs text-emerald-800 font-semibold">
              🎉 Tutti i debiti del gruppo si annullano a vicenda! Nessuno deve più niente a nessuno.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {analysis.simplifiedList.map((tx, idx) => {
                const from = getUser(tx.fromId);
                const to = getUser(tx.toId);
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                        {from.avatarEmoji}
                      </span>
                      <span>{from.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                        {to.avatarEmoji}
                      </span>
                      <span>{to.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      €{tx.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.playTap();
              onApplySimplification();
            }}
            className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Applica &amp; Risolvi Subito</span>
          </button>
        </div>
      </div>
    </div>
  );
};
