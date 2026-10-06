import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Share2,
  Zap,
  Flame,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Coins,
  Crown,
  BellRing,
  FastForward,
  Radio,
  Filter,
  Compass,
} from 'lucide-react';
import type { PlayerState, Orb } from '../../shared/game.js';
import {
  cooldownMs,
  rollsPerActivation,
  luckMultiplier,
  getOrbInfo,
  coinsForRarity,
  CONTINUUM_TIERS,
} from '../../shared/game.js';
import { sound } from '../sound.js';

interface RollSectionProps {
  state: PlayerState;
  lastOrb: Orb | null;
  lastBatch: Orb[];
  batchSummary: { totalVal: number; coins: number; shards: number; xp: number } | null;
  readyAt: number;
  now: number;
  busy: boolean;
  autoRoll: boolean;
  onToggleAutoRoll: () => void;
  onRoll: () => Promise<void>;
  onOpenShareModal: (rarity: number) => void;
}

function formatCompactRarity(r: number): string {
  if (r >= 1_000_000_000) return `${(r / 1_000_000_000).toFixed(1)}B`;
  if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(1)}M`;
  if (r >= 10_000) return `${Math.round(r / 1_000)}k`;
  if (r >= 1_000) return `${(r / 1_000).toFixed(1)}k`;
  return r.toLocaleString();
}

export const RollSection: React.FC<RollSectionProps> = ({
  state,
  lastOrb,
  lastBatch,
  batchSummary,
  readyAt,
  now,
  busy,
  autoRoll,
  onToggleAutoRoll,
  onRoll,
  onOpenShareModal,
}) => {
  const [showBatchDetails, setShowBatchDetails] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [cooldownNotice, setCooldownNotice] = useState<string | null>(null);
  const [sonarActive, setSonarActive] = useState(() => sound.sonarMode);
  const [sonarThreshold, setSonarThresholdState] = useState(() => sound.sonarThreshold);
  const [sonarPinging, setSonarPinging] = useState(false);
  const [instantRevealActive, setInstantRevealActive] = useState(() => {
    try {
      return localStorage.getItem('orbs_instant_reveal') === 'true';
    } catch {
      return false;
    }
  });

  const prevOrbRef = useRef<Orb | null>(null);
  const lastFanfareTimeRef = useRef<number>(0);

  const hasSonarUpgrade = (state.prestigeUpgrades?.sonarPing ?? 0) > 0;
  const hasInstantUpgrade = (state.prestigeUpgrades?.instantReveal ?? 0) > 0;
  const hasFilterUpgrade = (state.prestigeUpgrades?.autoFilter ?? 0) > 0;
  const hasResonanceUpgrade = (state.prestigeUpgrades?.resonanceMeter ?? 0) > 0;

  const [filterActive, setFilterActive] = useState(() => {
    try {
      return localStorage.getItem('orbs_auto_filter') !== 'false';
    } catch {
      return true;
    }
  });

  const cd = cooldownMs(state, autoRoll);
  const remain = Math.max(0, readyAt - now);
  const canRoll = remain <= 0 && !busy;
  const multi = rollsPerActivation(state);
  const luck = luckMultiplier(state);
  const isAutoUnlocked = (state.upgrades.auto ?? 0) > 0;
  const isTurbo = Boolean(state.turboRollUntil && state.turboRollUntil > now);
  const xpProgress = state.xp % 100;
  const tiersReached = CONTINUUM_TIERS.filter(tier => (state.highestRarity || 0) >= tier.minRarity).length;
  const nextTier = CONTINUUM_TIERS.find(tier => (state.highestRarity || 0) < tier.minRarity);

  // Smooth or instant reveal on new roll
  useEffect(() => {
    if (!lastOrb) return;
    if (prevOrbRef.current === lastOrb) return;
    prevOrbRef.current = lastOrb;

    if (!hasInstantUpgrade || !instantRevealActive) {
      setIsRevealing(true);
      const revealTimer = setTimeout(() => {
        setIsRevealing(false);
      }, 400);
      return () => clearTimeout(revealTimer);
    } else {
      setIsRevealing(false);
    }

    // Audio & celebratory fanfare (throttled to avoid stutter at high speeds)
    const nowTs = Date.now();
    const isSilentSonar = hasSonarUpgrade && sound.sonarMode;

    if (isSilentSonar) {
      // In Celestial Sonar Silent Mode: only ping on rare orbs!
      if (lastOrb.rarity >= sound.sonarThreshold) {
        sound.playSonarPing(lastOrb.rarity);
        setSonarPinging(true);
        const timer = setTimeout(() => setSonarPinging(false), 900);
        return () => clearTimeout(timer);
      }
    } else {
      if (lastOrb.rarity >= 100_000 && nowTs - lastFanfareTimeRef.current > 1200) {
        lastFanfareTimeRef.current = nowTs;
        sound.playMythicFanfare();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#38bdf8', '#fbbf24'],
        });
      } else if (lastOrb.rarity >= 1_000 && nowTs - lastFanfareTimeRef.current > 800) {
        lastFanfareTimeRef.current = nowTs;
        sound.playEpicFanfare();
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#fb923c', '#4ade80', '#38bdf8'],
        });
      } else {
        sound.playRollNormal();
      }
    }
  }, [lastOrb, hasInstantUpgrade, instantRevealActive, hasSonarUpgrade]);

  const displayOrb = lastOrb;
  const orbInfo = displayOrb ? getOrbInfo(displayOrb.rarity) : null;

  const cosmeticEffectClass =
    state.activeCosmetic === 'galaxy'
      ? 'ring-4 ring-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.35)]'
      : state.activeCosmetic === 'solar'
      ? 'ring-4 ring-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.4)]'
      : state.activeCosmetic === 'cyber'
      ? 'ring-4 ring-cyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.35)]'
      : state.activeCosmetic === 'emerald'
      ? 'ring-4 ring-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.35)]'
      : state.activeCosmetic === 'divine'
      ? 'ring-4 ring-yellow-300/70 shadow-[0_0_60px_rgba(253,224,71,0.45)]'
      : 'shadow-[0_0_35px_rgba(99,102,241,0.2)]';

  // Handle click on roll button or center orb
  const handleRollClick = () => {
    if (canRoll) {
      sound.playClick();
      setCooldownNotice(null);
      void onRoll();
    } else if (remain > 0) {
      sound.playClick();
      setCooldownNotice(`Cooldown active (${(remain / 1000).toFixed(1)}s remaining)`);
      setTimeout(() => setCooldownNotice(null), 1500);
    }
  };

  // Satellite orbiting orbs calculation
  const hasMultipleOrbs = lastBatch && lastBatch.length > 1;
  const maxSatellites = 8;
  const satellitesToRender = hasMultipleOrbs
    ? lastBatch.slice(0, maxSatellites)
    : [];
  const extraBatchCount = hasMultipleOrbs ? Math.max(0, lastBatch.length - maxSatellites) : 0;
  // Radius of the orbit path (clears the central orb with ample buffer space)
  const orbitRadius = typeof window !== 'undefined' && window.innerWidth < 400 ? 118 : 152;

  return (
    <div className="roll-layout">
      <section className="roll-main">
      <div className="roll-heading">
        <div>
          <span className="roll-kicker">Infinity Orbs / Field Log</span>
          <h2 className="roll-title">Reach beyond the known.</h2>
          <p className="roll-intro">Every roll opens a new point in the continuum.</p>
        </div>
        <span className="signal-live">Signal clear</span>
      </div>

      {/* Turbo Roll Active Banner */}
      {isTurbo && (
        <div className="w-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-1.5 font-bold">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>TURBO ACTIVE (-20% Cooldown)</span>
          </div>
          <span className="font-mono font-medium">
            {Math.ceil((state.turboRollUntil - now) / 60000)}m left
          </span>
        </div>
      )}

      {/* Main Celestial Orb Stage (Orbits & Main Orb are concentric and centered together) */}
      <div className="roll-stage relative w-full flex items-center justify-center select-none">
        {/* Ambient Glow Background centered on orb */}
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
          style={{
            backgroundColor: orbInfo ? orbInfo.color : '#6366f1',
          }}
        />

        {/* Orbiting Satellite Orbs Container (Concentric with central orb) */}
        {hasMultipleOrbs && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Circular Orbit Path Guide Line */}
            <div
              className="absolute rounded-full border border-dashed border-slate-700/50 pointer-events-none"
              style={{
                width: `${orbitRadius * 2}px`,
                height: `${orbitRadius * 2}px`,
              }}
            />

            {/* The Rotating Anchor Ring */}
            <div className="relative w-0 h-0 animate-orbit-ring pointer-events-auto">
              {satellitesToRender.map((satelliteOrb, idx) => {
                const total = satellitesToRender.length + (extraBatchCount > 0 ? 1 : 0);
                const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                const x = Math.round(Math.cos(angle) * orbitRadius);
                const y = Math.round(Math.sin(angle) * orbitRadius);
                const info = getOrbInfo(satelliteOrb.rarity);
                const isWinner = displayOrb && satelliteOrb.rarity === displayOrb.rarity;

                return (
                  <div
                    key={idx}
                    className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-500"
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                    }}
                  >
                    {/* Counter-rotate each satellite orb chip so labels stay upright */}
                    <div
                      className={`animate-orbit-counter flex flex-col items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
                        isWinner
                          ? 'w-10 h-10 ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.6)] scale-110'
                          : 'w-8 h-8 border border-white/20 shadow-md hover:scale-110'
                      }`}
                      style={{
                        background: info.bgGradient,
                      }}
                      title={`${info.tier}: 1 / ${satelliteOrb.rarity.toLocaleString()}`}
                    >
                      {isWinner && (
                        <Crown className="w-2.5 h-2.5 text-amber-300 drop-shadow mb-0.5" />
                      )}
                      <span className="text-[9px] font-black text-white font-mono leading-none drop-shadow">
                        {formatCompactRarity(satelliteOrb.rarity)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Extra Count Satellite Pill if batch is larger than displayed slots */}
              {extraBatchCount > 0 && (
                <div
                  className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${Math.round(Math.cos(((satellitesToRender.length) / (satellitesToRender.length + 1)) * 2 * Math.PI - Math.PI / 2) * orbitRadius)}px`,
                    top: `${Math.round(Math.sin(((satellitesToRender.length) / (satellitesToRender.length + 1)) * 2 * Math.PI - Math.PI / 2) * orbitRadius)}px`,
                  }}
                >
                  <div
                    className="animate-orbit-counter w-8 h-8 rounded-full bg-slate-900/95 border border-purple-500/40 text-purple-300 text-[10px] font-black flex items-center justify-center shadow-lg"
                    title={`${extraBatchCount} more orbs rolled in this batch`}
                  >
                    +{extraBatchCount}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Celestial Sonar Radar Pulse Wave on Rare Drops */}
        {sonarPinging && (
          <div className="absolute z-0 w-48 h-48 rounded-full border-4 border-cyan-400/90 animate-ping pointer-events-none" />
        )}

        {/* The Central Main Orb */}
        <div
          onClick={handleRollClick}
          className={`orb-core relative z-10 w-44 h-44 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center transition-all duration-500 transform cursor-pointer active:scale-95 ${cosmeticEffectClass} ${
            isRevealing ? 'scale-105 ring-4 ring-white/60' : 'hover:scale-102'
          }`}
          style={{
            background: orbInfo
              ? orbInfo.bgGradient
              : 'radial-gradient(circle at 35% 30%, #6366f1, #312e81 65%, #0f172a)',
          }}
        >
          {/* Subtle Inner Glass Ring */}
          <div className="absolute inset-2 rounded-full border border-white/20 pointer-events-none" />

          {/* Rarity & Name Presentation */}
          <div className="relative z-10 text-center px-4">
            <span
              className="text-[11px] font-black uppercase tracking-widest block mb-1 drop-shadow"
              style={{ color: orbInfo ? orbInfo.color : '#cbd5e1' }}
            >
              {orbInfo ? orbInfo.tier : 'READY'}
            </span>

            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md font-mono">
              {displayOrb
                ? `1 / ${displayOrb.rarity.toLocaleString()}`
                : '1 / ∞'}
            </div>

            <div className="text-xs font-semibold text-white/90 mt-1 drop-shadow">
              {orbInfo ? orbInfo.name : 'Tap to Roll'}
            </div>
          </div>

          {/* Critical Roll Badge */}
          {displayOrb?.isCrit && (
            <div className="absolute -top-6 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-lg border border-amber-300">
              ⚡ 2× CRITICAL ROLL
            </div>
          )}

          {/* New Discovery Badge */}
          {displayOrb?.isNew && (
            <div className="absolute -top-2 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-lg">
              ★ NEW ORB
            </div>
          )}
        </div>
      </div>

      {/* Orbit & Roll Status Callouts (sitting comfortably below the orb and satellites) */}
      <div className="roll-cooldown w-full flex flex-col items-center space-y-2">
        {/* Multi-Roll Orbit Callout Badge */}
        {hasMultipleOrbs && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full shadow-sm">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Showing best of {lastBatch.length} circling orbs</span>
          </div>
        )}

        {/* Coins Yield Callout */}
        {displayOrb && !hasMultipleOrbs && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full shadow-sm">
            <Coins className="w-3.5 h-3.5" />
            <span>+{coinsForRarity(displayOrb.rarity).toLocaleString()} Coins</span>
          </div>
        )}

        {/* Cooldown Timer */}
        <div className="text-center pt-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {canRoll ? 'READY TO ROLL' : `COOLDOWN: ${(remain / 1000).toFixed(1)}s`}
          </div>
          {/* Progress Bar */}
          <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-200"
              style={{
                width: canRoll ? '100%' : `${Math.min(100, ((cd - remain) / cd) * 100)}%`,
              }}
            />
          </div>
          {cooldownNotice && (
            <div className="text-[11px] text-amber-400 mt-1 font-medium animate-in fade-in duration-200">
              {cooldownNotice}
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        <button
          onClick={handleRollClick}
          className={`roll-button ${canRoll ? 'is-ready' : 'is-waiting'} w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg tracking-wide shadow-xl transition-all transform duration-150 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
            canRoll
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-indigo-500/25 hover:shadow-cyan-500/30'
              : busy
              ? 'bg-slate-800 text-slate-400 cursor-wait'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700'
          }`}
        >
          <Sparkles className="w-5 h-5 text-cyan-300" />
          <span>
            {busy
              ? 'ROLLING...'
              : remain > 0
              ? `WAIT ${(remain / 1000).toFixed(1)}s`
              : `ROLL ${multi > 1 ? `×${multi}` : ''}`}
          </span>
        </button>

        {/* Control Toggles: Auto Roll, Sonar Mode, Instant Chrono-Skip */}
        <div className="roll-controls flex flex-wrap items-center justify-center gap-2 w-full">
          {/* Auto Roll Toggle */}
          {isAutoUnlocked ? (
            <button
              onClick={() => {
                sound.playClick();
                onToggleAutoRoll();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                autoRoll
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${autoRoll ? 'text-emerald-400' : ''}`} />
              <span>Auto Roll: {autoRoll ? 'ON' : 'OFF'}</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Auto Roll unlocks at 10 total rolls ({state.totalRolls}/10)</span>
            </div>
          )}

          {/* Celestial Sonar Silent Mode Toggle (Unlocked via Prestige) */}
          {hasSonarUpgrade && (
            <button
              onClick={() => {
                const next = !sonarActive;
                setSonarActive(next);
                sound.setSonarMode(next);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                sonarActive
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Silent Mode: Mutes standard rolls and alerts with a crystal chime on rare drops"
            >
              <BellRing className={`w-3.5 h-3.5 ${sonarActive ? 'text-cyan-400 animate-pulse' : ''}`} />
              <span>Sonar Ping: {sonarActive ? 'SILENT' : 'OFF'}</span>
            </button>
          )}

          {/* Chrono-Skip Instant Multi-Roll (Unlocked via Prestige) */}
          {hasInstantUpgrade && (
            <button
              onClick={() => {
                const next = !instantRevealActive;
                setInstantRevealActive(next);
                try {
                  localStorage.setItem('orbs_instant_reveal', String(next));
                } catch {}
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                instantRevealActive
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25 ring-1 ring-purple-500/30'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Skip roll animations for instant reveals"
            >
              <FastForward className={`w-3.5 h-3.5 ${instantRevealActive ? 'text-purple-400' : ''}`} />
              <span>Chrono-Skip: {instantRevealActive ? 'INSTANT' : 'OFF'}</span>
            </button>
          )}

          {/* Singularity Filter Toggle (Unlocked via Prestige) */}
          {hasFilterUpgrade && (
            <button
              onClick={() => {
                const next = !filterActive;
                setFilterActive(next);
                try {
                  localStorage.setItem('orbs_auto_filter', String(next));
                } catch {}
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95 ${
                filterActive
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Salvages Common & Uncommon rolls directly into +25% bonus gold"
            >
              <Filter className={`w-3.5 h-3.5 ${filterActive ? 'text-emerald-400' : ''}`} />
              <span>Filter: {filterActive ? 'SALVAGE' : 'OFF'}</span>
            </button>
          )}
        </div>

        {/* Pity Meter Gauge (Unlocked via Prestige) */}
        {hasResonanceUpgrade && (
          <div className="w-full bg-slate-900/80 border border-indigo-900/50 rounded-2xl p-3 shadow-md space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>Pity Luck Meter</span>
              </div>
              <span className="font-mono text-cyan-300 font-bold">
                +{((state.prestigeUpgrades?.resonanceMeter ?? 1) * Math.min(100, Math.floor((state.rollsSinceBest ?? 0) / 20)))}% Pity Luck
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                style={{
                  width: `${Math.min(100, (((state.rollsSinceBest ?? 0) % 20) / 20) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
              <span>{((state.rollsSinceBest ?? 0) % 20)} / 20 rolls to next tier</span>
              <span>Dry streak: {state.rollsSinceBest ?? 0} rolls</span>
            </div>
          </div>
        )}

        {/* Sonar Ping Threshold Config Selector when active */}
        {hasSonarUpgrade && sonarActive && (
          <div className="flex items-center gap-2 bg-slate-950/80 border border-cyan-900/40 rounded-xl px-3 py-1.5 text-[11px]">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-400 font-semibold">Ping On:</span>
            <div className="flex items-center gap-1">
              {[
                { label: 'Rare (1/100)', val: 100 },
                { label: 'Epic (1/1k)', val: 1_000 },
                { label: 'Legendary (1/10k)', val: 10_000 },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setSonarThresholdState(opt.val);
                    sound.setSonarThreshold(opt.val);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    sonarThreshold === opt.val
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Multi Roll Batch Results Summary */}
      {batchSummary && multi > 1 && (
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold text-white">
                {lastBatch.length} Orbs Rolled
              </span>
              <span className="text-xs text-slate-400">
                (Best: 1/{lastOrb?.rarity.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-amber-400">
                +{batchSummary.coins.toLocaleString()} Coins
              </span>
              {batchSummary.shards > 0 && (
                <span className="text-xs font-semibold text-cyan-400">
                  +{batchSummary.shards} Shards
                </span>
              )}
              <button
                onClick={() => {
                  sound.playClick();
                  setShowBatchDetails(!showBatchDetails);
                }}
                className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
                title="Toggle batch breakdown"
              >
                {showBatchDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Batch Breakdown Grid */}
          {showBatchDetails && (
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {lastBatch.map((orb, i) => {
                const info = getOrbInfo(orb.rarity);
                const isBest = displayOrb && orb.rarity === displayOrb.rarity;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      isBest
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                        : 'bg-slate-950/60 border border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-mono">
                      {isBest && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                      <span>1/{orb.rarity.toLocaleString()}</span>
                    </div>
                    <span className="font-bold text-[10px]" style={{ color: info.color }}>
                      {info.tier}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Share to Reddit Action */}
      {lastOrb && lastOrb.rarity >= 100 && (
        <button
          onClick={() => {
            sound.playClick();
            onOpenShareModal(lastOrb.rarity);
          }}
          className="flex items-center gap-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share 1/{lastOrb.rarity.toLocaleString()} to Reddit</span>
        </button>
      )}

      {/* Quick Specs Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full text-center text-xs">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Cooldown</span>
          <span className="font-bold text-slate-200">{(cd / 1000).toFixed(1)}s</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Multi Roll</span>
          <span className="font-bold text-slate-200">×{multi}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Luck Bonus</span>
          <span className="font-bold text-cyan-300">+{Math.round((luck - 1) * 100)}%</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
          <span className="text-slate-500 block text-[10px] font-semibold uppercase">Level Bonus</span>
          <span className="font-bold text-purple-300">+{Math.max(0, state.level - 1)}% Luck</span>
        </div>
      </div>
      </section>

      <aside className="roll-sidebar" aria-label="Run summary">
        <section className="field-card">
          <div className="field-card-header">
            <span className="field-label">Your run</span>
            <span className="field-label">{state.prestigeCount > 0 ? `Cycle ${state.prestigeCount + 1}` : 'First cycle'}</span>
          </div>
          <div className="field-level"><strong>{state.level}</strong><span>research level</span></div>
          <div className="field-progress" aria-label={`${xpProgress}% to next level`}><span style={{ width: `${xpProgress}%` }} /></div>
          <div className="field-stat-list">
            <div className="field-stat-row"><span>Rolls logged</span><strong>{state.totalRolls.toLocaleString()}</strong></div>
            <div className="field-stat-row"><span>Best signal</span><strong>1 / {(state.highestRarity || 0).toLocaleString()}</strong></div>
            <div className="field-stat-row"><span>Orbs catalogued</span><strong>{Object.values(state.collection || {}).filter(count => count > 0).length.toLocaleString()}</strong></div>
          </div>
        </section>

        <section className="field-card">
          <div className="field-card-header">
            <span className="field-label">Latest discovery</span>
            {displayOrb?.isNew && <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300">New</span>}
          </div>
          {displayOrb ? (
            <div className="latest-orb">
              <div className="latest-orb-mark"><Award className="h-5 w-5" /></div>
              <div className="min-w-0">
                <div className="latest-orb-name">{displayOrb.name}</div>
                <div className="latest-orb-rarity">1 / {displayOrb.rarity.toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <p className="field-empty">The first signal is waiting. Roll to record your opening discovery.</p>
          )}
          {displayOrb && orbInfo && <div className="field-stat-row mt-3 !border-t-0 !pt-0"><span>Continuum class</span><strong style={{ color: orbInfo.color }}>{orbInfo.tier}</strong></div>}
        </section>

        <section className="field-card">
          <div className="field-card-header">
            <span className="field-label">Next horizon</span>
            <span className="text-[10px] font-bold text-teal-200">{tiersReached} / {CONTINUUM_TIERS.length}</span>
          </div>
          {nextTier ? (
            <>
              <div className="field-level"><strong className="!text-[21px]">{nextTier.tier}</strong><span>tier</span></div>
              <div className="field-stat-row mt-2"><span>Threshold</span><strong>1 / {nextTier.minRarity.toLocaleString()}</strong></div>
            </>
          ) : (
            <p className="field-empty">Every listed horizon is behind you. The continuum keeps going.</p>
          )}
          <p className="field-note mt-3">“The rarest things are <em>still out there.</em>”</p>
        </section>
      </aside>
    </div>
  );
};
