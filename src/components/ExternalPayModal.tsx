import React, { useState } from 'react';
import { Debt, KarmaUser } from '../types/karma';
import { haptics } from '../utils/haptics';
import { ExternalLink, Copy, Check, ShieldCheck, ArrowRight } from 'lucide-react';

interface ExternalPayModalProps {
  debt: Debt;
  creditor: KarmaUser;
  onClose: () => void;
  onConfirmSettlement: (debtId: string, method: 'satispay' | 'revolut' | 'paypal' | 'cash') => void;
}

export const ExternalPayModal: React.FC<ExternalPayModalProps> = ({
  debt,
  creditor,
  onClose,
  onConfirmSettlement,
}) => {
  const [copiedIBAN, setCopiedIBAN] = useState(false);

  const iban = creditor.externalPayLinks?.iban || 'IT60X0542811101000000123456';
  const paypalUser = creditor.externalPayLinks?.paypal || creditor.name.toLowerCase().replace(/[^a-z]/g, '');
  const revolutUser = creditor.externalPayLinks?.revolut || creditor.name.toLowerCase().replace(/[^a-z]/g, '');

  const paypalUrl = `https://paypal.me/${paypalUser}/${debt.amount.toFixed(2)}`;
  const revolutUrl = `https://revolut.me/${revolutUser}`;
  const satispayUrl = `https://tag.satispay.com/${creditor.name.toLowerCase().replace(/[^a-z]/g, '')}`;

  const copyIBAN = () => {
    haptics.playTap();
    navigator.clipboard.writeText(iban);
    setCopiedIBAN(true);
    setTimeout(() => setCopiedIBAN(false), 2500);
  };

  const handleExternalOpen = (url: string, method: 'satispay' | 'revolut' | 'paypal') => {
    haptics.playTap();
    window.open(url, '_blank', 'noopener,noreferrer');
    // Prompt to register settlement
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in">
      <div className="apple-glass rounded-3xl p-6 sm:p-7 max-w-md w-full border border-white shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-orange-600 tracking-wider uppercase">
              Soldi Veri · Nessuna Trattenuta
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">
              Salda €{debt.amount.toFixed(2)} a {creditor.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Disclaimer Notice */}
        <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p>
            Karma è pura contabilità amichevole: non tocca né trattiene i tuoi soldi. Il pagamento effettivo avviene direttamente sulle tue app bancarie preferite.
          </p>
        </div>

        {/* External Payment Options */}
        <div className="space-y-2.5 text-xs font-semibold">
          {/* Satispay */}
          <button
            type="button"
            onClick={() => handleExternalOpen(satispayUrl, 'satispay')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/5 hover:from-red-500/20 hover:to-red-600/15 border border-red-200/80 text-red-950 flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-2xs">
                S
              </span>
              <div className="text-left">
                <div className="font-bold text-slate-900">Paga con Satispay</div>
                <div className="text-[11px] text-slate-500 font-normal">Apri Satispay per inviare €{debt.amount.toFixed(2)}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-red-600" />
          </button>

          {/* Revolut */}
          <button
            type="button"
            onClick={() => handleExternalOpen(revolutUrl, 'revolut')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/15 border border-blue-200/80 text-blue-950 flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-2xs">
                R
              </span>
              <div className="text-left">
                <div className="font-bold text-slate-900">Paga con Revolut</div>
                <div className="text-[11px] text-slate-500 font-normal">Revtag: @{revolutUser}</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </button>

          {/* PayPal.me */}
          <button
            type="button"
            onClick={() => handleExternalOpen(paypalUrl, 'paypal')}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 to-sky-600/5 hover:from-sky-500/20 hover:to-sky-600/15 border border-sky-200/80 text-sky-950 flex items-center justify-between transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-sky-600 text-white font-black flex items-center justify-center text-sm shadow-2xs">
                P
              </span>
              <div className="text-left">
                <div className="font-bold text-slate-900">Paga con PayPal.me</div>
                <div className="text-[11px] text-slate-500 font-normal">paypal.me/{paypalUser}/{debt.amount.toFixed(2)}€</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-sky-600" />
          </button>

          {/* IBAN Copy */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="truncate">
              <div className="text-[10px] text-slate-400 font-bold uppercase">IBAN di {creditor.name}</div>
              <div className="font-mono text-xs font-bold text-slate-800 truncate">{iban}</div>
            </div>
            <button
              type="button"
              onClick={copyIBAN}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              {copiedIBAN ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIBAN ? 'Copiato!' : 'Copia'}</span>
            </button>
          </div>
        </div>

        {/* Manual Confirm Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Chiudi
          </button>
          <button
            type="button"
            onClick={() => onConfirmSettlement(debt.id, 'satispay')}
            className="flex-1 py-3 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ho Già Pagato</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
