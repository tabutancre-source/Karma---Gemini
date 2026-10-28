import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { KarmaUser } from '../types/karma';
import { calculateSplit, calculateKarmaForWheelPayer } from '../utils/karmaLogic';
import { haptics } from '../utils/haptics';
import { Sparkles, ArrowRight, Check, Users, UserPlus, Scale } from 'lucide-react';

interface TheWheelProps {
  users: KarmaUser[];
  onConfirmWheelSplit: (
    payerId: string,
    totalAmount: number,
    participantIds: string[],
    karmaEarned: number,
    splitAmount: number
  ) => void;
  onAddGuestUser: (name: string) => void;
}

const SECTOR_COLORS = [
  { bg: '#FFE8DC', text: '#D94821', accent: '#FF6B4A' },
  { bg: '#E0F2FE', text: '#0369A1', accent: '#007AFF' },
  { bg: '#FCE7F3', text: '#BE185D', accent: '#FF2D55' },
  { bg: '#DCFCE7', text: '#15803D', accent: '#22C55E' },
  { bg: '#FEF3C7', text: '#B45309', accent: '#F59E0B' },
  { bg: '#F3E8FF', text: '#7E22CE', accent: '#A855F7' },
  { bg: '#E0E7FF', text: '#3730A3', accent: '#6366F1' },
];

const PRESET_AMOUNTS = [18, 36, 60, 95, 140];

export const TheWheel: React.FC<TheWheelProps> = ({
  users,
  onConfirmWheelSplit,
  onAddGuestUser,
}) => {
  const [totalAmount, setTotalAmount] = useState<number>(48.0);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(users.map((u) => u.id));
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningUser, setWinningUser] = useState<KarmaUser | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [useKarmaWeight, setUseKarmaWeight] = useState(false); // Ruota col Karma toggle
  const [newGuestName, setNewGuestName] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);
  const spinAnimationRef = useRef<number | null>(null);
  const lastSectorRef = useRef<number>(-1);

  // Sync selected user ids when new users are added
  useEffect(() => {
    setSelectedUserIds((prev) => {
      const existing = new Set(prev);
      users.forEach((u) => {
        if (!existing.has(u.id) && prev.length < users.length) {
          existing.add(u.id);
        }
      });
      return Array.from(existing);
    });
  }, [users]);

  const activeParticipants = users.filter((u) => selectedUserIds.includes(u.id));
  const sectorCount = activeParticipants.length;

  // Calculate sector angles (equal or weighted by Karma/wheelsWon)
  // If useKarmaWeight: someone with fewer wheels won or lower karma has HIGHER weight!
  const sectorAngles: number[] = [];
  if (sectorCount > 0) {
    if (!useKarmaWeight) {
      const equalAngle = 360 / sectorCount;
      for (let i = 0; i < sectorCount; i++) sectorAngles.push(equalAngle);
    } else {
      // Calculate inverse weight: max(1, 10 - wheelsWon * 2) or based on inverse karma
      const weights = activeParticipants.map((u) => Math.max(1, 8 - (u.wheelsWon || 0) * 1.5));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      weights.forEach((w) => sectorAngles.push((w / totalWeight) * 360));
    }
  }

  // Compute sector bounds [startAngle, endAngle]
  const sectorBounds: { start: number; end: number; center: number }[] = [];
  let currentCumAngle = 0;
  for (let i = 0; i < sectorAngles.length; i++) {
    const angle = sectorAngles[i];
    sectorBounds.push({
      start: currentCumAngle,
      end: currentCumAngle + angle,
      center: currentCumAngle + angle / 2,
    });
    currentCumAngle += angle;
  }

  const toggleUser = (userId: string) => {
    if (isSpinning) return;
    haptics.playTap();
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        if (prev.length <= 2) return prev;
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGuestName.trim();
    if (!trimmed) return;
    haptics.playTap();
    onAddGuestUser(trimmed);
    setNewGuestName('');
    setShowGuestInput(false);
  };

  const spinTheWheel = () => {
    if (isSpinning || sectorCount < 2 || totalAmount <= 0) return;

    haptics.playTap();
    setIsSpinning(true);
    setWinningUser(null);
    setShowResultModal(false);

    // Pick winner based on weights
    let chosenIndex = 0;
    if (!useKarmaWeight) {
      chosenIndex = Math.floor(Math.random() * sectorCount);
    } else {
      const randDeg = Math.random() * 360;
      chosenIndex = sectorBounds.findIndex((b) => randDeg >= b.start && randDeg < b.end);
      if (chosenIndex === -1) chosenIndex = 0;
    }

    const chosenUser = activeParticipants[chosenIndex];
    const targetBound = sectorBounds[chosenIndex];

    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const sectorSize = targetBound.end - targetBound.start;
    const jitter = (Math.random() - 0.5) * (sectorSize * 0.4);
    const targetSectorCenter = targetBound.center + jitter;
    const currentRotMod = rotation % 360;
    const targetRotation =
      rotation +
      fullSpins * 360 +
      ((360 - (targetSectorCenter % 360) - (currentRotMod % 360) + 360) % 360);

    const startRotation = rotation;
    const duration = 4800;
    const startTime = performance.now();

    const animateWheel = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeOut = 1 - Math.pow(1 - progress, 3.8);
      const currentAngle = startRotation + (targetRotation - startRotation) * easeOut;
      setRotation(currentAngle);

      // Track sector crossing for haptic ticking sound
      const normalizedAngle = ((360 - (currentAngle % 360)) % 360 + 360) % 360;
      const currentSector = sectorBounds.findIndex(
        (b) => normalizedAngle >= b.start && normalizedAngle < b.end
      );
      if (currentSector !== -1 && currentSector !== lastSectorRef.current) {
        lastSectorRef.current = currentSector;
        const tickFreq = 540 + Math.floor((1 - progress) * 120);
        haptics.playTick(tickFreq);
      }

      if (progress < 1) {
        spinAnimationRef.current = requestAnimationFrame(animateWheel);
      } else {
        setIsSpinning(false);
        setWinningUser(chosenUser);
        setShowResultModal(true);
        haptics.playWheelWin();

        try {
          confetti({
            particleCount: 65,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF6B4A', '#007AFF', '#FF2D55', '#22C55E', '#FFD60A'],
          });
        } catch {}
      }
    };

    spinAnimationRef.current = requestAnimationFrame(animateWheel);
  };

  useEffect(() => {
    return () => {
      if (spinAnimationRef.current) cancelAnimationFrame(spinAnimationRef.current);
    };
  }, []);

  const splitResult = calculateSplit(totalAmount, activeParticipants.length);
  const karmaReward = calculateKarmaForWheelPayer(totalAmount, activeParticipants.length);

  const handleConfirmAndRecord = () => {
    if (!winningUser) return;
    haptics.playTap();
    onConfirmWheelSplit(
      winningUser.id,
      totalAmount,
      selectedUserIds,
      karmaReward,
      splitResult.perPerson
    );
    setShowResultModal(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Header Intro */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold tracking-wide uppercase mb-2 border border-orange-100">
          <Sparkles className="w-3.5 h-3.5" />
          Zero Attrito alla Cassa
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          La Ruota del Conto
        </h1>
        <p className="mt-2 text-slate-500 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          Gira il disco, estrai chi paga l&apos;intero conto. Karma divide la spesa tra i presenti (es. 20€ in quattro = 5€ a testa) e premia il pagatore con un moltiplicatore Karma 1.5x.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Amount & Attendees Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bill Amount Input Card */}
          <div className="apple-glass-card rounded-3xl p-6 border border-white">
            <label htmlFor="total-bill-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Importo Totale Conto (€)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-2xl font-bold text-slate-400">€</span>
              <input
                id="total-bill-input"
                type="number"
                step="0.5"
                min="1"
                max="5000"
                value={totalAmount || ''}
                onChange={(e) => setTotalAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-10 pr-4 py-3 text-3xl font-bold text-slate-900 bg-white/70 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 font-mono tabular-nums transition-all"
                placeholder="0.00"
                disabled={isSpinning}
              />
            </div>

            {/* Quick Amount Presets */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    haptics.playTap();
                    setTotalAmount(amt);
                  }}
                  disabled={isSpinning}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    totalAmount === amt
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  €{amt}
                </button>
              ))}
            </div>

            {/* Live split quote */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Quota per presente ({activeParticipants.length} persone):</span>
              <span className="font-bold text-slate-900 text-sm font-mono tabular-nums">
                €{splitResult.perPerson.toFixed(2)} cad.
              </span>
            </div>
          </div>

          {/* Participants & Ruota col Karma Switch */}
          <div className="apple-glass-card rounded-3xl p-6 border border-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                Presenti al tavolo ({activeParticipants.length}/{users.length})
              </div>
              <button
                type="button"
                onClick={() => setShowGuestInput(!showGuestInput)}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>+ Aggiungi Amico</span>
              </button>
            </div>

            {/* Quick add friend on the fly without an account */}
            {showGuestInput && (
              <form onSubmit={handleAddGuest} className="flex gap-2 animate-in fade-in">
                <input
                  type="text"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="Nome amico al tavolo (es. Carlo)"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Aggiungi
                </button>
              </form>
            )}

            {/* Ruota col Karma (Weighted probability toggle) */}
            <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-orange-950">
                <Scale className="w-4 h-4 text-orange-600 shrink-0" />
                <div>
                  <div className="font-bold">Ruota col Karma (Modalità Equità)</div>
                  <div className="text-[11px] text-orange-800/80">
                    Chi paga meno spesso ha più probabilità di uscire.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptics.playTap();
                  setUseKarmaWeight(!useKarmaWeight);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  useKarmaWeight ? 'bg-orange-500' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={useKarmaWeight}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                    useKarmaWeight ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {users.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user.id)}
                    disabled={isSpinning}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-orange-200 shadow-xs text-slate-900'
                        : 'bg-slate-50/60 border-slate-200/50 text-slate-400 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 bg-gradient-to-tr ${user.avatarBg}`}
                    >
                      {user.avatarEmoji}
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-semibold truncate leading-tight">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {user.karmaPoints} pts · {user.wheelsWon || 0} vinte
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: The Wheel Stage */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white w-full flex flex-col items-center relative overflow-hidden">
            {/* Pointer / Needle at top */}
            <div className="relative z-20 flex flex-col items-center mb-[-12px]">
              <div className="w-7 h-8 bg-gradient-to-b from-orange-500 to-amber-500 text-white rounded-b-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-amber-500" />
            </div>

            {/* Rotating Disk Container */}
            <div className="relative w-72 h-72 sm:w-88 sm:h-88 my-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-8 border-white/90 shadow-[0_12px_40px_rgba(255,107,74,0.15)] pointer-events-none" />

              {/* Wheel SVG */}
              <div
                ref={wheelRef}
                className="w-full h-full rounded-full transition-transform"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-xs">
                  {sectorBounds.map((bound, idx) => {
                    const user = activeParticipants[idx];
                    if (!user) return null;
                    const colorScheme = SECTOR_COLORS[idx % SECTOR_COLORS.length];

                    const radStart = ((bound.start - 90) * Math.PI) / 180;
                    const radEnd = ((bound.end - 90) * Math.PI) / 180;
                    const x1 = 200 + 195 * Math.cos(radStart);
                    const y1 = 200 + 195 * Math.sin(radStart);
                    const x2 = 200 + 195 * Math.cos(radEnd);
                    const y2 = 200 + 195 * Math.sin(radEnd);

                    const arcSpan = bound.end - bound.start;
                    const largeArcFlag = arcSpan > 180 ? 1 : 0;
                    const pathData = `M 200 200 L ${x1} ${y1} A 195 195 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    const textAngleRad = ((bound.center - 90) * Math.PI) / 180;
                    const textX = 200 + 120 * Math.cos(textAngleRad);
                    const textY = 200 + 120 * Math.sin(textAngleRad);

                    return (
                      <g key={user.id}>
                        <path
                          d={pathData}
                          fill={colorScheme.bg}
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill={colorScheme.text}
                          fontSize={arcSpan < 45 ? '12' : '15'}
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${bound.center}, ${textX}, ${textY})`}
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {user.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                  {/* Center Hub */}
                  <circle cx="200" cy="200" r="34" fill="#FFFFFF" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.08))" />
                  <circle cx="200" cy="200" r="28" fill="#F8F9FA" />
                  <circle cx="200" cy="200" r="10" fill="#FF6B4A" />
                </svg>
              </div>
            </div>

            {/* Primary Spin Action Button */}
            <div className="w-full max-w-xs mt-2">
              <button
                type="button"
                onClick={spinTheWheel}
                disabled={isSpinning || sectorCount < 2 || totalAmount <= 0}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 text-white font-bold text-base shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSpinning ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Estrazione in corso...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Gira la Ruota (€{totalAmount.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 text-center font-medium">
              {useKarmaWeight ? '⚖️ Modalità Equità attiva: chi paga meno ha più probabilità.' : 'Equa probabilità per tutti i presenti.'}
            </p>
          </div>
        </div>
      </div>

      {/* Post-Spin Result Modal */}
      {showResultModal && winningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="apple-glass rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white shadow-2xl relative overflow-hidden text-center">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-500 to-rose-500 p-1 shadow-lg shadow-orange-500/30 mb-4 animate-bounce">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-3xl">
                {winningUser.avatarEmoji}
              </div>
            </div>

            <div className="text-xs font-bold text-orange-600 tracking-wider uppercase mb-1">
              🎉 Estratto dal Destino
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 break-words leading-tight px-2">
              {winningUser.name} Paga il Conto!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Karma registra i crediti verso tutti gli altri presenti.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Conto totale saldato:</span>
                <span className="font-bold text-slate-900 font-mono">€{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Debito degli altri {activeParticipants.length - 1} verso {winningUser.name.split(' ')[0]}:</span>
                <span className="font-bold text-orange-600 font-mono">€{splitResult.perPerson.toFixed(2)} cad.</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-700">
                <span className="font-semibold text-emerald-700">Moltiplicatore Karma guadagnato:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">+{karmaReward} Pts</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmAndRecord}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Conferma e Salva</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
