import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { PlayerState, UpgradeId } from '../shared/game.js';
import { cooldownMs, rollsPerActivation, upgradeCost } from '../shared/game.js';
import './styles.css';
const names: Record<number,string> = {2:'Common',5:'Uncommon',10:'Uncommon',25:'Rare',100:'Very Rare',1000:'Epic',10000:'Legendary',100000:'Mythic',1000000:'Divine'};
const fmt = (n:number) => new Intl.NumberFormat('en-US').format(n);
function App(){
 const [s,setS]=useState<PlayerState|null>(null),[last,setLast]=useState<number|null>(null),[readyAt,setReadyAt]=useState(0),[tab,setTab]=useState<'roll'|'upgrades'|'collection'>('roll'),[msg,setMsg]=useState(''),[now,setNow]=useState(Date.now()),[auto,setAuto]=useState(false);
 const refresh=useCallback(async()=>{const d=await (await fetch('/api/me')).json();setS(d);setAuto(d.upgrades.auto>0);},[]);
 useEffect(()=>{void refresh(); const i=setInterval(()=>setNow(Date.now()),100); return()=>clearInterval(i)},[refresh]);
 const cd=s?cooldownMs(s):10000, remain=Math.max(0,readyAt-now), can=remain<=0, multi=s?rollsPerActivation(s):1;
 const roll=useCallback(async()=>{if(!can)return; const d=await (await fetch('/api/roll',{method:'POST'})).json(); if(d.error){setMsg(d.error);return;} setS(d.state);setLast(d.orb.rarity);setReadyAt(Date.now()+d.rollsRemainingUntilNext);},[can]);
 useEffect(()=>{if(!auto)return;const i=setInterval(()=>{if(Date.now()>=readyAt)void roll()},200);return()=>clearInterval(i)},[auto,readyAt,roll]);
 async function buy(id:UpgradeId){const d=await(await fetch('/api/upgrade',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id})})).json();if(d.error){setMsg(d.error);return;}setS(d.state);setMsg(id==='auto'?'Auto Roll unlocked!':'Upgrade purchased.');setAuto(d.state.upgrades.auto>0)}
 if(!s)return <main className="app"><h1>∞ Infinity Orbs</h1><p>Loading...</p></main>;
 return <main className="app"><header><div><h1>∞ Infinity Orbs</h1><p>Level {s.level}</p></div><strong>🪙 {fmt(s.coins)}</strong></header><section className="stats"><div>Highest<strong>1 / {fmt(s.highestRarity||2)}</strong></div><div>Rolls<strong>{fmt(s.totalRolls)}</strong></div><div>Value<strong>{fmt(s.collectionValue)}</strong></div></section><nav>{(['roll','upgrades','collection'] as const).map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t}</button>)}</nav>
 {tab==='roll'&&<section className="panel hero"><div className="orb"><span>{last?`1 / ${fmt(last)}`:'???'}</span><small>{last?(names[last]??'Rare'): 'Your next Orb'}</small></div><div className="timer">{can?'READY':`${(remain/1000).toFixed(1)}s`}</div><button className="roll" disabled={!can} onClick={()=>void roll()}>ROLL {multi>1?`×${multi}`:''}</button>{auto&&<p className="auto">🤖 AUTO ROLL ACTIVE</p>}{msg&&<p className="notice">{msg}</p>}</section>}
 {tab==='upgrades'&&<section className="panel">{(['speed','multi','auto','luck'] as UpgradeId[]).map(id=><article className="upgrade" key={id}><div><h3>{id.toUpperCase()} <small>Lv {s.upgrades[id]}</small></h3><p>{id==='speed'?'Reduce cooldown.':id==='multi'?'Roll more Orbs per activation.':id==='auto'?'Automatically roll while active.':'Bias the distribution toward rarer Orbs.'}</p></div><button disabled={!Number.isFinite(upgradeCost(id,s.upgrades[id]))} onClick={()=>void buy(id)}>{Number.isFinite(upgradeCost(id,s.upgrades[id]))?`🪙 ${fmt(upgradeCost(id,s.upgrades[id]))}`:'MAX'}</button></article>)}{msg&&<p className="notice">{msg}</p>}</section>}
 {tab==='collection'&&<section className="panel">{[2,5,10,25,100,1000,10000,100000,1000000].map(r=><div className="row" key={r}><span>{names[r]}</span><strong>1 / {fmt(r)}</strong><em>×{s.collection[String(r)]??0}</em></div>)}</section>}
 </main>
}
createRoot(document.getElementById('root')!).render(<App/>);
