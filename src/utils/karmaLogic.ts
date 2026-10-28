import { InsultLevel } from '../types/karma';

export interface SplitResult {
  perPerson: number;
  remaindersCount: number;
  amounts: number[];
}

export interface KarmaStatusInfo {
  tier: 'saint' | 'funder' | 'citizen' | 'dormant' | 'fugitive' | 'immune';
  title: string;
  subtitle: string;
  badgeColor: string;
  isBlurred: boolean;
  avatarRingClass: string;
  dryRemark: string;
}

/**
 * Calculates equal split with cents accuracy so sum(amounts) === totalAmount.
 */
export function calculateSplit(totalAmount: number, participantCount: number): SplitResult {
  if (participantCount <= 0 || totalAmount <= 0) {
    return { perPerson: 0, remaindersCount: 0, amounts: [] };
  }
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / participantCount);
  const remainderCents = totalCents % participantCount;

  const amounts: number[] = [];
  for (let i = 0; i < participantCount; i++) {
    const cents = baseCents + (i < remainderCents ? 1 : 0);
    amounts.push(cents / 100);
  }

  return {
    perPerson: Number((totalAmount / participantCount).toFixed(2)),
    remaindersCount: remainderCents,
    amounts,
  };
}

/**
 * Generates Karma points for paying the whole bill via The Wheel.
 */
export function calculateKarmaForWheelPayer(totalAmount: number, participantCount: number): number {
  if (totalAmount <= 0) return 0;
  const multiplier = 1.5;
  const points = 50 + Math.round(totalAmount * 5 * multiplier) + (participantCount * 10);
  return Math.max(75, points);
}

/**
 * Generates Karma points for forgiving a debt (Il Condono).
 */
export function calculateKarmaForForgiveness(forgivenAmount: number): number {
  if (forgivenAmount <= 0) return 0;
  return 150 + Math.round(forgivenAmount * 40);
}

/**
 * Determines Karma status and title based on score with guardrails:
 * - Immunity mode protects completely from blur/roasts.
 * - Negative blur ONLY applies if pending debt > 10€ AND pending for > 14 days.
 */
export function getKarmaStatus(
  karmaScore: number,
  options?: {
    hasImmunity?: boolean;
    unpaidDebt?: number;
    oldestDebtDays?: number;
  }
): KarmaStatusInfo {
  if (options?.hasImmunity) {
    return {
      tier: 'immune',
      title: 'In Immunità 🛡️',
      subtitle: 'Pausa concordata',
      badgeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      isBlurred: false,
      avatarRingClass: 'ring-2 ring-indigo-400/80 shadow-[0_0_12px_rgba(99,102,241,0.3)]',
      dryRemark: 'In pausa protetta dal gruppo. Zero sfocature, solo rispetto.',
    };
  }

  if (karmaScore >= 1000) {
    return {
      tier: 'saint',
      title: 'Santo',
      subtitle: 'Mecenate supremo',
      badgeColor: 'text-amber-600 bg-amber-50 border-amber-200',
      isBlurred: false,
      avatarRingClass: 'ring-4 ring-amber-400 ring-offset-2 shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse',
      dryRemark: 'Praticamente una ONG ambulante. Il gruppo gli deve la vita.',
    };
  }

  if (karmaScore >= 650) {
    return {
      tier: 'funder',
      title: 'Finanziatore Occulto',
      subtitle: 'Sponsor non ufficiale',
      badgeColor: 'text-orange-600 bg-orange-50 border-orange-200',
      isBlurred: false,
      avatarRingClass: 'ring-3 ring-orange-400 ring-offset-2 shadow-[0_0_15px_rgba(251,146,60,0.5)]',
      dryRemark: 'Tira fuori la carta prima ancora di vedere il conto. Rispetto.',
    };
  }

  if (karmaScore >= 400) {
    return {
      tier: 'citizen',
      title: 'Cittadino Esemplare',
      subtitle: 'Equilibrio svizzero',
      badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      isBlurred: false,
      avatarRingClass: 'ring-2 ring-emerald-400 ring-offset-1',
      dryRemark: 'Né santo né scroccone. Paga il suo e non fa storie.',
    };
  }

  // Guardrail check: only blur if debt > 10€ AND pending > 14 days
  const qualifiesForBlur = (options?.unpaidDebt ?? 15) > 10 && (options?.oldestDebtDays ?? 16) > 14;

  if (karmaScore >= 200) {
    return {
      tier: 'dormant',
      title: 'In Letargo',
      subtitle: 'Riflessi lenti al POS',
      badgeColor: 'text-slate-500 bg-slate-100 border-slate-200',
      isBlurred: qualifiesForBlur,
      avatarRingClass: qualifiesForBlur ? 'ring-1 ring-slate-300 opacity-80' : 'ring-1 ring-slate-200',
      dryRemark: qualifiesForBlur
        ? 'Presenza rarefatta nel momento clou dello scontrino.'
        : 'Debito fresco o sotto soglia. Ancora salvo dalla sfocatura.',
    };
  }

  return {
    tier: 'fugitive',
    title: 'Latitante',
    subtitle: 'Campione di evasione',
    badgeColor: 'text-rose-600 bg-rose-50 border-rose-200',
    isBlurred: qualifiesForBlur,
    avatarRingClass: qualifiesForBlur ? 'ring-2 ring-rose-400/50 grayscale-[50%]' : 'ring-1 ring-rose-200',
    dryRemark: qualifiesForBlur
      ? 'Ha sviluppato l\'invisibilità alla cassa. Urge riscatto.'
      : 'Debito piccolo o recente. Nessuna gogna, solo un promemoria.',
  };
}

/**
 * Dry, nonchalant notification copy generator with Group Insult Level support.
 */
export function generateDryNotification(
  type: 'forgiveness' | 'wheel' | 'settle' | 'coffee' | 'favor' | 'simplification',
  params: {
    actorName: string;
    debtorName?: string;
    amount: number;
    participantCount?: number;
    insultLevel?: InsultLevel;
    favorTitle?: string;
  }
): string {
  const level: InsultLevel = params.insultLevel || 'ironic';
  const formatted = params.amount.toFixed(2) + '€';
  const target = params.debtorName || 'qualcuno';

  if (type === 'forgiveness') {
    if (level === 'zen') {
      return `${params.actorName} ha liberato il debito di ${formatted} di ${target}. La generosità nobilita l'anima.`;
    }
    if (level === 'savage') {
      return `${params.actorName} ha condonato ${formatted} a ${target} per evitare l'imbarazzo al bancone. Dignità salvata con lo sconto.`;
    }
    // Default: ironic
    return `${params.actorName} ha lasciato perdere quei ${formatted} di ${target}. Vedi di offrirgli qualcosa prima o poi.`;
  }

  if (type === 'wheel') {
    if (level === 'zen') {
      return `La Ruota ha scelto ${params.actorName} per l'armonia del tavolo. Conto da ${formatted} saldato in serenità.`;
    }
    if (level === 'savage') {
      return `${params.actorName} è stato giustiziato dalla Ruota per ${formatted}. Gli altri hanno fatto finta di litigare per pagare.`;
    }
    return `${params.actorName} ha pagato ${formatted} con la Ruota del Conto. Ora avete un debito morale, oltre che economico.`;
  }

  if (type === 'settle') {
    if (level === 'zen') {
      return `${params.actorName} ha restituito ${formatted}. Il cerchio dell'equilibrio si chiude.`;
    }
    if (level === 'savage') {
      return `Miracolo: ${params.actorName} ha saldato ${formatted}. Segnate questa data sul calendario.`;
    }
    return `${params.actorName} ha saldato ${formatted}. Nessun applauso, ha fatto solo il suo dovere.`;
  }

  if (type === 'coffee') {
    if (level === 'zen') {
      return `${params.actorName} ha donato un caffè a ${target}. Gesto di luce.`;
    }
    if (level === 'savage') {
      return `${params.actorName} ha allungato un caffè a ${target} per pietà karma.`;
    }
    return `${params.actorName} ha offerto un caffè a ${target}. Un piccolo passo verso la santità.`;
  }

  if (type === 'favor') {
    return `${target} ha riscattato il buono "${params.favorTitle || 'Favore'}" da ${formatted} verso ${params.actorName}. Debito azzerato in natura!`;
  }

  if (type === 'simplification') {
    return `Compensazione circolare eseguita: ${formatted} di debiti incrociati annullati senza scambio di denaro.`;
  }

  return `${params.actorName} ha registrato un movimento di ${formatted}.`;
}
