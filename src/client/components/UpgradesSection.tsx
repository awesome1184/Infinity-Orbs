import React from 'react';
import {
  Zap,
  Dice5,
  Bot,
  Clover,
  Flame,
  Check,
  Lock,
  Coins,
  Gem,
  ArrowRight,
  TrendingUp,
  Percent,
  Sparkles,
  Clock,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import type { PlayerState, UpgradeId } from '../../shared/game.js';
import {
  upgradeCost,
  cooldownMs,
  rollsPerActivation,
  luckMultiplier,
  effectiveOfflineTickMs,
  critMultiplier,
} from '../../shared/game.js';
import { sound } from '../sound.js';

interface UpgradesSectionProps {
  state: PlayerState;
  onBuyUpgrade: (id: UpgradeId) => Promise<void>;
  onActivateTurbo: () => Promise<void>;
  busy: boolean;
}

export const UpgradesSection: React.FC<UpgradesSectionProps> = ({
  state,
  onBuyUpgrade,
  onActivateTurbo,
  busy,
}) => {
  const fmt = (n: number) => n.toLocaleString();

  const currentCd = cooldownMs(state);
  const nextCd = cooldownMs({ ...state, upgrades: { ...state.upgrades, speed: (state.upgrades.speed ?? 0) + 1 } });
  const currentMulti = rollsPerActivation(state);
  const nextMultiSteps = [1, 2, 3, 5, 8, 12, 20, 50, 100];
  const nextMulti = nextMultiSteps[Math.min(nextMultiSteps.length - 1, (state.upgrades.multi ?? 0) + 1)];
  const currentLuckPct = Math.round((luckMultiplier(state) - 1) * 100);
  const nextLuckPct = currentLuckPct + 8;

  const isAutoUnlocked = (state.upgrades.auto ?? 0) > 0;
  const canUnlockAuto = state.totalRolls >= 10;

  const currentCoinBonusPct = (state.upgrades.coinBonus ?? 0) * 15;
  const currentShardChancePct = ((state.upgrades.shardChance ?? 0) * 0.5).toFixed(1);
  const currentXpBonusPct = (state.upgrades.xpBonus ?? 0) * 20;
  const currentCritChancePct = (state.upgrades.critChance ?? 0) * 3;

  const currentCritPower = critMultiplier(state).toFixed(2);
  const nextCritPower = (critMultiplier({
    ...state,
    upgrades: { ...state.upgrades, critPower: (state.upgrades.critPower ?? 0) + 1 },
  })).toFixed(2);

  const currentOfflineSec = Math.round(effectiveOfflineTickMs(state) / 1000);
  const nextOfflineSec = Math.round(
    effectiveOfflineTickMs({
      ...state,
      upgrades: { ...state.upgrades, offlineRate: (state.upgrades.offlineRate ?? 0) + 1 },
    }) / 1000
  );

  const currentValueBonusPct = (state.upgrades.valueBonus ?? 0) * 10;

  const upgradesData: {
    id: UpgradeId;
    title: string;
    icon: React.ReactNode;
    level: number;
    currentVal: string;
    nextVal: string;
    desc: string;
    cost: number;
    locked?: boolean;
    lockMsg?: string;
  }[] = [
    {
      id: 'speed',
      title: 'Roll Speed',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      level: state.upgrades.speed ?? 0,
      currentVal: `${(currentCd / 1000).toFixed(1)}s`,
      nextVal: `${(nextCd / 1000).toFixed(1)}s`,
      desc: '-8% roll cooldown per level.',
      cost: upgradeCost('speed', state.upgrades.speed ?? 0),
    },
    {
      id: 'multi',
      title: 'Multi Roll',
      icon: <Dice5 className="w-5 h-5 text-purple-400" />,
      level: state.upgrades.multi ?? 0,
      currentVal: `×${currentMulti}`,
      nextVal: `×${nextMulti}`,
      desc: 'Roll multiple orbs simultaneously.',
      cost: upgradeCost('multi', state.upgrades.multi ?? 0),
    },
    {
      id: 'luck',
      title: 'Luck Multiplier',
      icon: <Clover className="w-5 h-5 text-emerald-400" />,
      level: state.upgrades.luck ?? 0,
      currentVal: `+${currentLuckPct}%`,
      nextVal: `+${nextLuckPct}%`,
      desc: '+8% luck per level.',
      cost: upgradeCost('luck', state.upgrades.luck ?? 0),
    },
    {
      id: 'auto',
      title: 'Auto Roll',
      icon: <Bot className="w-5 h-5 text-cyan-400" />,
      level: state.upgrades.auto ?? 0,
      currentVal: isAutoUnlocked ? 'Active' : 'Locked',
      nextVal: isAutoUnlocked ? 'Max' : 'Active',
      desc: 'Rolls automatically when cooldown finishes.',
      cost: upgradeCost('auto', state.upgrades.auto ?? 0),
      locked: !isAutoUnlocked && !canUnlockAuto,
      lockMsg: `Unlocks after 10 rolls (${state.totalRolls}/10)`,
    },
    {
      id: 'coinBonus',
      title: 'Coin Bonus',
      icon: <TrendingUp className="w-5 h-5 text-yellow-400" />,
      level: state.upgrades.coinBonus ?? 0,
      currentVal: `+${currentCoinBonusPct}%`,
      nextVal: `+${currentCoinBonusPct + 15}%`,
      desc: '+15% coins earned per level.',
      cost: upgradeCost('coinBonus', state.upgrades.coinBonus ?? 0),
    },
    {
      id: 'shardChance',
      title: 'Shard Drop Chance',
      icon: <Gem className="w-5 h-5 text-cyan-400" />,
      level: state.upgrades.shardChance ?? 0,
      currentVal: `${currentShardChancePct}%`,
      nextVal: `${(((state.upgrades.shardChance ?? 0) + 1) * 0.5).toFixed(1)}%`,
      desc: '+0.5% chance to find a Shard on rolls per level.',
      cost: upgradeCost('shardChance', state.upgrades.shardChance ?? 0),
    },
    {
      id: 'xpBonus',
      title: 'XP Bonus',
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      level: state.upgrades.xpBonus ?? 0,
      currentVal: `+${currentXpBonusPct}%`,
      nextVal: `+${currentXpBonusPct + 20}%`,
      desc: '+20% player XP per roll per level.',
      cost: upgradeCost('xpBonus', state.upgrades.xpBonus ?? 0),
    },
    {
      id: 'critChance',
      title: 'Critical Chance',
      icon: <Percent className="w-5 h-5 text-rose-400" />,
      level: state.upgrades.critChance ?? 0,
      currentVal: `${currentCritChancePct}%`,
      nextVal: `${currentCritChancePct + 3}%`,
      desc: '+3% chance for a critical roll per level.',
      cost: upgradeCost('critChance', state.upgrades.critChance ?? 0),
    },
    {
      id: 'critPower',
      title: 'Critical Multiplier',
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      level: state.upgrades.critPower ?? 0,
      currentVal: `${currentCritPower}×`,
      nextVal: `${nextCritPower}×`,
      desc: '+0.25x critical rarity multiplier per level.',
      cost: upgradeCost('critPower', state.upgrades.critPower ?? 0),
    },
    {
      id: 'offlineRate',
      title: 'Offline Generation Speed',
      icon: <Clock className="w-5 h-5 text-teal-400" />,
      level: state.upgrades.offlineRate ?? 0,
      currentVal: `1 roll / ${currentOfflineSec}s`,
      nextVal: `1 roll / ${nextOfflineSec}s`,
      desc: 'Offline rolls accumulate faster.',
      cost: upgradeCost('offlineRate', state.upgrades.offlineRate ?? 0),
    },
    {
      id: 'valueBonus',
      title: 'Value Multiplier',
      icon: <Layers className="w-5 h-5 text-fuchsia-400" />,
      level: state.upgrades.valueBonus ?? 0,
      currentVal: `+${currentValueBonusPct}%`,
      nextVal: `+${currentValueBonusPct + 10}%`,
      desc: '+10% collection value from all rolls per level.',
      cost: upgradeCost('valueBonus', state.upgrades.valueBonus ?? 0),
    },
  ];

  const isTurboActive = Boolean(state.turboRollUntil && state.turboRollUntil > Date.now());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info & Stats Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-black text-white">Upgrades</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Spend coins on upgrades for this run.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{fmt(state.coins)} Coins</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span>{fmt(state.shards ?? 0)} Shards</span>
            </div>
          </div>
        </div>

        {/* Live Active Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              Roll Cooldown
            </span>
            <span className="text-sm font-black text-amber-300 font-mono">
              {(currentCd / 1000).toFixed(1)}s
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              Total Luck
            </span>
            <span className="text-sm font-black text-emerald-300 font-mono">
              +{currentLuckPct}%
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              Crit Stats
            </span>
            <span className="text-sm font-black text-rose-300 font-mono">
              {currentCritChancePct}% ({currentCritPower}×)
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
              Offline Rate
            </span>
            <span className="text-sm font-black text-teal-300 font-mono">
              1 roll / {currentOfflineSec}s
            </span>
          </div>
        </div>
      </div>

      {/* Upgrades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upgradesData.map(u => {
          const canAfford = Number.isFinite(u.cost) && state.coins >= u.cost;
          const isMaxed = !Number.isFinite(u.cost);

          return (
            <div
              key={u.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {u.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{u.title}</h3>
                      <span className="text-[11px] font-bold text-slate-400">
                        Level {u.level}
                      </span>
                    </div>
                  </div>

                  {/* Value Delta */}
                  <div className="text-right text-xs">
                    <div className="flex items-center gap-1 font-mono font-bold text-slate-300">
                      <span>{u.currentVal}</span>
                      {!isMaxed && (
                        <>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-cyan-400">{u.nextVal}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  {u.desc}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {u.locked ? (
                  <button
                    disabled
                    className="w-full bg-slate-950 border border-slate-800 text-slate-500 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{u.lockMsg}</span>
                  </button>
                ) : isMaxed ? (
                  <button
                    disabled
                    className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Max Level</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      void onBuyUpgrade(u.id);
                    }}
                    disabled={!canAfford || busy}
                    className={`w-full font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-900/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/40'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Upgrade ({fmt(u.cost)} Coins)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Turbo Booster */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Turbo Booster</h3>
              <p className="text-xs text-slate-400">
                Reduces cooldown by 20% for 30 minutes (or 30% for 60m with prestige upgrade).
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              void onActivateTurbo();
            }}
            disabled={(state.shards ?? 0) < 5 || isTurboActive || busy}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              isTurboActive
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 cursor-default'
                : (state.shards ?? 0) >= 5
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Gem className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isTurboActive ? 'Booster Active' : 'Activate (5 Shards)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
