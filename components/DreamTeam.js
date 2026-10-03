/**
 * ============================================================================
 * FAYL ADI: components/DreamTeam.js
 * MƏQSƏDİ: "Xəyalındakı 5-liyi Qur" (Dream Team Builder)
 * ============================================================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';

const html = htm.bind(React.createElement);

export default function DreamTeam({ activeYear }) {
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Taktika formasiyası (Minifootball 5v5: 1 GK + 4 Outfield)
  // Options: '1-2-1' (Diamond), '2-2' (Square), '1-3' (Pyramid), '3-1' (Defensive)
  const [formation, setFormation] = useState('1-2-1'); 
  
  // Slots: gk, def1, def2, mid1, mid2, fwd1, fwd2 (we use 5 active slots based on formation)
  const [team, setTeam] = useState({
    gk: null, p1: null, p2: null, p3: null, p4: null
  });
  
  const [activeSlot, setActiveSlot] = useState(null); // Which slot is currently selecting a player?

  useEffect(() => {
    const load = async () => {
      const p = await db.getPlayers(activeYear);
      setPlayers(p || []);
    };
    load();
  }, [activeYear]);

  // Derived stats
  const selectedCount = Object.values(team).filter(p => p !== null).length;
  
  const teamRating = useMemo(() => {
    let total = 0;
    let count = 0;
    Object.values(team).forEach(p => {
      if (p) { total += (p.rating || 6.5); count++; }
    });
    return count > 0 ? (total / count).toFixed(2) : '0.00';
  }, [team]);
  
  const teamValue = useMemo(() => {
    let base = 0;
    Object.values(team).forEach(p => {
      if (p) {
        let v = 500;
        let r = p.rating || 6.5;
        if (r > 7.0) v += (r - 7.0) * 1000;
        if (r >= 8.0) v += (r - 8.0) * 3000;
        if (r >= 9.0) v += (r - 9.0) * 10000;
        v += ((p.goals || 0) * 100) + ((p.matches || 0) * 50);
        base += v;
      }
    });
    return base >= 1000 ? "€" + (base / 1000).toFixed(1) + "M" : "€" + Math.floor(base) + "K";
  }, [team]);

  const handleSelectPlayer = (player) => {
    if (!activeSlot) return;
    
    // Check if player is already in team
    if (Object.values(team).some(p => p?.name === player.name)) {
      alert("Bu oyunçu artıq komandadadır!");
      return;
    }
    
    setTeam(prev => ({ ...prev, [activeSlot]: player }));
    setActiveSlot(null);
    setSearchTerm('');
  };

  const removePlayer = (slotId, e) => {
    e.stopPropagation();
    setTeam(prev => ({ ...prev, [slotId]: null }));
  };

  // Renders a pitch slot
  const renderSlot = (slotId, label, x, y) => {
    const p = team[slotId];
    return html`
      <div 
        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group z-10"
        style=${{ left: x + '%', top: y + '%' }}
        onClick=${() => setActiveSlot(slotId)}
      >
        <div className=${`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-[3px] flex items-center justify-center cursor-pointer transition-all transform hover:scale-110 shadow-xl relative overflow-hidden ${p ? 'border-emerald-400 bg-slate-900' : activeSlot === slotId ? 'border-yellow-400 bg-yellow-400/20 animate-pulse' : 'border-white/40 bg-black/40 hover:border-white'}`}>
          ${p ? html`
             <i className="fas fa-user text-2xl sm:text-3xl text-slate-300 opacity-50 absolute bottom-0 translate-y-1/4"></i>
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
             ${p.rating && html`
               <div className=${`absolute bottom-0 w-full text-center text-[10px] font-black ${getSofascoreBadgeStyle(p.rating)}`}>
                 ${p.rating.toFixed(1)}
               </div>
             `}
             <button onClick=${(e) => removePlayer(slotId, e)} className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full text-[8px] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-times"></i></button>
          ` : html`
             <i className="fas fa-plus text-white/50 text-xl"></i>
          `}
        </div>
        <div className="mt-1 bg-black/80 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase text-white shadow-md border border-white/10 text-center min-w-[60px] truncate max-w-[80px]">
          ${p ? p.name.split(' ')[0] : label}
        </div>
      </div>
    `;
  };

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8);
  }, [searchTerm, players]);

  return html`
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
      
      <!-- HEADER -->
      <div className="flex flex-col sm:flex-row items-center justify-between bg-[#161a25] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-purple-600/20 blur-[50px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-emerald-600/20 blur-[50px] rounded-full pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10 mb-6 sm:mb-0">
          <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center text-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <i className="fas fa-star"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase">Xəyalındakı 5-liyi Qur</h2>
            <p className="text-xs text-slate-400">Öz "Dream Team" komandanı yarat və dostlarınla paylaş</p>
          </div>
        </div>
        
        <div className="flex gap-4 relative z-10 w-full sm:w-auto">
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 flex-1 sm:flex-none text-center">
             <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Komanda Reytinqi</span>
             <span className="block text-2xl font-black text-emerald-400 drop-shadow-md">${teamRating}</span>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3 flex-1 sm:flex-none text-center">
             <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bazar Dəyəri</span>
             <span className="block text-2xl font-black text-yellow-400 drop-shadow-md">${teamValue}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- PITCH -->
        <div className="lg:col-span-8 bg-[#161a25] border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Taktiki Lövhə</h3>
             <select 
               value=${formation} 
               onChange=${(e) => setFormation(e.target.value)}
               className="bg-slate-900 border border-white/10 text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
             >
               <option value="1-2-1">1-2-1 (Almaz)</option>
               <option value="2-2">2-2 (Kvadrat)</option>
               <option value="1-3">1-3 (Piramida)</option>
               <option value="3-1">3-1 (Müdafiə)</option>
             </select>
           </div>
           
           <div className="relative w-full aspect-[2/3] sm:aspect-square md:aspect-video bg-emerald-700 rounded-2xl overflow-hidden border-4 border-emerald-900 shadow-inner max-h-[600px] mx-auto flex-1">
             <!-- Grass Pattern -->
             <div className="absolute inset-0 opacity-30" style=${{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0%, transparent 10%, #000 10%, #000 20%)' }}></div>
             <!-- Lines -->
             <div className="absolute inset-0 border-[3px] border-white/60 m-4 rounded-sm"></div>
             <!-- Center Line -->
             <div className="absolute top-1/2 left-4 right-4 h-0 border-t-[3px] border-white/60 -translate-y-1/2"></div>
             <!-- Center Circle -->
             <div className="absolute top-1/2 left-1/2 w-20 h-20 sm:w-32 sm:h-32 border-[3px] border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
             <!-- Center Dot -->
             <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
             <!-- Top Penalty Area -->
             <div className="absolute top-4 left-1/2 w-40 sm:w-64 h-16 sm:h-24 border-b-[3px] border-x-[3px] border-white/60 -translate-x-1/2"></div>
             <!-- Bottom Penalty Area -->
             <div className="absolute bottom-4 left-1/2 w-40 sm:w-64 h-16 sm:h-24 border-t-[3px] border-x-[3px] border-white/60 -translate-x-1/2"></div>

             <!-- SLOTS based on Formation (Attacking upwards) -->
             ${renderSlot('gk', 'QAP (GK)', 50, 90)}
             
             ${formation === '1-2-1' && html`
               ${renderSlot('p1', 'MÜD (CB)', 50, 70)}
               ${renderSlot('p2', 'YRM (LM)', 25, 45)}
               ${renderSlot('p3', 'YRM (RM)', 75, 45)}
               ${renderSlot('p4', 'HÜC (ST)', 50, 20)}
             `}
             ${formation === '2-2' && html`
               ${renderSlot('p1', 'MÜD (LB)', 30, 70)}
               ${renderSlot('p2', 'MÜD (RB)', 70, 70)}
               ${renderSlot('p3', 'HÜC (LF)', 30, 25)}
               ${renderSlot('p4', 'HÜC (RF)', 70, 25)}
             `}
             ${formation === '1-3' && html`
               ${renderSlot('p1', 'MÜD (CB)', 50, 75)}
               ${renderSlot('p2', 'YRM (LW)', 20, 35)}
               ${renderSlot('p3', 'YRM (CAM)', 50, 45)}
               ${renderSlot('p4', 'YRM (RW)', 80, 35)}
             `}
             ${formation === '3-1' && html`
               ${renderSlot('p1', 'MÜD (LB)', 20, 65)}
               ${renderSlot('p2', 'MÜD (CB)', 50, 75)}
               ${renderSlot('p3', 'MÜD (RB)', 80, 65)}
               ${renderSlot('p4', 'HÜC (ST)', 50, 25)}
             `}
           </div>
        </div>

        <!-- SIDEBAR: PLAYER SELECTION -->
        <div className="lg:col-span-4 bg-[#161a25] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col h-[500px] lg:h-auto">
          ${activeSlot ? html`
             <div className="flex-1 flex flex-col animate-fadeIn">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-black text-white">Oyunçu Seç</h3>
                 <button onClick=${() => setActiveSlot(null)} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
               </div>
               
               <div className="relative mb-4">
                 <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                 <input 
                   type="text" 
                   autoFocus
                   value=${searchTerm}
                   onInput=${e => setSearchTerm(e.target.value)}
                   placeholder="Oyunçunun adını yazın..." 
                   className="w-full bg-[#1e2333] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500"
                 />
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                 ${searchTerm === '' ? html`
                   <div className="h-full flex flex-col items-center justify-center text-slate-500">
                     <i className="fas fa-search text-3xl mb-2 opacity-50"></i>
                     <span className="text-xs">Axtarışa başlayın...</span>
                   </div>
                 ` : searchResults.length === 0 ? html`
                   <div className="text-center text-slate-500 text-xs py-4">Oyunçu tapılmadı</div>
                 ` : searchResults.map(p => html`
                   <div 
                     key=${p.name}
                     onClick=${() => handleSelectPlayer(p)}
                     className="bg-[#1e2333] border border-white/5 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors group"
                   >
                     <div>
                       <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">${p.name}</div>
                       <div className="text-[10px] text-slate-400 mt-0.5">${p.className}</div>
                     </div>
                     ${p.rating && html`
                        <span className=${`text-[10px] font-black px-2 py-0.5 rounded shadow ${getSofascoreBadgeStyle(p.rating)}`}>${p.rating.toFixed(1)}</span>
                     `}
                   </div>
                 `)}
               </div>
             </div>
          ` : html`
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-fadeIn">
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-4xl text-slate-600 mb-4 shadow-inner">
                 <i className="fas fa-hand-pointer"></i>
               </div>
               <h3 className="text-lg font-black text-white mb-2">Taktikada Boşluğa Kliklə</h3>
               <p className="text-sm text-slate-400 max-w-[200px]">Meydançadakı "+" ikonlarına basaraq oyunçuları seçin və "Dream Team" qurun.</p>
               
               ${selectedCount === 5 && html`
                 <button className="mt-8 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-transform hover:scale-105 active:scale-95 flex items-center gap-2">
                   <i className="fas fa-share-alt"></i> Komandanı Paylaş
                 </button>
               `}
             </div>
          `}
        </div>

      </div>
    </div>
  `;
}
