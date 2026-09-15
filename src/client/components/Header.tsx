import React from 'react';
import { Volume2, VolumeX, Sparkles, HelpCircle, Coins, Gem, Zap, Wrench } from 'lucide-react';
import type { PlayerState } from '../../shared/game.js';
import { sound } from '../sound.js';

interface HeaderProps {
  state: PlayerState;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenOdds: () => void;
  onClaimOffline: () => void;
  onOpenDevDebug?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  soundEnabled,
  onToggleSound,
  onOpenOdds,
  onClaimOffline,
  onOpenDevDebug,
}) => {
  const fmt = (n: number) => n.toLocaleString();

  return (
    <header className="bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Player Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-cyan-200">
              ∞
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                ORBS <span className="text-xs font-normal text-slate-400 hidden sm:inline">• The Infinite Roll</span>
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Lv {state.level}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-none">
              Rolls: {fmt(state.totalRolls)} • Best: 1/{fmt(state.highestRarity || 0)}
            </p>
          </div>
        </div>

        {/* Currencies & Global Actions */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {/* Currencies */}
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold">
            {/* Coins */}
            <div className="flex items-center gap-1 text-amber-400" title="Coins (Coins = Orb Rarity)">
              <Coins className="w-3.5 h-3.5" />
              <span>{fmt(state.coins)}</span>
            </div>

            <div className="w-[1px] h-3.5 bg-slate-800" />

            {/* Shards */}
            <div className="flex items-center gap-1 text-cyan-400" title="Shards">
              <Gem className="w-3.5 h-3.5" />
              <span>{fmt(state.shards ?? 0)}</span>
            </div>

            {/* Cosmic Dust */}
            {(state.cosmicDust > 0 || state.prestigeCount > 0) && (
              <>
                <div className="w-[1px] h-3.5 bg-slate-800" />
                <div className="flex items-center gap-1 text-fuchsia-400" title="Cosmic Dust">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{fmt(state.cosmicDust)}</span>
                </div>
              </>
            )}
          </div>

          {/* Offline Rolls Waiting Notification */}
          {state.offlineRolls > 0 && (
            <button
              onClick={onClaimOffline}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-900/30 animate-pulse transition-all"
              title="Claim rolls accumulated while away"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+{fmt(state.offlineRolls)} Offline</span>
            </button>
          )}

          {/* Fair RNG Odds Button */}
          <button
            onClick={onOpenOdds}
            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded-lg transition-colors"
            title="View Probability & Drop Odds"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Dev Debug Menu */}
          {onOpenDevDebug && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenDevDebug();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-all"
              title="Developer Debug Menu"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Debug</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800/80 rounded-lg transition-colors"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
