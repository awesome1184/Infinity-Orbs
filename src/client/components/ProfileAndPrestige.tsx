import React from 'react';
import {
  Sparkles,
  Palette,
  RotateCcw,
  Check,
  Clover,
  Clock,
  Archive,
  BarChart3,
  Gem,
} from 'lucide-react';
import type {
  PlayerState,
  PrestigeUpgradeId,
  PrestigeUpgradeInfo,
  CosmeticItem,
} from '../../shared/game.js';
import {
  calculateCosmicDust,
  COSMETICS,
  PRESTIGE_UPGRADES,
} from '../../shared/game.js';
import { sound } from '../sound.js';

interface ProfileAndPrestigeProps {
  state: PlayerState;
  onPrestige: () => Promise<void>;
  onBuyPrestigeUpgrade: (id: PrestigeUpgradeId) => Promise<void>;
  onBuyCosmetic: (id: string) => Promise<void>;
  busy: boolean;
}

export const ProfileAndPrestige: React.FC<ProfileAndPrestigeProps> = ({
  state,
  onPrestige,
  onBuyPrestigeUpgrade,
  onBuyCosmetic,
  busy,
}) => {
  const [confirmingPrestige, setConfirmingPrestige] = React.useState(false);
  const fmt = (n: number) => n.toLocaleString();

  const pendingDust = calculateCosmicDust(state);
  const canPrestige = pendingDust > 0;

  const luckRatio = state.highestRarity > 0 ? state.totalRolls / state.highestRarity : 1;
  const luckRating =
    state.highestRarity >= 100000 && state.totalRolls < 5000
      ? 'Very Lucky'
      : luckRatio < 0.5
      ? 'Above Average'
      : luckRatio > 2.5
      ? 'Below Average'
      : 'Average';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 1. Statistics */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-black text-white">Player Statistics</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Luck Rating
            </span>
            <span className="text-sm font-black text-cyan-300 block truncate">
              {luckRating}
            </span>
            <span className="text-[10px] text-slate-500">Odds vs Rolls</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Rolls Since Best
            </span>
            <span className="text-sm font-black text-white block">
              {fmt(state.rollsSinceBest)}
            </span>
            <span className="text-[10px] text-slate-500">Current dry streak</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Lifetime Rolls
            </span>
            <span className="text-sm font-black text-white block">
              {fmt(state.totalRolls)}
            </span>
            <span className="text-[10px] text-slate-500">Total activations</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Prestiges
            </span>
            <span className="text-sm font-black text-fuchsia-300 block">
              {state.prestigeCount}
            </span>
            <span className="text-[10px] text-slate-500">Resets completed</span>
          </div>
        </div>
      </div>

      {/* 2. Prestige System */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-fuchsia-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">Prestige</h2>
                <span className="text-xs font-bold bg-slate-800 text-fuchsia-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                  {fmt(state.cosmicDust)} Cosmic Dust
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Resets coins and basic upgrades. Discovered collection and permanent upgrades are kept.
              </p>
            </div>
          </div>

          {confirmingPrestige ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setConfirmingPrestige(false);
                  void onPrestige();
                }}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-md active:scale-95 transition-all"
              >
                Confirm Reset (+{pendingDust} Dust)
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setConfirmingPrestige(false);
                }}
                className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                setConfirmingPrestige(true);
              }}
              disabled={!canPrestige || busy}
              className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                canPrestige
                  ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-md active:scale-95 cursor-pointer'
                  : 'bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-fuchsia-300" />
              <span>
                {canPrestige
                  ? `Prestige (+${pendingDust} Cosmic Dust)`
                  : 'Requires 1,000,000 Lifetime Collection Value'}
              </span>
            </button>
          )}
        </div>

        {/* Permanent Upgrades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {(Object.keys(PRESTIGE_UPGRADES) as PrestigeUpgradeId[]).map(id => {
            const info: PrestigeUpgradeInfo = PRESTIGE_UPGRADES[id];
            const currentLevel = state.prestigeUpgrades?.[id] ?? 0;
            const isMax = currentLevel >= info.maxLevel;
            const cost = isMax ? 0 : info.costPerLevel * (currentLevel + 1);
            const canAfford = state.cosmicDust >= cost && !isMax;

            const Icon =
              id === 'permLuck'
                ? Clover
                : id === 'permSpeed'
                ? Clock
                : id === 'vaultCap'
                ? Archive
                : Sparkles;

            return (
              <div
                key={id}
                className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-fuchsia-400" />
                      <span className="text-sm font-bold text-white">{info.name}</span>
                    </div>
                    <span className="text-xs font-bold text-fuchsia-400">
                      Lv {currentLevel}/{info.maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{info.desc}</p>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    void onBuyPrestigeUpgrade(id);
                  }}
                  disabled={!canAfford || busy || isMax}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isMax
                      ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-default'
                      : canAfford
                      ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-md active:scale-95'
                      : 'bg-slate-900 text-slate-500 border border-slate-800/80 cursor-not-allowed'
                  }`}
                >
                  {isMax ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Maxed Out</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Upgrade ({cost} Cosmic Dust)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Cosmetics */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white">Orb Skins</h3>
          </div>
          <span className="text-xs text-slate-400">
            {state.unlockedCosmetics.length}/{COSMETICS.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COSMETICS.map((cosmetic: CosmeticItem) => {
            const isOwned = state.unlockedCosmetics.includes(cosmetic.id);
            const isActive = state.activeCosmetic === cosmetic.id;
            const canAfford =
              state.coins >= cosmetic.costCoins &&
              (state.shards ?? 0) >= cosmetic.costShards;

            return (
              <div
                key={cosmetic.id}
                className={`bg-slate-950/60 border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                  isActive
                    ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                    : isOwned
                    ? 'border-slate-700'
                    : 'border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{cosmetic.name}</span>
                    {isActive && (
                      <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                        EQUIPPED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{cosmetic.desc}</p>
                </div>

                {isOwned ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      void onBuyCosmetic(cosmetic.id);
                    }}
                    disabled={isActive || busy}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-slate-500 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {isActive ? 'Equipped' : 'Equip Skin'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      void onBuyCosmetic(cosmetic.id);
                    }}
                    disabled={!canAfford || busy}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      canAfford
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95'
                        : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Gem className="w-3.5 h-3.5" />
                    <span>Unlock ({cosmetic.costShards} Shards)</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
