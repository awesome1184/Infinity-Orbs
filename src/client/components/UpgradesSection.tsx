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
} from 'lucide-react';
import type { PlayerState, UpgradeId } from '../../shared/game.js';
import {
  upgradeCost,
  cooldownMs,
  rollsPerActivation,
  luckMultiplier,
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
  const nextCd = cooldownMs({ ...state, upgrades: { ...state.upgrades, speed: state.upgrades.speed + 1 } });
  const currentMulti = rollsPerActivation(state);
  const nextMultiSteps = [1, 2, 3, 5, 10, 25, 50, 100];
  const nextMulti = nextMultiSteps[Math.min(nextMultiSteps.length - 1, (state.upgrades.multi ?? 0) + 1)];
  const currentLuckPct = Math.round((luckMultiplier(state) - 1) * 100);
  const nextLuckPct = currentLuckPct + 8;

  const isAutoUnlocked = (state.upgrades.auto ?? 0) > 0;
  const canUnlockAuto = state.totalRolls >= 10;

  const upgradesData: {
    id: UpgradeId;
    title: string;
    icon: React.ReactNode;
    color: string;
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
      color: 'amber',
      level: state.upgrades.speed,
      currentVal: `${(currentCd / 1000).toFixed(1)}s`,
      nextVal: `${(nextCd / 1000).toFixed(1)}s`,
      desc: 'Decreases roll cooldown by 12% per rank (down to 0.8s).',
      cost: upgradeCost('speed', state.upgrades.speed),
    },
    {
      id: 'multi',
      title: 'Multi Roll',
      icon: <Dice5 className="w-5 h-5 text-purple-400" />,
      color: 'purple',
      level: state.upgrades.multi,
      currentVal: `×${currentMulti}`,
      nextVal: `×${nextMulti}`,
      desc: 'Rolls multiple orbs at once. Collects coins from all, keeps highest rarity.',
      cost: upgradeCost('multi', state.upgrades.multi),
    },
    {
      id: 'luck',
      title: 'Luck',
      icon: <Clover className="w-5 h-5 text-emerald-400" />,
      color: 'emerald',
      level: state.upgrades.luck,
      currentVal: `+${currentLuckPct}%`,
      nextVal: `+${nextLuckPct}%`,
      desc: 'Increases chances of rolling higher rarities by 8% per rank.',
      cost: upgradeCost('luck', state.upgrades.luck),
    },
    {
      id: 'auto',
      title: 'Auto Roll',
      icon: <Bot className="w-5 h-5 text-cyan-400" />,
      color: 'cyan',
      level: state.upgrades.auto,
      currentVal: isAutoUnlocked ? 'Active' : 'Locked',
      nextVal: isAutoUnlocked ? 'Max' : 'Active',
      desc: 'Rolls automatically whenever cooldown finishes.',
      cost: upgradeCost('auto', state.upgrades.auto),
      locked: !isAutoUnlocked && !canUnlockAuto,
      lockMsg: `Unlocks after 10 rolls (${state.totalRolls}/10)`,
    },
  ];

  const isTurboActive = Boolean(state.turboRollUntil && state.turboRollUntil > Date.now());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white">Upgrades</h2>
          <p className="text-xs text-slate-400">
            Spend coins earned from rolls to increase speed, multi-roll throughput, and luck.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl w-fit">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{fmt(state.coins)} Coins</span>
        </div>
      </div>

      {/* Upgrades List */}
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
                        Rank {u.level}
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
                    <span>Max Rank</span>
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
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-900/20 active:scale-95'
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
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Turbo Roll Booster</h3>
              <p className="text-xs text-slate-400">
                Reduces cooldown by 20% for 30 minutes.
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
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg active:scale-95'
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
