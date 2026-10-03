/**
 * ============================================================================
 * FAYL ADI: components/Playoffs.js
 * MƏQSƏDİ: Pley-off Ağacı (Bracket) vizualizasiyası
 * ============================================================================
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export default function Playoffs({ activeYear }) {
  // Placeholder data for the bracket
  const bracket = {
    quarterFinals: [
      { id: 1, team1: '11 A', score1: 3, team2: '10 B', score2: 1, winner: '11 A', status: 'finished' },
      { id: 2, team1: '11 H', score1: 4, team2: '10 A', score2: 2, winner: '11 H', status: 'finished' },
      { id: 3, team1: '11 B', score1: 1, team2: '9 A', score2: 2, winner: '9 A', status: 'finished' },
      { id: 4, team1: '11 C', score1: null, team2: '9 B', score2: null, winner: null, status: 'upcoming', date: 'Sabah, 12:00' }
    ],
    semiFinals: [
      { id: 5, team1: '11 A', score1: 2, team2: '11 H', score2: 2, pen1: 4, pen2: 5, winner: '11 H', status: 'finished' },
      { id: 6, team1: '9 A', score1: null, team2: 'TBD', score2: null, winner: null, status: 'upcoming', date: '25 May' }
    ],
    final: [
      { id: 7, team1: '11 H', score1: null, team2: 'TBD', score2: null, winner: null, status: 'upcoming', date: '30 May, 18:00' }
    ]
  };

  const MatchBox = ({ match, type }) => {
    const isTBD1 = match.team1 === 'TBD' || !match.team1;
    const isTBD2 = match.team2 === 'TBD' || !match.team2;
    
    return html`
      <div className="w-48 sm:w-56 bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg relative z-10 group hover:border-emerald-500/50 transition-colors">
        ${match.status === 'upcoming' && html`
          <div className="absolute top-0 left-0 right-0 bg-slate-800 text-[9px] font-black text-slate-400 text-center py-0.5 border-b border-slate-700/50 uppercase tracking-widest">
            ${match.date}
          </div>
        `}
        
        <!-- Team 1 -->
        <div className=${`flex items-center justify-between p-2.5 sm:p-3 border-b border-white/5 ${match.status === 'upcoming' ? 'mt-3' : ''} ${match.winner === match.team1 ? 'bg-emerald-900/20' : match.winner && match.winner !== match.team1 ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            ${!isTBD1 ? html`
              <div className="w-5 h-5 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-black text-white">${match.team1.split(' ')[0]}</div>
            ` : html`
              <div className="w-5 h-5 rounded border border-dashed border-slate-600 flex items-center justify-center text-[10px] text-slate-500">?</div>
            `}
            <span className=${`text-xs sm:text-sm font-bold ${match.winner === match.team1 ? 'text-white' : 'text-slate-300'}`}>${match.team1 || 'TBD'}</span>
          </div>
          <span className=${`text-sm font-black ${match.winner === match.team1 ? 'text-emerald-400' : 'text-slate-400'}`}>
            ${match.score1 !== null ? match.score1 : '-'}
            ${match.pen1 ? html`<sup className="text-[9px] ml-0.5 text-amber-400">(${match.pen1})</sup>` : null}
          </span>
        </div>
        
        <!-- Team 2 -->
        <div className=${`flex items-center justify-between p-2.5 sm:p-3 ${match.winner === match.team2 ? 'bg-emerald-900/20' : match.winner && match.winner !== match.team2 ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-2">
            ${!isTBD2 ? html`
              <div className="w-5 h-5 rounded bg-slate-800 border border-slate-600 flex items-center justify-center text-[10px] font-black text-white">${match.team2.split(' ')[0]}</div>
            ` : html`
              <div className="w-5 h-5 rounded border border-dashed border-slate-600 flex items-center justify-center text-[10px] text-slate-500">?</div>
            `}
            <span className=${`text-xs sm:text-sm font-bold ${match.winner === match.team2 ? 'text-white' : 'text-slate-300'}`}>${match.team2 || 'TBD'}</span>
          </div>
          <span className=${`text-sm font-black ${match.winner === match.team2 ? 'text-emerald-400' : 'text-slate-400'}`}>
            ${match.score2 !== null ? match.score2 : '-'}
            ${match.pen2 ? html`<sup className="text-[9px] ml-0.5 text-amber-400">(${match.pen2})</sup>` : null}
          </span>
        </div>
      </div>
    `;
  };

  return html`
    <div className="max-w-[1200px] mx-auto space-y-8 animate-fadeIn pb-20 overflow-x-auto custom-scrollbar">
      
      <!-- HEADER -->
      <div className="relative bg-gradient-to-br from-emerald-950 via-[#161a25] to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden min-w-[800px]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <i className="fas fa-sitemap"></i>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg mb-1">Pley-off Ağacı</h2>
            <p className="text-slate-400 text-sm sm:text-base">Çempionluğa gedən yol. 1/4 Finaldan Böyük Finala qədər bütün qarşılaşmalar.</p>
          </div>
        </div>
      </div>

      <!-- BRACKET CONTAINER -->
      <div className="flex items-center justify-between min-w-[900px] px-4 py-8 relative">
        
        <!-- Connecting SVG Lines -->
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style=${{ zIndex: 0 }}>
          <!-- QF to SF Lines -->
          <path d="M 230,80 L 260,80 L 260,165 L 340,165" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <path d="M 230,250 L 260,250 L 260,165 L 340,165" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          
          <path d="M 230,420 L 260,420 L 260,505 L 340,505" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <path d="M 230,590 L 260,590 L 260,505 L 340,505" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

          <!-- SF to Final Lines -->
          <path d="M 560,165 L 610,165 L 610,335 L 680,335" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
          <path d="M 560,505 L 610,505 L 610,335 L 680,335" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        </svg>

        <!-- COLUMN 1: QUARTER FINALS -->
        <div className="flex flex-col gap-16 relative z-10 w-56">
          <div className="text-center mb-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-700 px-4 py-1.5 rounded-full shadow-sm">1/4 Final</span>
          </div>
          
          <div className="space-y-[90px]">
            <${MatchBox} match=${bracket.quarterFinals[0]} type="qf" />
            <${MatchBox} match=${bracket.quarterFinals[1]} type="qf" />
          </div>
          <div className="space-y-[90px] mt-12">
            <${MatchBox} match=${bracket.quarterFinals[2]} type="qf" />
            <${MatchBox} match=${bracket.quarterFinals[3]} type="qf" />
          </div>
        </div>

        <!-- COLUMN 2: SEMI FINALS -->
        <div className="flex flex-col justify-center gap-[260px] relative z-10 w-56">
          <div className="text-center absolute -top-4 w-full">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-700 px-4 py-1.5 rounded-full shadow-sm">Yarımfinal</span>
          </div>
          
          <${MatchBox} match=${bracket.semiFinals[0]} type="sf" />
          <${MatchBox} match=${bracket.semiFinals[1]} type="sf" />
        </div>

        <!-- COLUMN 3: FINAL -->
        <div className="flex flex-col justify-center relative z-10 w-64">
          <div className="text-center mb-6">
            <div className="inline-block p-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 rounded-full mb-2 shadow-[0_0_15px_rgba(251,191,36,0.4)]">
              <div className="bg-slate-950 px-5 py-1.5 rounded-full">
                <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 uppercase tracking-widest">Böyük Final</span>
              </div>
            </div>
          </div>
          
          <!-- Grand Final MatchBox Wrapper -->
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-sky-500/20 blur-xl rounded-full"></div>
            <${MatchBox} match=${bracket.final[0]} type="final" />
          </div>
          
          <!-- Trophy Icon -->
          <div className="flex justify-center mt-8 opacity-50">
            <i className="fas fa-trophy text-6xl text-slate-700"></i>
          </div>
        </div>

      </div>
    </div>
  `;
}
