/**
 * ============================================================================
 * FAYL ADI: components/Compare.js
 * MƏQSƏDİ: Head-to-Head (H2H) oyunçu və ya komanda müqayisəsi. Sofascore stili.
 * ============================================================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';

const html = htm.bind(React.createElement);

export default function Compare({ activeYear, onOpenPlayerProfile }) {
  const [mode, setMode] = useState('players'); // 'players' | 'teams'
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  
  const [item1, setItem1] = useState(null);
  const [item2, setItem2] = useState(null);

  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    const load = async () => {
      const p = await db.getPlayers(activeYear);
      const c = await db.getClasses(activeYear);
      setPlayers(p || []);
      setTeams(c || []);
    };
    load();
  }, [activeYear]);

  
  const simulateMatch = () => {
    setSimulation({ status: 'running', logs: [] });
    let min = 0;
    let score1 = 0;
    let score2 = 0;
    
    // Team ratings based on points and goal diff
    const t1Power = (item1.stats?.points || 1) + (item1.stats?.goalsFor || 1) * 0.5;
    const t2Power = (item2.stats?.points || 1) + (item2.stats?.goalsFor || 1) * 0.5;
    const totalPower = t1Power + t2Power;
    
    const interval = setInterval(() => {
      min += 5;
      if (min > 30) {
        clearInterval(interval);
        setSimulation(prev => ({ ...prev, status: 'finished', result: `${score1} - ${score2}` }));
        return;
      }
      
      let logs = [];
      const chance = Math.random();
      if (chance < 0.3) {
         if (Math.random() < (t1Power / totalPower)) {
           score1++;
           logs.push(`⚽ ${min}'. QOL! ${item1.name} gözəl hücumla fərqlənir! (${score1} - ${score2})`);
         } else {
           score2++;
           logs.push(`⚽ ${min}'. QOL! ${item2.name} hesabı dəyişir! (${score1} - ${score2})`);
         }
      } else if (chance < 0.5) {
         if (Math.random() < 0.5) {
           logs.push(`⚠️ ${min}'. Təhlükə! ${item1.name} direyi nişan aldı!`);
         } else {
           logs.push(`🧤 ${min}'. Möhtəşəm seyv! ${item2.name} qapıçısı topu çıxarır.`);
         }
      } else {
         logs.push(`⏱️ ${min}'. Meydanın mərkəzində taktiki mübarizə gedir.`);
      }
      
      setSimulation(prev => ({ ...prev, status: 'running', logs: [...prev.logs, ...logs], score1, score2, min }));
    }, 1000);
  };

  // Helpers
  const calcMarketValue = (rating, goals, matches) => {
    let base = 500;
    if (rating > 7.0) base += (rating - 7.0) * 1000;
    if (rating >= 8.0) base += (rating - 8.0) * 3000;
    if (rating >= 9.0) base += (rating - 9.0) * 10000;
    base += (goals * 100) + (matches * 50);
    return base >= 1000 ? "€" + (base / 1000).toFixed(1) + "M" : "€" + Math.floor(base) + "K";
  };

  const renderComparisonBar = (label, val1, val2, higherIsBetter = true) => {
    const total = val1 + val2;
    const p1 = total === 0 ? 50 : (val1 / total) * 100;
    const p2 = total === 0 ? 50 : (val2 / total) * 100;

    let c1 = 'bg-slate-700';
    let c2 = 'bg-slate-700';

    if (val1 !== val2) {
      if (val1 > val2) {
        c1 = higherIsBetter ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
        c2 = 'bg-slate-800';
      } else {
        c2 = higherIsBetter ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
        c1 = 'bg-slate-800';
      }
    }

    return html`
      <div className="mb-4">
        <div className="flex justify-between text-xs font-black mb-1.5 px-1">
          <span className="text-white">${typeof val1 === 'number' && val1 % 1 !== 0 ? val1.toFixed(2) : val1}</span>
          <span className="text-slate-400 uppercase tracking-widest text-[10px]">${label}</span>
          <span className="text-white">${typeof val2 === 'number' && val2 % 1 !== 0 ? val2.toFixed(2) : val2}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex-1 h-2 bg-slate-900 rounded-l-full overflow-hidden flex justify-end">
             <div className="${c1} h-full transition-all duration-1000" style=${{ width: p1 + '%' }}></div>
          </div>
          <div className="w-1 h-3 bg-slate-600 rounded-sm"></div>
          <div className="flex-1 h-2 bg-slate-900 rounded-r-full overflow-hidden">
             <div className="${c2} h-full transition-all duration-1000" style=${{ width: p2 + '%' }}></div>
          </div>
        </div>
      </div>
    `;
  };

  const searchResults1 = useMemo(() => {
    if (!search1) return [];
    if (mode === 'players') return players.filter(p => p.name.toLowerCase().includes(search1.toLowerCase())).slice(0, 5);
    return teams.filter(t => t.name.toLowerCase().includes(search1.toLowerCase())).slice(0, 5);
  }, [search1, players, teams, mode]);

  const searchResults2 = useMemo(() => {
    if (!search2) return [];
    if (mode === 'players') return players.filter(p => p.name.toLowerCase().includes(search2.toLowerCase())).slice(0, 5);
    return teams.filter(t => t.name.toLowerCase().includes(search2.toLowerCase())).slice(0, 5);
  }, [search2, players, teams, mode]);

  return html`
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      
      <div className="flex items-center justify-between bg-zinc-900 border border-white/10 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center text-xl border border-emerald-500/30">
            <i className="fas fa-balance-scale"></i>
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-wide">Head-to-Head (H2H) Müqayisə</h2>
            <p className="text-xs text-slate-400">Sofascore tərzində oyunçu və komandaların təfərrüatlı analizi</p>
          </div>
        </div>
        
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
          <button onClick=${() => { setMode('players'); setItem1(null); setItem2(null); setSearch1(''); setSearch2(''); }} 
                  className=${`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === 'players' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            Oyunçular
          </button>
          <button onClick=${() => { setMode('teams'); setItem1(null); setItem2(null); setSearch1(''); setSearch2(''); }} 
                  className=${`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${mode === 'teams' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-white'}`}>
            Komandalar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <!-- VS Badge in middle (desktop) -->
        <div className="hidden md:flex absolute top-[10%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black border-2 border-white/20 rounded-full items-center justify-center text-white font-black italic shadow-[0_0_20px_rgba(255,255,255,0.1)] z-10">
          VS
        </div>

        <!-- LEFT SIDE -->
        <div className="bg-[#161a25] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-visible">
           ${!item1 ? html`
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <i className="fas fa-search text-slate-500"></i>
               </div>
               <input type="text" 
                      value=${search1} 
                      onInput=${(e) => setSearch1(e.target.value)} 
                      placeholder=${`${mode === 'players' ? 'Oyunçu' : 'Komanda'} axtar...`}
                      className="w-full pl-10 pr-4 py-3 bg-[#1e2333] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
               
               ${search1 && searchResults1.length > 0 && html`
                 <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e2333] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                    ${searchResults1.map(res => html`
                      <button key=${res.id || res.name} onClick=${() => { setItem1(res); setSearch1(''); }} className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between">
                         <span className="text-white text-sm font-bold">${res.name}</span>
                         ${mode === 'players' && html`<span className="text-xs text-slate-400">${res.className}</span>`}
                      </button>
                    `)}
                 </div>
               `}
             </div>
             
             <div className="h-64 flex flex-col items-center justify-center text-slate-600">
                <i className="fas fa-user-plus text-4xl mb-3 opacity-50"></i>
                <p className="text-sm font-medium">Müqayisə etmək üçün seçin</p>
             </div>
           ` : html`
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full border-2 border-slate-600 flex items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer" onClick=${() => mode === 'players' && onOpenPlayerProfile(item1.name)}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <i className=${`fas ${mode === 'players' ? 'fa-user' : 'fa-shield-alt'} text-2xl text-slate-400 group-hover:scale-110 transition-transform`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white hover:text-emerald-400 transition-colors cursor-pointer" onClick=${() => mode === 'players' && onOpenPlayerProfile(item1.name)}>${item1.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">${mode === 'players' ? item1.className : 'Turnir Komandası'}</p>
                    ${mode === 'players' && item1.rating && html`
                       <span className=${`inline-block mt-2 text-xs font-black px-2 py-0.5 rounded-md shadow ${getSofascoreBadgeStyle(item1.rating)}`}>${item1.rating.toFixed(1)}</span>
                    `}
                  </div>
                </div>
                <button onClick=${() => setItem1(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-500 transition-colors">
                  <i className="fas fa-times"></i>
                </button>
             </div>
           `}
        </div>

        <!-- RIGHT SIDE -->
        <div className="bg-[#161a25] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-visible">
           ${!item2 ? html`
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <i className="fas fa-search text-slate-500"></i>
               </div>
               <input type="text" 
                      value=${search2} 
                      onInput=${(e) => setSearch2(e.target.value)} 
                      placeholder=${`${mode === 'players' ? 'Oyunçu' : 'Komanda'} axtar...`}
                      className="w-full pl-10 pr-4 py-3 bg-[#1e2333] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
               
               ${search2 && searchResults2.length > 0 && html`
                 <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e2333] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                    ${searchResults2.map(res => html`
                      <button key=${res.id || res.name} onClick=${() => { setItem2(res); setSearch2(''); }} className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between">
                         <span className="text-white text-sm font-bold">${res.name}</span>
                         ${mode === 'players' && html`<span className="text-xs text-slate-400">${res.className}</span>`}
                      </button>
                    `)}
                 </div>
               `}
             </div>
             
             <div className="h-64 flex flex-col items-center justify-center text-slate-600">
                <i className="fas fa-user-plus text-4xl mb-3 opacity-50"></i>
                <p className="text-sm font-medium">Müqayisə etmək üçün seçin</p>
             </div>
           ` : html`
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full border-2 border-slate-600 flex items-center justify-center shadow-lg relative overflow-hidden group cursor-pointer" onClick=${() => mode === 'players' && onOpenPlayerProfile(item2.name)}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <i className=${`fas ${mode === 'players' ? 'fa-user' : 'fa-shield-alt'} text-2xl text-slate-400 group-hover:scale-110 transition-transform`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white hover:text-emerald-400 transition-colors cursor-pointer" onClick=${() => mode === 'players' && onOpenPlayerProfile(item2.name)}>${item2.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">${mode === 'players' ? item2.className : 'Turnir Komandası'}</p>
                    ${mode === 'players' && item2.rating && html`
                       <span className=${`inline-block mt-2 text-xs font-black px-2 py-0.5 rounded-md shadow ${getSofascoreBadgeStyle(item2.rating)}`}>${item2.rating.toFixed(1)}</span>
                    `}
                  </div>
                </div>
                <button onClick=${() => setItem2(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-rose-500/20 hover:text-rose-500 transition-colors">
                  <i className="fas fa-times"></i>
                </button>
             </div>
           `}
        </div>
      </div>

      <!-- COMPARISON STATS -->
      ${item1 && item2 && html`
        <div className="bg-[#161a25] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl mt-8">
           <h3 className="text-center text-sm font-black text-zinc-400 uppercase tracking-widest mb-8">Sofascore Statistikaları</h3>
           
           <div className="max-w-3xl mx-auto space-y-6">
             ${mode === 'players' ? html`
               ${renderComparisonBar('Reytinq', parseFloat((item1.rating || 6.5).toFixed(2)), parseFloat((item2.rating || 6.5).toFixed(2)))}
               ${renderComparisonBar('Qollar', item1.goals || 0, item2.goals || 0)}
               ${renderComparisonBar('Asistlər', item1.assists || 0, item2.assists || 0)}
               ${renderComparisonBar('Oynanılan Matç', item1.matches || 0, item2.matches || 0)}
               
               <div className="mt-12 flex justify-between px-4 pt-6 border-t border-white/10">
                 <div className="text-center">
                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Bazar Dəyəri (Est.)</p>
                   <p className="text-2xl font-black text-emerald-400">${calcMarketValue(item1.rating||6.5, item1.goals||0, item1.matches||0)}</p>
                 </div>
                 <div className="text-center">
                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Bazar Dəyəri (Est.)</p>
                   <p className="text-2xl font-black text-emerald-400">${calcMarketValue(item2.rating||6.5, item2.goals||0, item2.matches||0)}</p>
                 </div>
               </div>
             ` : html`
               ${renderComparisonBar('Qələbə', item1.stats?.won || 0, item2.stats?.won || 0)}
               ${renderComparisonBar('Məğlubiyyət', item1.stats?.lost || 0, item2.stats?.lost || 0, false)}
               ${renderComparisonBar('Vurulan Qol', item1.stats?.goalsFor || 0, item2.stats?.goalsFor || 0)}
               ${renderComparisonBar('Buraxılan Qol', item1.stats?.goalsAgainst || 0, item2.stats?.goalsAgainst || 0, false)}
               ${renderComparisonBar('Xal (Xal Sistemi)', item1.stats?.points || 0, item2.stats?.points || 0)}

             ${mode === 'teams' && html`
               <div className="mt-8 pt-8 border-t border-white/10 text-center">
                 <button onClick=${simulateMatch} disabled=${simulation?.status === 'running'} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed">
                   <i className=${`fas ${simulation?.status === 'running' ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                   AI MATÇ SİMULYASİYASI (30 DƏQ)
                 </button>
                 
                 ${simulation && html`
                   <div className="mt-6 bg-[#1e2333] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-left max-w-xl mx-auto">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-purple-400 uppercase tracking-widest">${simulation.status === 'finished' ? 'Maç Bitdi' : 'Canlı Yayım'}</span>
                        <span className="text-sm font-black text-white bg-purple-600/20 px-3 py-1 rounded-lg">${simulation.status === 'finished' ? 'FT' : simulation.min + "'"}</span>
                     </div>
                     <div className="flex justify-between items-center mb-6 text-2xl sm:text-3xl font-black text-white px-4">
                        <span className="w-1/3 text-right truncate" title=${item1.name}>${item1.name.substring(0,8)}</span>
                        <span className="w-1/3 text-center text-4xl text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600">${simulation.score1 || 0} - ${simulation.score2 || 0}</span>
                        <span className="w-1/3 text-left truncate" title=${item2.name}>${item2.name.substring(0,8)}</span>
                     </div>
                     <div className="space-y-3 h-40 overflow-y-auto pr-2 custom-scrollbar">
                        ${simulation.logs.map((log, i) => html`
                          <div key=${i} className="text-sm text-slate-300 bg-white/5 px-4 py-2 rounded-lg border-l-2 border-purple-500 animate-fadeIn">
                             ${log}
                          </div>
                        `)}
                     </div>
                   </div>
                 `}
               </div>
             `}

             `}
           </div>
        </div>
      `}

    </div>
  `;
}
