import { useState, useEffect, useMemo } from 'react';
import {
  KarmaUser,
  Debt,
  KarmaActivity,
  FavorCoupon,
  AppendOnlyEntry,
  GroupSettings,
  InsultLevel,
} from './types/karma';
import { INITIAL_USERS, INITIAL_DEBTS, INITIAL_ACTIVITIES } from './data/initialData';
import { Navbar, NavTab } from './components/Navbar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { TheWheel } from './components/TheWheel';
import { ForgivenessTouch } from './components/ForgivenessTouch';
import { Leaderboard } from './components/Leaderboard';
import { FavorMarket } from './components/FavorMarket';
import { NotificationsFeed } from './components/NotificationsFeed';
import { CircularDebtModal } from './components/CircularDebtModal';
import { AppendOnlyLedgerModal } from './components/AppendOnlyLedgerModal';
import { generateDryNotification } from './utils/karmaLogic';
import { analyzeCircularDebts } from './utils/debtSimplifier';
import { haptics } from './utils/haptics';
import { RotateCcw } from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState<KarmaUser[]>(() => {
    try {
      const saved = localStorage.getItem('karma_users_v2');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    try {
      const saved = localStorage.getItem('karma_debts_v2');
      return saved
        ? JSON.parse(saved)
        : INITIAL_DEBTS.map((d) => ({
            ...d,
            cents: Math.round(d.amount * 100),
            createdTimestamp: Date.now() - 86400000 * 2,
          }));
    } catch {
      return INITIAL_DEBTS.map((d) => ({
        ...d,
        cents: Math.round(d.amount * 100),
        createdTimestamp: Date.now() - 86400000 * 2,
      }));
    }
  });

  const [activities, setActivities] = useState<KarmaActivity[]>(() => {
    try {
      const saved = localStorage.getItem('karma_activities_v2');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const [favors, setFavors] = useState<FavorCoupon[]>(() => {
    try {
      const saved = localStorage.getItem('karma_favors_v2');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'fav-1',
              fromUserId: 'user-matteo',
              toUserId: 'user-tu',
              title: 'Passaggio in macchina (salvataggio notturno)',
              category: 'ride',
              emoji: '🚗',
              euroEquivalent: 5.0,
              karmaValue: 120,
              month: new Date().toISOString().slice(0, 7),
              isRedeemed: false,
            },
          ];
    } catch {
      return [];
    }
  });

  const [ledger, setLedger] = useState<AppendOnlyEntry[]>(() => {
    try {
      const saved = localStorage.getItem('karma_ledger_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [groupSettings, setGroupSettings] = useState<GroupSettings>(() => {
    try {
      const saved = localStorage.getItem('karma_settings_v2');
      return saved
        ? JSON.parse(saved)
        : {
            groupName: 'Aperitivi & Cene',
            insultLevel: 'ironic',
            currentSeason: 'Stagione Autunno 2026',
            seasonNumber: 1,
            useKarmaWheel: false,
            telegramBotLinked: false,
          };
    } catch {
      return {
        groupName: 'Aperitivi & Cene',
        insultLevel: 'ironic',
        currentSeason: 'Stagione Autunno 2026',
        seasonNumber: 1,
        useKarmaWheel: false,
        telegramBotLinked: false,
      };
    }
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('wheel');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCircularModal, setShowCircularModal] = useState<boolean>(false);
  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);

  const currentUserId = 'user-tu';

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('karma_users_v2', JSON.stringify(users));
      localStorage.setItem('karma_debts_v2', JSON.stringify(debts));
      localStorage.setItem('karma_activities_v2', JSON.stringify(activities));
      localStorage.setItem('karma_favors_v2', JSON.stringify(favors));
      localStorage.setItem('karma_ledger_v2', JSON.stringify(ledger));
      localStorage.setItem('karma_settings_v2', JSON.stringify(groupSettings));
    } catch {}
  }, [users, debts, activities, favors, ledger, groupSettings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    haptics.enabled = next;
  };

  // Append-only ledger helper
  const appendLedgerEntry = (
    type: AppendOnlyEntry['type'],
    actorId: string,
    amountCents: number,
    description: string,
    karmaAwarded: number,
    targetId?: string
  ) => {
    const newEntry: AppendOnlyEntry = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
      timestampEpoch: Date.now(),
      type,
      actorId,
      targetId,
      amountCents,
      description,
      karmaAwarded,
    };
    setLedger((prev) => [newEntry, ...prev]);
  };

  // Debt Simplification analysis
  const activeBilateralDebts = useMemo(() => {
    return debts
      .filter((d) => !d.isForgiven && !d.isSettled)
      .map((d) => ({
        id: d.id,
        creditorId: d.creditorId,
        debtorId: d.debtorId,
        amount: d.amount,
      }));
  }, [debts]);

  const circularAnalysis = useMemo(() => {
    return analyzeCircularDebts(activeBilateralDebts);
  }, [activeBilateralDebts]);

  // Apply Circular Debt Cancellation
  const handleApplyCircularSimplification = () => {
    if (!circularAnalysis.hasCircularDebt) return;

    // 1. Mark existing active debts as settled by circular simplification
    setDebts((prev) =>
      prev.map((d) =>
        !d.isForgiven && !d.isSettled
          ? {
              ...d,
              isSettled: true,
              settledAt: 'Compensazione Circolare',
              settleMethod: 'circular_simplification',
            }
          : d
      )
    );

    // 2. Insert new minimal transactions
    const newDebts: Debt[] = circularAnalysis.simplifiedList.map((tx) => ({
      id: `debt-simpl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      creditorId: tx.toId,
      debtorId: tx.fromId,
      amount: tx.amount,
      cents: Math.round(tx.amount * 100),
      description: 'Saldo netto ottimizzato (Compensazione)',
      createdAt: 'Proprio ora',
      createdTimestamp: Date.now(),
      isForgiven: false,
      isSettled: false,
    }));

    setDebts((prev) => [...newDebts, ...prev]);

    // 3. Record in ledger & activities
    appendLedgerEntry(
      'circular_simplification',
      currentUserId,
      0,
      `Risolte ${circularAnalysis.savedTransactionsCount} transazioni circolari`,
      50
    );

    const msg = generateDryNotification('simplification', {
      actorName: 'Algoritmo Karma',
      amount: circularAnalysis.savedTransactionsCount,
    });

    const newActivity: KarmaActivity = {
      id: `act-${Date.now()}`,
      type: 'simplification',
      actorId: currentUserId,
      amount: 0,
      pointsEarned: 50,
      message: msg,
      timestamp: 'Proprio ora',
    };

    setActivities((prev) => [newActivity, ...prev]);
    setShowCircularModal(false);
    showToast(msg);
  };

  // Wheel Split Execution
  const handleConfirmWheelSplit = (
    payerId: string,
    totalAmount: number,
    participantIds: string[],
    karmaEarned: number,
    splitAmount: number
  ) => {
    const payer = users.find((u) => u.id === payerId);
    if (!payer) return;

    // 1. Update Payer Karma & stats
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === payerId) {
          return {
            ...u,
            karmaPoints: u.karmaPoints + karmaEarned,
            totalOffered: u.totalOffered + totalAmount,
            wheelsWon: (u.wheelsWon || 0) + 1,
          };
        }
        return u;
      })
    );

    // 2. Create new debts for all other participants towards the payer
    const newDebts: Debt[] = participantIds
      .filter((id) => id !== payerId)
      .map((debtorId) => ({
        id: `debt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        creditorId: payerId,
        debtorId,
        amount: splitAmount,
        cents: Math.round(splitAmount * 100),
        description: `Quota Ruota del Conto (${totalAmount.toFixed(2)}€)`,
        createdAt: 'Proprio ora',
        createdTimestamp: Date.now(),
        isForgiven: false,
        isSettled: false,
      }));

    setDebts((prev) => [...newDebts, ...prev]);

    // 3. Append to immutable ledger
    appendLedgerEntry(
      'wheel_split',
      payerId,
      Math.round(totalAmount * 100),
      `Ruota del conto per ${participantIds.length} persone`,
      karmaEarned
    );

    // 4. Add dry notification
    const notificationText = generateDryNotification('wheel', {
      actorName: payer.name,
      amount: totalAmount,
      participantCount: participantIds.length,
      insultLevel: groupSettings.insultLevel,
    });

    const newActivity: KarmaActivity = {
      id: `act-${Date.now()}`,
      type: 'wheel',
      actorId: payerId,
      amount: totalAmount,
      pointsEarned: karmaEarned,
      message: notificationText,
      timestamp: 'Pochi istanti fa',
      insultLevel: groupSettings.insultLevel,
    };

    setActivities((prev) => [newActivity, ...prev]);
    showToast(notificationText);
  };

  // Il Condono
  const handleForgiveDebt = (debtId: string, karmaEarned: number) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const creditor = users.find((u) => u.id === debt.creditorId);
    const debtor = users.find((u) => u.id === debt.debtorId);

    setDebts((prev) =>
      prev.map((d) =>
        d.id === debtId
          ? { ...d, isForgiven: true, forgivenAt: 'Proprio ora' }
          : d
      )
    );

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === debt.creditorId) {
          return {
            ...u,
            karmaPoints: u.karmaPoints + karmaEarned,
            totalForgiven: u.totalForgiven + debt.amount,
          };
        }
        return u;
      })
    );

    appendLedgerEntry(
      'forgiveness',
      debt.creditorId,
      debt.cents || Math.round(debt.amount * 100),
      `Condono debito a ${debtor?.name || 'amico'}`,
      karmaEarned,
      debt.debtorId
    );

    const dryMsg = generateDryNotification('forgiveness', {
      actorName: creditor?.name || 'Qualcuno',
      debtorName: debtor?.name || 'qualcuno',
      amount: debt.amount,
      insultLevel: groupSettings.insultLevel,
    });

    const newActivity: KarmaActivity = {
      id: `act-${Date.now()}`,
      type: 'forgiveness',
      actorId: debt.creditorId,
      targetId: debt.debtorId,
      amount: debt.amount,
      pointsEarned: karmaEarned,
      message: dryMsg,
      timestamp: 'Proprio ora',
      insultLevel: groupSettings.insultLevel,
    };

    setActivities((prev) => [newActivity, ...prev]);
    showToast(dryMsg);
  };

  // Regular Settlement
  const handleSettleDebt = (
    debtId: string,
    method?: 'cash' | 'satispay' | 'revolut' | 'paypal'
  ) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) return;

    const debtor = users.find((u) => u.id === debt.debtorId);

    setDebts((prev) =>
      prev.map((d) =>
        d.id === debtId
          ? {
              ...d,
              isSettled: true,
              settledAt: 'Proprio ora',
              settleMethod: method || 'cash',
            }
          : d
      )
    );

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === debt.debtorId) {
          return {
            ...u,
            karmaPoints: u.karmaPoints + 25,
          };
        }
        return u;
      })
    );

    appendLedgerEntry(
      'settlement',
      debt.debtorId,
      debt.cents || Math.round(debt.amount * 100),
      `Saldo tramite ${method || 'contanti'}`,
      25,
      debt.creditorId
    );

    const dryMsg = generateDryNotification('settle', {
      actorName: debtor?.name || 'Qualcuno',
      amount: debt.amount,
      insultLevel: groupSettings.insultLevel,
    });

    const newActivity: KarmaActivity = {
      id: `act-${Date.now()}`,
      type: 'settle',
      actorId: debt.debtorId,
      targetId: debt.creditorId,
      amount: debt.amount,
      pointsEarned: 25,
      message: dryMsg,
      timestamp: 'Pochi istanti fa',
      insultLevel: groupSettings.insultLevel,
    };

    setActivities((prev) => [newActivity, ...prev]);
    showToast(dryMsg);
  };

  // Add quick debt
  const handleAddQuickDebt = (
    creditorId: string,
    debtorId: string,
    amount: number,
    description: string,
    receiptImage?: string
  ) => {
    const newDebt: Debt = {
      id: `debt-${Date.now()}`,
      creditorId,
      debtorId,
      amount,
      cents: Math.round(amount * 100),
      description,
      createdAt: 'Oggi',
      createdTimestamp: Date.now(),
      isForgiven: false,
      isSettled: false,
      receiptImage,
    };
    setDebts((prev) => [newDebt, ...prev]);

    appendLedgerEntry(
      'quick_expense',
      creditorId,
      Math.round(amount * 100),
      description,
      10,
      debtorId
    );

    showToast(`Registrato: ${amount.toFixed(2)}€ per "${description}"`);
  };

  // Add guest without account on the fly
  const handleAddGuestUser = (name: string) => {
    const newId = `user-guest-${Date.now()}`;
    const emojis = ['🥑', '🍸', '🌮', '⚡', '🍉', '🕶️', '🚀'];
    const bgs = [
      'from-rose-400 to-pink-500',
      'from-violet-400 to-purple-500',
      'from-teal-400 to-emerald-500',
      'from-amber-400 to-orange-500',
    ];
    const newUser: KarmaUser = {
      id: newId,
      name,
      avatarBg: bgs[Math.floor(Math.random() * bgs.length)],
      avatarEmoji: emojis[Math.floor(Math.random() * emojis.length)],
      karmaPoints: 400,
      totalOffered: 0,
      totalForgiven: 0,
      wheelsWon: 0,
    };
    setUsers((prev) => [...prev, newUser]);
    showToast(`${name} aggiunto al tavolo! Zero account richiesto.`);
  };

  // Toggle Immunity for a friend
  const handleToggleImmunity = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextImmunity = !u.hasImmunity;
          showToast(
            nextImmunity
              ? `🛡️ Immunità attivata per ${u.name}: protetto da sfocatura e battute.`
              : `Immunità rimossa per ${u.name}.`
          );
          return { ...u, hasImmunity: nextImmunity };
        }
        return u;
      })
    );
  };

  // Reset Season
  const handleResetSeason = () => {
    const nextSeasonNum = groupSettings.seasonNumber + 1;
    const seasonNames = [
      'Stagione Autunno 2026',
      'Stagione Inverno 2026/2027',
      'Stagione Primavera 2027',
      'Stagione Estate 2027',
    ];
    const newSeasonName = seasonNames[nextSeasonNum % seasonNames.length] || `Stagione ${nextSeasonNum}`;

    setGroupSettings((prev) => ({
      ...prev,
      currentSeason: newSeasonName,
      seasonNumber: nextSeasonNum,
    }));

    // Reset scores to a balanced baseline (450 pts)
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        karmaPoints: 450,
        totalOffered: 0,
        totalForgiven: 0,
        wheelsWon: 0,
      }))
    );

    appendLedgerEntry(
      'quick_expense',
      currentUserId,
      0,
      `Inizio ${newSeasonName} - Reset Punteggi Stagionali`,
      0
    );

    showToast(`Iniziata la ${newSeasonName}! Karma resettato a 450 per tutti.`);
  };

  // Favors management
  const handleCreateFavor = (
    debtorId: string,
    creditorId: string,
    title: string,
    emoji: string,
    euroEquivalent: number,
    karmaValue: number
  ) => {
    const newFavor: FavorCoupon = {
      id: `fav-${Date.now()}`,
      fromUserId: debtorId,
      toUserId: creditorId,
      title,
      category: 'custom',
      emoji,
      karmaValue,
      euroEquivalent,
      month: new Date().toISOString().slice(0, 7),
      isRedeemed: false,
    };
    setFavors((prev) => [newFavor, ...prev]);

    appendLedgerEntry(
      'favor_redemption',
      debtorId,
      Math.round(euroEquivalent * 100),
      `Buono favore emesso: "${title}"`,
      karmaValue,
      creditorId
    );

    showToast(`Buono favore "${title}" emesso!`);
  };

  const handleRedeemFavor = (favorId: string) => {
    const favor = favors.find((f) => f.id === favorId);
    if (!favor) return;

    setFavors((prev) =>
      prev.map((f) =>
        f.id === favorId
          ? { ...f, isRedeemed: true, redeemedAt: 'Proprio ora' }
          : f
      )
    );

    // If there is an active debt from debtor to creditor of similar amount, settle it
    const matchingDebt = debts.find(
      (d) =>
        d.debtorId === favor.fromUserId &&
        d.creditorId === favor.toUserId &&
        !d.isSettled &&
        !d.isForgiven
    );

    if (matchingDebt) {
      setDebts((prev) =>
        prev.map((d) =>
          d.id === matchingDebt.id
            ? { ...d, isSettled: true, settledAt: 'Pagato in Natura (Favore)', settleMethod: 'favor' }
            : d
        )
      );
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === favor.fromUserId) {
          return { ...u, karmaPoints: u.karmaPoints + favor.karmaValue };
        }
        return u;
      })
    );

    const dryMsg = generateDryNotification('favor', {
      actorName: users.find((u) => u.id === favor.toUserId)?.name || 'Creditore',
      debtorName: users.find((u) => u.id === favor.fromUserId)?.name || 'Debitore',
      amount: favor.euroEquivalent,
      favorTitle: favor.title,
      insultLevel: groupSettings.insultLevel,
    });

    const newActivity: KarmaActivity = {
      id: `act-${Date.now()}`,
      type: 'favor',
      actorId: favor.toUserId,
      targetId: favor.fromUserId,
      amount: favor.euroEquivalent,
      pointsEarned: favor.karmaValue,
      message: dryMsg,
      timestamp: 'Proprio ora',
    };

    setActivities((prev) => [newActivity, ...prev]);
    showToast(dryMsg);
  };

  // Coffee gift
  const handleOfferCoffee = (giverId: string, receiverId: string) => {
    const giver = users.find((u) => u.id === giverId);
    const receiver = users.find((u) => u.id === receiverId);

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === giverId) {
          return {
            ...u,
            karmaPoints: u.karmaPoints + 40,
            totalOffered: u.totalOffered + 1.3,
          };
        }
        if (u.id === receiverId) {
          return {
            ...u,
            karmaPoints: u.karmaPoints + 60,
          };
        }
        return u;
      })
    );

    const dryMsg = generateDryNotification('coffee', {
      actorName: giver?.name || 'Qualcuno',
      debtorName: receiver?.name,
      amount: 1.3,
      insultLevel: groupSettings.insultLevel,
    });

    const newActivity: KarmaActivity = {
      id: `act-${Date.now()}`,
      type: 'coffee',
      actorId: giverId,
      targetId: receiverId,
      amount: 1.3,
      pointsEarned: 40,
      message: dryMsg,
      timestamp: 'Proprio ora',
    };

    setActivities((prev) => [newActivity, ...prev]);
    showToast(dryMsg);
  };

  const handleResetDemoData = () => {
    haptics.playTap();
    setUsers(INITIAL_USERS);
    setDebts(INITIAL_DEBTS.map((d) => ({ ...d, cents: Math.round(d.amount * 100), createdTimestamp: Date.now() })));
    setActivities(INITIAL_ACTIVITIES);
    setFavors([]);
    setLedger([]);
    localStorage.removeItem('karma_users_v2');
    localStorage.removeItem('karma_debts_v2');
    localStorage.removeItem('karma_activities_v2');
    localStorage.removeItem('karma_favors_v2');
    localStorage.removeItem('karma_ledger_v2');
    showToast('Dati demo ripristinati allo stato iniziale.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] pb-24 lg:pb-12 text-slate-800 antialiased selection:bg-orange-500 selection:text-white">
      {/* PWA iOS Onboarding & Push/Telegram Banner */}
      <PWAInstallBanner
        onTestNotification={() => showToast('🔔 Notifica Push simulata con successo!')}
        telegramLinked={groupSettings.telegramBotLinked}
        onToggleTelegram={() => {
          const next = !groupSettings.telegramBotLinked;
          setGroupSettings((prev) => ({ ...prev, telegramBotLinked: next }));
          showToast(
            next
              ? 'Bot Telegram @KarmaSplitBot collegato con successo!'
              : 'Bot Telegram scollegato.'
          );
        }}
      />

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        unseenCount={activities.length > 3 ? 1 : 0}
        onOpenLedger={() => setShowLedgerModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentTab === 'wheel' && (
          <TheWheel
            users={users}
            onConfirmWheelSplit={handleConfirmWheelSplit}
            onAddGuestUser={handleAddGuestUser}
          />
        )}

        {currentTab === 'forgive' && (
          <ForgivenessTouch
            debts={debts}
            users={users}
            currentUserId={currentUserId}
            insultLevel={groupSettings.insultLevel}
            onUpdateInsultLevel={(lvl) =>
              setGroupSettings((prev) => ({ ...prev, insultLevel: lvl }))
            }
            onForgiveDebt={handleForgiveDebt}
            onSettleDebt={handleSettleDebt}
            onAddQuickDebt={handleAddQuickDebt}
            hasCircularDebts={circularAnalysis.hasCircularDebt}
            onOpenCircularModal={() => setShowCircularModal(true)}
            onOpenFavorMarket={() => setCurrentTab('favors')}
          />
        )}

        {currentTab === 'leaderboard' && (
          <Leaderboard
            users={users}
            onOfferCoffee={handleOfferCoffee}
            onToggleImmunity={handleToggleImmunity}
            onResetSeason={handleResetSeason}
            currentUserId={currentUserId}
            seasonName={groupSettings.currentSeason}
          />
        )}

        {currentTab === 'favors' && (
          <FavorMarket
            favors={favors}
            users={users}
            debts={debts}
            currentUserId={currentUserId}
            onRedeemFavor={handleRedeemFavor}
            onCreateFavor={handleCreateFavor}
          />
        )}

        {currentTab === 'notifications' && (
          <NotificationsFeed
            activities={activities}
            users={users}
          />
        )}
      </main>

      {/* Circular Debt Simplification Modal */}
      {showCircularModal && (
        <CircularDebtModal
          analysis={circularAnalysis}
          users={users}
          onClose={() => setShowCircularModal(false)}
          onApplySimplification={handleApplyCircularSimplification}
        />
      )}

      {/* Append-Only Ledger Modal */}
      {showLedgerModal && (
        <AppendOnlyLedgerModal
          entries={ledger}
          users={users}
          onClose={() => setShowLedgerModal(false)}
        />
      )}

      {/* Nonchalant Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="apple-glass rounded-2xl p-4 border border-white/90 shadow-xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 animate-ping" />
            <p className="text-xs font-medium text-slate-800 leading-snug">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Subtle Footer */}
      <footer className="mt-auto border-t border-slate-200/50 py-6 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Karma &middot; Split Payment &amp; Social Gamification &middot; Zero Drammi
          </div>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ripristina Demo</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
