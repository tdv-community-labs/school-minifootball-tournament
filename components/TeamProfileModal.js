/**
 * ============================================================================
 * FAYL ADI: components/TeamProfileModal.js
 * MƏQSƏDİ: Komandaların (Siniflərin) detallı profili, heyəti və statistikası
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';
import { TeamBadge } from './ui.js';

const html = htm.bind(React.createElement);

export default function TeamProfileModal({ teamName, activeYear, onClose, onOpenPlayerProfile }) {
  const [teamStats, setTeamStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamName) return;
    const load = async () => {
      setLoading(true);
      const allMatches = await db.getMatches(activeYear);
      const allPlayers = await db.getPlayers(activeYear);
      
      // Filter players for this team
      const roster = allPlayers.filter(p => p.className === teamName).sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      // Calculate team stats from matches
      let pld = 0, w = 0, d = 0, l = 0, gf = 0, ga = 0;
      let form = [];
      
      allMatches.forEach(m => {
        if (m.teamA === teamName || m.teamB === teamName) {
          pld++;
          const isA = m.teamA === teamName;
          const myG = isA ? m.scoreA : m.scoreB;
          const opG = isA ? m.scoreB : m.scoreA;
          
          gf += myG;
          ga += opG;
          
          if (myG > opG) { w++; form.push('W'); }
          else if (myG === opG) { d++; form.push('D'); }
          else { l++; form.push('L'); }
        }
      });
      
      // Keep last 5 for form
      form = form.slice(-5).reverse();
      
      setTeamStats({ pld, w, d, l, gf, ga, gd: gf - ga, form, pts: (w * 3) + d });
      setPlayers(roster);
      setLoading(false);
    };
    load();
  }, [teamName, activeYear]);

  if (!teamName) return null;

  return html\`
    <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-black/70 backdrop-blur-md sm:p-4 transition-all animate-fadeIn">
      <div className="bg-[#11131a] w-full max-w-4xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-white/10 relative overflow-hidden animate-slideUp">
        
        <!-- Header / Banner -->
        <div className="relative h-40 sm:h-56 bg-gradient-to-r from-emerald-900 to-[#11131a] flex items-end p-6 border-b border-white/10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-4 right-4 flex gap-2">
            \${teamStats?.form.map((f, i) => html\`
              <span key=\${i} className=\${\`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded text-[10px] sm:text-xs font-black text-white \${f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-amber-500' : 'bg-rose-500'}\`}>
                \${f}
              </span>
            \`)}
          </div>
          
          <button onClick=\${onClose} className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-rose-500 transition-colors z-20">
            <i className="fas fa-times"></i>
          </button>

          <div className="relative z-10 flex items-end gap-4 sm:gap-6 w-full">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl bg-[#090A0F] border-[3px] border-[#090A0F] shadow-2xl shrink-0 -mb-10 sm:-mb-12 overflow-hidden flex items-center justify-center">
              <\${TeamBadge} teamName=\${teamName} className="w-16 h-16 sm:w-24 sm:h-24" />
            </div>
            <div className="flex-1 pb-1">
              <span className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-900/40 px-2 py-0.5 rounded border border-emerald-500/20">Turnir Komandası</span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-1 uppercase tracking-tight">\${teamName}</h2>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-16 sm:pt-20">
          \${loading ? html\`
            <div className="flex justify-center py-12"><i className="fas fa-circle-notch fa-spin text-3xl text-emerald-500"></i></div>
          \` : html\`
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <!-- Left Col: Stats -->
              <div className="md:col-span-4 space-y-6">
                 <div className="bg-[#1e2333] border border-white/5 rounded-2xl p-5 shadow-lg">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Mövsüm Statistikası</h3>
                   <div className="grid grid-cols-2 gap-3">
                     <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                       <span className="block text-[10px] text-slate-500 font-bold uppercase">Xal</span>
                       <span className="block text-2xl font-black text-emerald-400">\${teamStats?.pts}</span>
                     </div>
                     <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                       <span className="block text-[10px] text-slate-500 font-bold uppercase">Oyun</span>
                       <span className="block text-2xl font-black text-white">\${teamStats?.pld}</span>
                     </div>
                     <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                       <span className="block text-[10px] text-slate-500 font-bold uppercase">Qələbə</span>
                       <span className="block text-2xl font-black text-emerald-500">\${teamStats?.w}</span>
                     </div>
                     <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                       <span className="block text-[10px] text-slate-500 font-bold uppercase">Məğlubiyyət</span>
                       <span className="block text-2xl font-black text-rose-500">\${teamStats?.l}</span>
                     </div>
                     <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                       <span className="block text-[10px] text-slate-500 font-bold uppercase">Vurulan</span>
                       <span className="block text-2xl font-black text-sky-400">\${teamStats?.gf}</span>
                     </div>
                     <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                       <span className="block text-[10px] text-slate-500 font-bold uppercase">Buraxılan</span>
                       <span className="block text-2xl font-black text-rose-400">\${teamStats?.ga}</span>
                     </div>
                   </div>
                 </div>
                 
                 <!-- Average Team Rating -->
                 <div className="bg-[#1e2333] border border-white/5 rounded-2xl p-5 shadow-lg flex items-center justify-between">
                   <div>
                     <span className="block text-xs font-black text-slate-400 uppercase tracking-widest">Orta Reytinq</span>
                     <span className="block text-[10px] text-slate-500 mt-0.5">Oyunçuların ortalaması</span>
                   </div>
                   <div className="text-3xl font-black text-white">
                     \${players.length > 0 ? (players.reduce((a,b)=>a+(b.rating||6.5),0) / players.length).toFixed(2) : '0.00'}
                   </div>
                 </div>
              </div>

              <!-- Right Col: Squad List -->
              <div className="md:col-span-8">
                 <div className="bg-[#1e2333] border border-white/5 rounded-2xl p-5 shadow-lg h-full min-h-[400px] flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Komanda Heyəti (Kadr)</h3>
                     <span className="text-xs font-bold text-slate-500 bg-black/40 px-2 py-1 rounded border border-white/10">\${players.length} Oyunçu</span>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                     \${players.length === 0 ? html\`
                       <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                         <i className="fas fa-users text-4xl mb-2"></i>
                         <p className="text-sm">Bu komandaya aid oyunçu tapılmadı</p>
                       </div>
                     \` : players.map((p, i) => html\`
                       <div key=\${i} 
                            onClick=\${() => onOpenPlayerProfile && onOpenPlayerProfile(p.name)}
                            className="flex items-center justify-between p-3 bg-black/20 hover:bg-white/5 border border-white/5 rounded-xl transition-colors cursor-pointer group">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                             <i className=\${\`fas \${p.isKeeper ? 'fa-hand-paper' : 'fa-user'}\`}></i>
                           </div>
                           <div>
                             <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">\${p.name}</h4>
                             <p className="text-[10px] text-slate-400 uppercase tracking-wider">\${p.isKeeper ? 'Qapıçı (GK)' : 'Meydan Oyunçusu'}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-4">
                           <div className="text-right hidden sm:block">
                             <span className="block text-[10px] text-slate-500 font-bold uppercase">Qol</span>
                             <span className="block text-xs font-black text-white">\${p.goals || 0}</span>
                           </div>
                           \${p.rating && html\`
                             <span className=\${\`text-xs font-black px-2 py-1 rounded shadow-md \${getSofascoreBadgeStyle(p.rating)}\`}>\${p.rating.toFixed(1)}</span>
                           \`}
                         </div>
                       </div>
                     \`)}
                   </div>
                 </div>
              </div>
              
            </div>
          \`}
        </div>
      </div>
    </div>
  \`;
}
