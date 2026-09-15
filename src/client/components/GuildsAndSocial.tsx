import React, { useState } from 'react';
import {
  Shield,
  Users,
  Trophy,
  Globe,
  MessageSquare,
  Plus,
  Send,
  LogOut,
  Sparkles,
  Flame,
} from 'lucide-react';
import type {
  Guild,
  LeaderboardEntry,
  WorldEvent,
} from '../../shared/social.js';
import { sound } from '../sound.js';

interface GuildsAndSocialProps {
  guilds: Guild[];
  myGuild: Guild | null;
  leaderboard: LeaderboardEntry[];
  worldEvent: WorldEvent | null;
  onCreateGuild: (name: string, tag: string) => Promise<void>;
  onJoinGuild: (id: string) => Promise<void>;
  onLeaveGuild: () => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  busy: boolean;
}

export const GuildsAndSocial: React.FC<GuildsAndSocialProps> = ({
  guilds,
  myGuild,
  leaderboard,
  worldEvent,
  onCreateGuild,
  onJoinGuild,
  onLeaveGuild,
  onSendMessage,
  busy,
}) => {
  const [activeTab, setActiveTab] = useState<'guild' | 'leaderboard' | 'event'>('guild');
  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fmt = (n: number) => n.toLocaleString();

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || busy) return;
    sound.playClick();
    const text = chatInput.trim();
    setChatInput('');
    await onSendMessage(text);
  };

  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createTag.trim() || busy) return;
    sound.playClick();
    await onCreateGuild(createName.trim(), createTag.trim());
    setCreateName('');
    setCreateTag('');
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('guild');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'guild'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Guild Headquarters</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('leaderboard');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Global Leaderboard</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('event');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'event'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Community Event</span>
        </button>
      </div>

      {/* 1. GUILD TAB */}
      {activeTab === 'guild' && (
        <div className="space-y-6">
          {myGuild ? (
            /* Player Is In A Guild */
            <div className="space-y-6">
              {/* Guild Header Hero */}
              <div className="bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-black text-purple-300 text-lg">
                      {myGuild.tag}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-white">{myGuild.name}</h2>
                        <span className="text-xs font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                          Lv {myGuild.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {myGuild.members.length} / 50 Members • {fmt(myGuild.tokens)} Guild Tokens
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      void onLeaveGuild();
                    }}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all w-fit cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave Guild</span>
                  </button>
                </div>

                {/* Guild Weekly Challenge (GDD Section 28) */}
                {myGuild.challenge && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-purple-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span>Weekly Challenge: {myGuild.challenge.label}</span>
                      </span>
                      <span className="text-amber-400">
                        Reward: +{fmt(myGuild.challenge.reward)} Tokens
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all"
                        style={{
                          width: `${Math.min(100, (myGuild.challenge.progress / myGuild.challenge.target) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>Progress</span>
                      <span>
                        {fmt(myGuild.challenge.progress)} / {fmt(myGuild.challenge.target)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Members List & Chat Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Member Roster */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Member Contributions</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      {myGuild.members.length} / 50
                    </span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {myGuild.members
                      .sort((a, b) => b.contribution - a.contribution)
                      .map((m, idx) => (
                        <div
                          key={m.username}
                          className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500">#{idx + 1}</span>
                            <span className="font-bold text-slate-200">{m.username}</span>
                            {m.role === 'owner' && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">
                                Owner
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-amber-400 font-semibold">
                            +{fmt(m.contribution)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Guild Chat / Feed (GDD Section 30) */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 h-80">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-cyan-400" />
                      <span>Guild Chat Feed</span>
                    </h3>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {myGuild.chat && myGuild.chat.length > 0 ? (
                      myGuild.chat.map(msg => (
                        <div
                          key={msg.id}
                          className={`text-xs p-2 rounded-xl ${
                            msg.isSystem
                              ? 'bg-purple-950/30 text-purple-300 border border-purple-800/30 italic text-[11px]'
                              : 'bg-slate-950/60 text-slate-300 border border-slate-800/60'
                          }`}
                        >
                          {!msg.isSystem && (
                            <span className="font-bold text-cyan-400 block text-[10px] mb-0.5">
                              {msg.username}
                            </span>
                          )}
                          <span>{msg.text}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-slate-500 text-xs py-8">
                        No messages yet. Say hello to your guild members!
                      </div>
                    )}
                  </div>

                  {/* Send Chat Form */}
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Say something to guild..."
                      maxLength={150}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || busy}
                      className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white rounded-xl transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Player Is NOT in a guild */
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
                <Shield className="w-12 h-12 text-purple-400 mx-auto" />
                <h3 className="text-lg font-black text-white">Join the Collective Probability</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Guilds pool rolls, conquer weekly challenges, and unlock collective token rewards. Join an existing guild below or found your own!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg inline-flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Found a New Guild</span>
                </button>
              </div>

              {/* Guild Directory */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white">Active Guild Directory</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {guilds.map(g => (
                    <div
                      key={g.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center font-black text-purple-300 text-xs">
                          {g.tag}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{g.name}</h4>
                          <span className="text-xs text-slate-400">
                            Lv {g.level} • {g.members.length}/50 Members
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sound.playClick();
                          void onJoinGuild(g.id);
                        }}
                        disabled={busy || g.members.length >= 50}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        {g.members.length >= 50 ? 'Full' : 'Join'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Create Guild Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                <h3 className="text-lg font-black text-white">Found a New Guild</h3>
                <p className="text-xs text-slate-400">
                  Pick a memorable guild name and a 2-5 letter tag.
                </p>
                <form onSubmit={handleCreateGuild} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                      Guild Name
                    </label>
                    <input
                      type="text"
                      value={createName}
                      onChange={e => setCreateName(e.target.value)}
                      placeholder="e.g. Probability Enjoyers"
                      maxLength={32}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                      Guild Tag (2-5 Letters)
                    </label>
                    <input
                      type="text"
                      value={createTag}
                      onChange={e => setCreateTag(e.target.value.toUpperCase())}
                      placeholder="e.g. ORB"
                      maxLength={5}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Top Players of Probability</span>
            </h3>
            <span className="text-xs text-slate-400">Ranked by Total Collection Value</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
            {leaderboard.map((entry, idx) => (
              <div
                key={entry.username}
                className="flex items-center justify-between p-3 sm:px-4 text-xs hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center font-black text-sm ${
                      idx === 0
                        ? 'text-amber-400'
                        : idx === 1
                        ? 'text-slate-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{entry.username}</span>
                      {entry.title && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          • {entry.title}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Highest: 1/{fmt(entry.highestRarity)} • {fmt(entry.totalRolls)} rolls
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-amber-400 font-mono font-bold text-sm block">
                    {fmt(entry.value)} Val
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. COMMUNITY EVENT TAB (GDD Section 20, 37) */}
      {activeTab === 'event' && worldEvent && (
        <div className="bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Globe className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400 block mb-0.5">
                Subreddit World Event
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">{worldEvent.title}</h2>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            {worldEvent.description}
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 block mb-1">
                  Community Progress
                </span>
                <span className="text-2xl font-black text-cyan-300 font-mono">
                  {fmt(worldEvent.currentProgress)}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ {fmt(worldEvent.goal)} Rolls</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                {worldEvent.buffDescription}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all"
                style={{
                  width: `${Math.min(100, (worldEvent.currentProgress / worldEvent.goal) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
