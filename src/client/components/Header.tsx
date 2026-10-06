import React from 'react';
import { Volume2, VolumeX, HelpCircle, Coins, Gem, Zap, Wrench, Sparkles } from 'lucide-react';
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
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span className="brand-glyph">∞</span></div>
          <div className="brand-copy">
            <div className="flex items-center">
              <h1 className="brand-title">Infinity Orbs</h1>
              <span className="header-level">LV {state.level}</span>
            </div>
            <p className="brand-subtitle">An observatory of chance</p>
          </div>
        </div>

        <div className="header-resource-row" aria-label="Your resources">
          <div className="resource-chip" title="Coins">
            <Coins className="h-4 w-4 text-amber-300" />
            <span>{fmt(state.coins)}</span>
            <span className="resource-label">Coins</span>
          </div>
          <div className="resource-chip" title="Shards">
            <Gem className="h-4 w-4 text-cyan-300" />
            <span>{fmt(state.shards ?? 0)}</span>
            <span className="resource-label">Shards</span>
          </div>
          {(state.cosmicDust > 0 || state.prestigeCount > 0) && (
            <div className="resource-chip" title="Cosmic Dust">
              <Sparkles className="h-4 w-4 text-fuchsia-300" />
              <span>{fmt(state.cosmicDust)}</span>
              <span className="resource-label">Dust</span>
            </div>
          )}
        </div>

        <div className="header-actions">
          {state.offlineRolls > 0 && (
            <button
              onClick={onClaimOffline}
              className="offline-button flex items-center gap-1.5 border border-emerald-400/25 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25"
              title="Claim rolls accumulated while away"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>+{fmt(state.offlineRolls)} Away</span>
            </button>
          )}
          <button className="header-icon-button" onClick={onOpenOdds} title="View drop odds" aria-label="View drop odds">
            <HelpCircle className="h-4 w-4" />
          </button>
          {onOpenDevDebug && (
            <button
              className="header-icon-button hidden sm:grid"
              onClick={() => { sound.playClick(); onOpenDevDebug(); }}
              title="Developer tools"
              aria-label="Developer tools"
            >
              <Wrench className="h-4 w-4" />
            </button>
          )}
          <button
            className="header-icon-button"
            onClick={() => { sound.playClick(); onToggleSound(); }}
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-teal-300" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
