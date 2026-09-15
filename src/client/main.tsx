import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { PlayerState, UpgradeId } from '../shared/game.js';
import type { Guild, LeaderboardEntry, Achievement } from '../shared/social.js';
import { cooldownMs, rollsPerActivation, upgradeCost, luckMultiplier } from '../shared/game.js';
import './styles.css';

const rarities = [2, 5, 10, 25, 100, 1000, 10000, 100000, 1000000];
const names: Record<number, string> = { 2:'Common',5:'Uncommon',10:'Uncommon',25:'Rare',100:'Very Rare',1000:'Epic',10000:'Legendary',100000:'Mythic',1000000:'Divine' };
const fmt = (n:number) => new Intl.NumberFormat('en-US').format(n);
const pct = (n:number) => `${Math.round(n * 100)}%`;

type Tab = 'roll' | 'upgrades' | 'collection' | 'social' | 'achievements';

async function getJson<T>(url:string, options?:RequestInit):Promise<T>{
  const res = await fetch(url, options);
  return res.json();
}

function App(){
 const [s,setS]=useState<PlayerState|null>(null),[last,setLast]=useState<number|null>(null),[readyAt,setReadyAt]=useState(0),[tab,setTab]=useState<Tab>('roll'),[msg,setMsg]=useState(''),[now,setNow]=useState(Date.now()),[auto,setAuto]=useState(false),[busy,setBusy]=useState(false);
 const [board,setBoard]=useState<LeaderboardEntry[]>([]),[guildData,setGuildData]=useState<{guilds:Guild[];mine:Guild|null}>({guilds:[],mine:null}),[ach,setAch]=useState<Achievement[]>([]);
 const [guildName,setGuildName]=useState(''),[guildTag,setGuildTag]=useState('');
 const refresh=useCallback(async()=>{
   const [me,lb,gd,ac]=await Promise.all([
     getJson<PlayerState>('/api/me'),getJson<LeaderboardEntry[]>('/api/leaderboard'),
     getJson<{guilds:Guild[];mine:Guild|null}>('/api/guilds'),getJson<Achievement[]>('/api/achievements')
   ]);
   setS(me); setAuto(me.upgrades.auto>0); setBoard(lb); setGuildData(gd); setAch(ac);
 },[]);
 useEffect(()=>{void refresh();const i=setInterval(()=>setNow(Date.now()),100);return()=>clearInterval(i)},[refresh]);
 const cd=s?cooldownMs(s):10000;
 const remain=Math.max(0,readyAt-now),can=remain<=0,multi=s?rollsPerActivation(s):1;
 const roll=useCallback(async()=>{
   if(!can || busy)return;
   setBusy(true);
   try {
     const d=await getJson<any>('/api/roll',{method:'POST'});
     if(d.error){setMsg(d.error);return;}
     setS(d.state);setLast(d.orb.rarity);setReadyAt(Date.now()+d.rollsRemainingUntilNext);setMsg(d.orb.rarity>=1000?'That is a serious Orb.':'');void refresh();
   } finally { setBusy(false); }
 },[can,busy,refresh]);
 useEffect(()=>{if(!auto)return;const i=setInterval(()=>{if(Date.now()>=readyAt)void roll()},150);return()=>clearInterval(i)},[auto,readyAt,roll]);
 async function buy(id:UpgradeId){const d=await getJson<any>('/api/upgrade',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id})});if(d.error){setMsg(d.error);return;}setS(d.state);setMsg(id==='auto'?'🤖 Auto Roll unlocked!':'Upgrade purchased.');setAuto(d.state.upgrades.auto>0);void refresh();}
 async function claimOffline(){const d=await getJson<any>('/api/offline/claim',{method:'POST'});if(d.error){setMsg(d.error);return;}setS(d.state);setLast(d.orb.rarity);setReadyAt(Date.now()+d.rollsRemainingUntilNext);setMsg(`Claimed ${fmt(d.state.totalRolls)} total rolls. Best: 1/${fmt(d.orb.rarity)}.`);void refresh();}
 async function claimAchievement(id:string){const d=await getJson<any>('/api/achievements/claim',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id})});if(d.error){setMsg(d.error);return;}setS(d.state);setMsg(`Achievement claimed: +${fmt(d.reward)} Coins.`);void refresh();}
 async function join(id:string){const d=await getJson<any>('/api/guilds/join',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id})});setMsg(d.error??`Joined ${d.guild.name}!`);void refresh();}
 async function create(){const d=await getJson<any>('/api/guilds/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:guildName,tag:guildTag})});setMsg(d.error??`Created ${d.guild.name}!`);setGuildName('');setGuildTag('');void refresh();}
 async function share(){
   if(!last)return;
   const d=await getJson<any>('/api/share',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rarity:last})});
   if(d.error){setMsg(d.error);return;}
   setMsg(d.id?`Reddit post created: ${d.id}`:'Share complete.');
 }
 if(!s)return <main className="app"><h1>∞ Infinity Orbs</h1><p>Loading...</p></main>;
 const currentBest=last??s.highestRarity;
 return <main className="app">
  <header><div><div className="brand"><span className="logo">∞</span><div><h1>Infinity Orbs</h1><p>Level {s.level} • {pct(luckMultiplier(s)-1)} Luck</p></div></div></div><strong>🪙 {fmt(s.coins)}</strong></header>
  <section className="stats"><div>Highest<strong>1 / {fmt(s.highestRarity||2)}</strong></div><div>Rolls<strong>{fmt(s.totalRolls)}</strong></div><div>Value<strong>{fmt(s.collectionValue)}</strong></div></section>
  {s.offlineRolls>0&&<section className="offline"><div><strong>Offline Rolls Ready</strong><span>{fmt(s.offlineRolls)} roll activations are waiting.</span></div><button onClick={()=>void claimOffline()}>CLAIM</button></section>}
  <nav>{(['roll','upgrades','collection','social','achievements'] as const).map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t}</button>)}</nav>
  {tab==='roll'&&<section className="panel hero"><div className={`orb ${currentBest>=100000?'mythic':''}`}><span>{last?`1 / ${fmt(last)}`:'???'}</span><small>{last?(names[last]??'Rare'): 'Your next Orb'}</small></div><div className="timer">{can?'READY':`${(remain/1000).toFixed(1)}s`}</div><button className="roll" disabled={!can||busy} onClick={()=>void roll()}>{busy?'ROLLING...':`ROLL ${multi>1?`×${multi}`:''}`}</button>{auto&&<p className="auto">🤖 AUTO ROLL ACTIVE</p>}{last&&last>=1000&&<button className="share" onClick={()=>void share()}>Post this Orb to Reddit</button>}{msg&&<p className="notice">{msg}</p>}<div className="mini"><span>Speed {(cd/1000).toFixed(1)}s</span><span>Multi ×{multi}</span><span>Luck +{pct(luckMultiplier(s)-1)}</span></div></section>}
  {tab==='upgrades'&&<section className="panel"><h2>Upgrades</h2>{(['speed','multi','auto','luck'] as UpgradeId[]).map(id=>{const cost=upgradeCost(id,s.upgrades[id]);const level=s.upgrades[id];const desc=id==='speed'?`Cooldown ${(cd/1000).toFixed(1)}s → ${Math.max(1,(cd*0.86/1000)).toFixed(1)}s`:id==='multi'?`×${rollsPerActivation(s)} → ×${Math.min(100,rollsPerActivation(s)*2)}`:id==='auto'?(level?'Automation active.':'Unlock guaranteed Auto Roll after 10 total rolls.'):`Luck +${pct(luckMultiplier(s)-1)} → +${pct(luckMultiplier(s)-1+0.08)}`;return <article className="upgrade" key={id}><div><h3>{id==='speed'?'⚡':id==='multi'?'🎲':id==='auto'?'🤖':'🍀'} {id.toUpperCase()} <small>Lv {level}</small></h3><p>{desc}</p></div><button disabled={!Number.isFinite(cost)||s.coins<cost} onClick={()=>void buy(id)}>{level===0&&id==='auto'?'UNLOCK':Number.isFinite(cost)?`🪙 ${fmt(cost)}`:'MAX'}</button></article>})}{msg&&<p className="notice">{msg}</p>}</section>}
  {tab==='collection'&&<section className="panel"><h2>Collection</h2>{rarities.map(r=><div className="row" key={r}><span>{names[r]}</span><strong>1 / {fmt(r)}</strong><em>×{s.collection[String(r)]??0}</em></div>)}</section>}
  {tab==='social'&&<section className="panel"><h2>Guilds & Leaderboards</h2>{guildData.mine?<div className="guildCard"><strong>[{guildData.mine.tag}] {guildData.mine.name}</strong><span>Lv {guildData.mine.level} • {guildData.mine.members.length}/50 members</span><small>Your contribution: {fmt(guildData.mine.members.find(m=>m.username.startsWith('reddit-user-'))?.contribution??0)}</small></div>:<div className="createGuild"><h3>Create a Guild</h3><div className="form"><input value={guildName} onChange={e=>setGuildName(e.target.value)} placeholder="Guild name" maxLength={32}/><input value={guildTag} onChange={e=>setGuildTag(e.target.value)} placeholder="TAG" maxLength={5}/><button onClick={()=>void create()}>Create</button></div></div>}<div className="socialGrid"><div><h3>Top Players</h3>{board.slice(0,10).map((e,i)=><div className="rank" key={e.username}><b>#{i+1}</b><span>{e.username}</span><strong>{fmt(e.value)}</strong></div>)}</div><div><h3>Top Guilds</h3>{guildData.guilds.slice(0,10).map((g,i)=><div className="rank" key={g.id}><b>#{i+1}</b><span>[{g.tag}] {g.name}</span><strong>Lv {g.level}</strong>{!guildData.mine&&<button onClick={()=>void join(g.id)}>Join</button>}</div>)}</div></div></section>}
  {tab==='achievements'&&<section className="panel"><h2>Achievements</h2>{ach.map(a=>{const claimed=s.claimedAchievements.includes(a.id);return <div className={`achievement ${a.unlocked?'unlocked':''}`} key={a.id}><span>{claimed?'🏆':a.unlocked?'✅':'🔒'}</span><div><strong>{a.name}</strong><p>{a.description}</p></div>{claimed?<em>CLAIMED</em>:a.unlocked?<button onClick={()=>void claimAchievement(a.id)}>+{fmt(a.reward)} 🪙</button>:<em>+{fmt(a.reward)} 🪙</em>}</div>})}</section>}
 </main>;
}

createRoot(document.getElementById('root')!).render(<App/>);
