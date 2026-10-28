export type InsultLevel = 'zen' | 'ironic' | 'savage';

export interface ExternalPayLinks {
  satispay?: string;
  revolut?: string;
  paypal?: string;
  iban?: string;
}

export interface KarmaUser {
  id: string;
  name: string;
  avatarBg: string;
  avatarEmoji: string;
  karmaPoints: number;
  totalOffered: number; // in Euros
  totalForgiven: number; // in Euros
  wheelsWon: number;
  isCurrentUser?: boolean;
  hasImmunity?: boolean; // Immunity protection from blur and roasts
  externalPayLinks?: ExternalPayLinks;
}

export interface Debt {
  id: string;
  creditorId: string; // The one who paid / is owed money
  debtorId: string;   // The one who owes money
  amount: number;
  cents: number;      // Integer cents for exact append-only ledger math
  description: string;
  createdAt: string;
  createdTimestamp: number;
  isForgiven: boolean;
  forgivenAt?: string;
  isSettled: boolean;
  settledAt?: string;
  settleMethod?: 'cash' | 'satispay' | 'revolut' | 'paypal' | 'favor' | 'circular_simplification';
  receiptImage?: string; // Optional attached receipt photo
}

export interface FavorCoupon {
  id: string;
  fromUserId: string; // The debtor who owes and will perform the favor
  toUserId: string;   // The creditor who will enjoy the favor
  title: string;
  category: 'ride' | 'driver' | 'dinner' | 'furniture' | 'coffee' | 'custom';
  emoji: string;
  karmaValue: number;
  euroEquivalent: number;
  month: string;      // "YYYY-MM" to enforce max 3 favors/month limit
  isRedeemed: boolean;
  redeemedAt?: string;
}

export interface AppendOnlyEntry {
  id: string;
  timestamp: string;
  timestampEpoch: number;
  type: 'wheel_split' | 'quick_expense' | 'forgiveness' | 'favor_redemption' | 'settlement' | 'circular_simplification';
  actorId: string;
  targetId?: string;
  amountCents: number;
  description: string;
  karmaAwarded: number;
  hash?: string;
}

export interface KarmaActivity {
  id: string;
  type: 'wheel' | 'forgiveness' | 'settle' | 'coffee' | 'favor' | 'simplification';
  actorId: string;
  targetId?: string;
  amount: number;
  pointsEarned: number;
  message: string;
  timestamp: string;
  insultLevel?: InsultLevel;
}

export interface GroupSettings {
  groupName: string;
  insultLevel: InsultLevel;
  currentSeason: string;
  seasonNumber: number;
  useKarmaWheel: boolean; // Weighted wheel mode
  telegramBotLinked: boolean;
  telegramUsername?: string;
}
