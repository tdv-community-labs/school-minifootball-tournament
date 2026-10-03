/**
 * ============================================================================
 * FAYL ADI: components/Trophies.js
 * MƏQSƏDİ: Trofey Zalı, Turnir Rekordları və Şöhrət Zalı
 * ============================================================================
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export default function Trophies({ activeYear }) {

  const records = [
    { title: "Mövsümün Bombardiri", holder: "Murad Abdullayev", record: "12 Qol", icon: "fa-futbol", color: "from-amber-400 to-yellow-600" },
    { title: "Ən Çox Asist", holder: "Cavid Rzayev", record: "8 Asist", icon: "fa-hands-helping", color: "from-sky-400 to-blue-600" },
    { title: "Ən Sürətli Qol", holder: "Kamran", record: "14. Saniyə", icon: "fa-bolt", color: "from-purple-400 to-indigo-600" },
    { title: "Ən Çox Xilas (Seyv)", holder: "Emin Məmmədov", record: "45 Seyv", icon: "fa-hand-paper", color: "from-emerald-400 to-green-600" },
    { title: "Məğlubiyyətsiz Seriya", holder: "11 H Komandası", record: "8 Oyun", icon: "fa-shield-alt", color: "from-rose-400 to-red-600" },
    { title: "Ən Böyük Hesablı Qələbə", holder: "11 A - 10 B", record: "7 - 1", icon: "fa-compress-arrows-alt", color: "from-slate-400 to-slate-600" }
  ];

  return html`
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20">
      
      <!-- HEADER -->
      <div className="relative bg-[#0d1117] border border-amber-500/20 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center">
        <!-- Shine Effects -->
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        
        <!-- Animated Stars -->
        <div className="absolute top-10 left-10 text-amber-500/30 animate-ping"><i className="fas fa-star text-xs"></i></div>
        <div className="absolute top-20 right-20 text-amber-500/20 animate-pulse"><i className="fas fa-star text-lg"></i></div>
        <div className="absolute bottom-10 left-32 text-amber-500/40 animate-pulse"><i className="fas fa-star text-sm"></i></div>

        <div className="relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.4)] mb-6">
            <i className="fas fa-trophy text-4xl sm:text-5xl text-amber-950 drop-shadow-md"></i>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 tracking-tight drop-shadow-lg mb-3">Şöhrət Zalı & Rekordlar</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">TDV BTL Minifutbol turnirinin tarixinə adını qızıl hərflərlə yazdıranlar, unudulmaz rekordlar və xüsusi mükafatlar.</p>
        </div>
      </div>

      <!-- MAIN AWARDS -->
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- GOLDEN BALL -->
        <div className="bg-[#161b22] border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 shadow-lg">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-[40px] group-hover:bg-amber-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-amber-400 font-black uppercase tracking-widest text-xs mb-1">Qızıl Top (MVP)</h3>
              <h4 className="text-white font-bold text-xl">Mövsümün Ən Yaxşısı</h4>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.5)]">
              <i className="fas fa-futbol text-amber-950 text-xl"></i>
            </div>
          </div>
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative z-10">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Cari Lider</div>
            <div className="text-lg font-black text-white">Cavid Rzayev</div>
            <div className="text-xs text-amber-400 font-bold mt-1">9.2 Orta Reytinq</div>
          </div>
        </div>

        <!-- GOLDEN BOOT -->
        <div className="bg-[#161b22] border border-slate-300/30 rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 shadow-lg">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-300/10 rounded-full blur-[40px] group-hover:bg-slate-300/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-slate-300 font-black uppercase tracking-widest text-xs mb-1">Qızıl Buts</h3>
              <h4 className="text-white font-bold text-xl">Baş Bombardir</h4>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 flex items-center justify-center shadow-[0_0_15px_rgba(203,213,225,0.4)]">
              <i className="fas fa-shoe-prints text-slate-900 text-xl"></i>
            </div>
          </div>
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative z-10">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Cari Lider</div>
            <div className="text-lg font-black text-white">Murad Abdullayev</div>
            <div className="text-xs text-slate-300 font-bold mt-1">12 Qol</div>
          </div>
        </div>

        <!-- GOLDEN GLOVE -->
        <div className="bg-[#161b22] border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 shadow-lg">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-emerald-400 font-black uppercase tracking-widest text-xs mb-1">Qızıl Əlcək</h3>
              <h4 className="text-white font-bold text-xl">Ən Yaxşı Qapıçı</h4>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-300 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.5)]">
              <i className="fas fa-mitten text-emerald-950 text-xl"></i>
            </div>
          </div>
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative z-10">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Cari Lider</div>
            <div className="text-lg font-black text-white">Emin Məmmədov</div>
            <div className="text-xs text-emerald-400 font-bold mt-1">45 Seyv (8 Klintşit)</div>
          </div>
        </div>

      </div>

      <!-- RECORDS GRID -->
      <div>
        <h3 className="text-xl font-black text-white flex items-center gap-2 mb-6">
          <i className="fas fa-clipboard-list text-purple-400"></i> Turnir Rekordları (All-Time)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${records.map((rec, i) => html`
            <div key=${i} className="bg-[#161b22] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/5 transition-colors">
              <div className=${`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${rec.color} flex items-center justify-center text-white shadow-lg`}>
                <i className=${`fas ${rec.icon} text-lg`}></i>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">${rec.title}</p>
                <p className="text-sm font-black text-white truncate">${rec.holder}</p>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">${rec.record}</p>
              </div>
            </div>
          `)}
        </div>
      </div>

    </div>
  `;
}
