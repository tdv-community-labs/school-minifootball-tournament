/**
 * ============================================================================
 * FAYL ADI: components/Market.js
 * MƏQSƏDİ: Transfer Bazarı, Ən Bahalı Oyunçular və Liderlər Cədvəli
 * ============================================================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';

const html = htm.bind(React.createElement);

export default function Market({ activeYear, onOpenPlayerProfile }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('value'); // value, rating, goals, assists

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const p = await db.getPlayers(activeYear);
      
      // Calculate market value for each player
      const enhancedPlayers = (p || []).map(player => {
        let base = 500;
        let r = player.rating || 6.5;
        if (r > 7.0) base += (r - 7.0) * 1000;
        if (r >= 8.0) base += (r - 8.0) * 3000;
        if (r >= 9.0) base += (r - 9.0) * 10000;
        base += ((player.goals || 0) * 100) + ((player.matches || 0) * 50);
        return {
          ...player,
          marketValueRaw: base,
          marketValue: base >= 1000 ? "€" + (base / 1000).toFixed(1) + "M" : "€" + Math.floor(base) + "K"
        };
      });
      
      setPlayers(enhancedPlayers);
      setLoading(false);
    };
    load();
  }, [activeYear]);

  const sortedPlayers = useMemo(() => {
    let sorted = [...players];
    if (activeFilter === 'value') sorted.sort((a, b) => b.marketValueRaw - a.marketValueRaw);
    if (activeFilter === 'rating') sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (activeFilter === 'goals') sorted.sort((a, b) => (b.goals || 0) - (a.goals || 0));
    if (activeFilter === 'assists') sorted.sort((a, b) => (b.assists || 0) - (a.assists || 0));
    return sorted.slice(0, 15); // Top 15
  }, [players, activeFilter]);

  if (loading) {
    return html`<div className="flex justify-center items-center h-64"><i className="fas fa-circle-notch fa-spin text-3xl text-emerald-500"></i></div>`;
  }

  return html`
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
      
      <!-- HEADER -->
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-[#161a25] to-emerald-950/30 border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 blur-[80px] pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10 mb-6 sm:mb-0">
          <div className="w-14 h-14 bg-yellow-500/20 text-yellow-400 rounded-2xl flex items-center justify-center text-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <i className="fas fa-hand-holding-usd"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase">Bazar Dəyəri & Liderlər</h2>
            <p className="text-xs text-slate-400">Turnirin ən bahalı və ən reytinqli oyunçuları</p>
          </div>
        </div>
        
        <!-- Total Market Value -->
        <div className="bg-black/40 border border-white/5 p-3 rounded-2xl text-center relative z-10 min-w-[150px]">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Turnirin Ümumi Dəyəri</span>
          <span className="block text-xl font-black text-emerald-400 drop-shadow-md">
            ${(() => {
              const total = players.reduce((acc, p) => acc + p.marketValueRaw, 0);
              return total >= 1000 ? "€" + (total / 1000).toFixed(1) + "M" : "€" + Math.floor(total) + "K";
            })()}
          </span>
        </div>
      </div>

      <!-- FILTERS -->
      <div className="flex bg-[#161a25] border border-white/5 p-1.5 rounded-2xl overflow-x-auto custom-scrollbar shadow-lg">
        ${[
          { id: 'value', icon: 'fa-euro-sign', label: 'Ən Bahalı' },
          { id: 'rating', icon: 'fa-star', label: 'Ən Reytinqli' },
          { id: 'goals', icon: 'fa-futbol', label: 'Bombardirlər' },
          { id: 'assists', icon: 'fa-hands-helping', label: 'Asistentlər' }
        ].map(f => html`
          <button 
            key=${f.id}
            onClick=${() => setActiveFilter(f.id)}
            className=${`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${activeFilter === f.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <i className=${`fas ${f.icon}`}></i>
            ${f.label}
          </button>
        `)}
      </div>

      <!-- LEADERBOARD LIST -->
      <div className="bg-[#161a25] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-black/40 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
           <div className="col-span-1 text-center">#</div>
           <div className="col-span-5 sm:col-span-4">Oyunçu</div>
           <div className="col-span-3 sm:col-span-2 text-center">Komanda</div>
           <div className="col-span-3 sm:col-span-3 text-right">${activeFilter === 'value' ? 'Bazar Dəyəri' : activeFilter === 'rating' ? 'Reytinq' : activeFilter === 'goals' ? 'Qollar' : 'Asistlər'}</div>
           <div className="col-span-2 text-right hidden sm:block">Reytinq</div>
        </div>
        
        <div className="divide-y divide-white/5">
          ${sortedPlayers.map((player, idx) => html`
            <div 
              key=${player.id || player.name} 
              onClick=${() => onOpenPlayerProfile(player.name)}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <!-- Rank -->
              <div className="col-span-1 text-center">
                ${idx === 0 ? html`<i className="fas fa-trophy text-yellow-400 text-lg drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"></i>` : 
                  idx === 1 ? html`<i className="fas fa-medal text-slate-300 text-lg drop-shadow-md"></i>` : 
                  idx === 2 ? html`<i className="fas fa-medal text-amber-600 text-lg drop-shadow-md"></i>` : 
                  html`<span className="text-sm font-black text-slate-600">${idx + 1}</span>`}
              </div>
              
              <!-- Player Info -->
              <div className="col-span-5 sm:col-span-4 flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 shrink-0 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <i className="fas fa-user"></i>
                </div>
                <div className="truncate">
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">${player.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:block">${player.position || 'Oyunçu'}</p>
                </div>
              </div>
              
              <!-- Team -->
              <div className="col-span-3 sm:col-span-2 text-center text-xs font-bold text-slate-300 truncate">
                ${player.className}
              </div>
              
              <!-- Primary Stat -->
              <div className="col-span-3 sm:col-span-3 text-right flex items-center justify-end">
                ${activeFilter === 'value' ? html`
                  <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-sm font-black shadow-sm">${player.marketValue}</span>
                ` : activeFilter === 'rating' ? html`
                  <span className=${`text-sm font-black px-2.5 py-1 rounded-md shadow ${getSofascoreBadgeStyle(player.rating)}`}>${(player.rating || 6.5).toFixed(1)}</span>
                ` : activeFilter === 'goals' ? html`
                  <span className="text-sm font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">${player.goals || 0}</span>
                ` : html`
                  <span className="text-sm font-black text-white bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">${player.assists || 0}</span>
                `}
              </div>
              
              <!-- Rating (Desktop only) -->
              <div className="col-span-2 text-right hidden sm:flex items-center justify-end">
                ${activeFilter !== 'rating' && player.rating ? html`
                  <span className=${`text-xs font-black px-2 py-0.5 rounded shadow ${getSofascoreBadgeStyle(player.rating)}`}>${player.rating.toFixed(1)}</span>
                ` : activeFilter !== 'rating' ? html`<span className="text-xs text-slate-600">-</span>` : null}
              </div>
            </div>
          `)}
        </div>
      </div>
      
    </div>
  `;
}
