import React from 'react';
import { AppendOnlyEntry, KarmaUser } from '../types/karma';
import { Database, ShieldCheck, Hash } from 'lucide-react';

interface AppendOnlyLedgerModalProps {
  entries: AppendOnlyEntry[];
  users: KarmaUser[];
  onClose: () => void;
}

export const AppendOnlyLedgerModal: React.FC<AppendOnlyLedgerModalProps> = ({
  entries,
  users,
  onClose,
}) => {
  const getUser = (id?: string) =>
    users.find((u) => u.id === id) || {
      name: 'Amico',
      avatarEmoji: '👤',
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="apple-glass rounded-3xl p-6 sm:p-7 max-w-xl w-full border border-white shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Registro Immutabile
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Append-Only
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tutti gli eventi storici in centesimi interi. Nessuna modifica possibile.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto my-4 space-y-2.5 pr-1">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nessun blocco registrato nel ledger finora.
            </div>
          ) : (
            entries.map((entry, idx) => {
              const actor = getUser(entry.actorId);
              const target = entry.targetId ? getUser(entry.targetId) : null;
              const euros = (entry.amountCents / 100).toFixed(2);

              return (
                <div
                  key={entry.id}
                  className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs text-xs font-mono"
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 mb-1">
                    <span className="flex items-center gap-1 font-bold text-slate-600">
                      <Hash className="w-3 h-3 text-slate-400" />
                      Blocco #{entries.length - idx} · {entry.type}
                    </span>
                    <span>{entry.timestamp}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 font-sans font-semibold text-slate-800">
                    <div className="truncate flex items-center gap-1.5">
                      <span>{actor.name}</span>
                      {target && (
                        <>
                          <span className="text-slate-400">&rarr;</span>
                          <span>{target.name}</span>
                        </>
                      )}
                      <span className="text-slate-400 font-normal">· {entry.description}</span>
                    </div>

                    <div className="font-mono font-bold text-slate-900 shrink-0">
                      {entry.amountCents > 0 ? `€${euros}` : '0.00€'}
                    </div>
                  </div>

                  <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>ID: {entry.id.slice(0, 16)}...</span>
                    {entry.karmaAwarded > 0 && (
                      <span className="text-emerald-600 font-bold">
                        +{entry.karmaAwarded} Karma
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
        >
          Chiudi Registro
        </button>
      </div>
    </div>
  );
};
