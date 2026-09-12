/**
 * ============================================================================
 * FAYL ADI: components/PlayerProfileModal.js
 * MƏQSƏDİ: Oyunçunun Fərdi Karyera Pəncərəsi (Player Career Modal)
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Karyera xülasəsi: Bütün tarixi turnirlər üzrə cəmi qollar, assistlər, matçlar və orta reytinq.
 *   2. Mövsümlər üzrə bölgü cədvəli: Hansı ildə hansı sinifdə oynayıb və neçə qol vurub.
 *   3. Bütün matç tarixçəsi: İştirak etdiyi hər bir oyun, vurduğu qollar və matç videoları.
 *   4. Mövqe və xüsusi statuslar (Qapıçı seyvləri və s.).
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';
import { t as fallbackT } from '../services/i18n.js';

const html = htm.bind(React.createElement);

export default function PlayerProfileModal({ playerName, onClose, lang = 'en', t = (k) => fallbackT(k, lang) }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerName) return;

    let isMounted = true;
    setLoading(true);

    db.getUnifiedPlayerProfile(playerName)
      .then(data => {
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("PlayerProfileModal load error:", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [playerName]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!playerName) return null;

  return html`
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-purple-950/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-4 animate-fadeIn"
      style=${{
        WebkitOverflowScrolling: 'touch',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
      }}
      onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-purple-100 dark:border-slate-800 relative flex flex-col">
        
        <!-- Modal Top Header Banner -->
        <div className="relative bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-4 sm:p-6 rounded-t-3xl border-b border-purple-800/80 overflow-hidden">
          <div className="absolute right-0 top-0 -mr-10 -mt-10 w-40 h-40 bg-green-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-start justify-between relative z-10 gap-2">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <!-- Jersey / Avatar Badge -->
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-800 to-purple-900 border-2 border-purple-700/80 flex items-center justify-center text-xl sm:text-2xl shadow-md text-green-400 font-black shrink-0">
                ${profile?.isKeeper ? '🧤' : '🏃'}
              </div>
              
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="bg-green-500/20 text-green-400 border border-green-400/30 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ${profile ? profile.primaryClass : '—'} ${lang === 'az' ? 'Sinfi' : ''}
                  </span>
                  <span className="text-[11px] sm:text-xs text-purple-300 font-semibold truncate">
                    ${(profile?.positions || []).join(' • ') || (profile?.isKeeper ? (lang === 'az' ? 'Qapıçı' : 'Goalkeeper') : (lang === 'az' ? 'Hücumçu' : 'Player'))}
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-black mt-1 text-white tracking-tight truncate">
                  ${profile ? profile.name : playerName}
                </h2>
                <p className="text-[11px] sm:text-xs text-purple-200 mt-0.5 font-medium truncate">
                  ${lang === 'az' ? 'Məktəb Mini-Futbol Karyera Profili' : 'School Mini-Football Career Profile'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <!-- Career Rating Badge -->
              ${profile && html`
                <div className=${`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black shadow-md ${getSofascoreBadgeStyle(profile.careerRating)}`}>
                  <span className="text-sm sm:text-lg leading-none">${profile.careerRating}</span>
                  <span className="text-[7px] sm:text-[8px] font-medium opacity-80 mt-0.5">Sofascore</span>
                </div>
              `}

              <!-- Close button -->
              <button 
                onClick=${onClose}
                className="bg-purple-900/90 hover:bg-red-600 text-white transition w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shrink-0"
                title="Bağla (ESC)"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Modal Body Content -->
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          
          ${loading ? html`
            <div className="py-16 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-purple-900"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">${lang === 'az' ? 'Karyera məlumatları toplanır...' : 'Loading career stats...'}</p>
            </div>
          ` : !profile ? html`
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm font-semibold">${lang === 'az' ? 'Oyunçu məlumatı tapılmadı.' : 'Player profile not found.'}</p>
            </div>
          ` : html`
            
            <!-- Stat Highlights Grid (4 cards) -->
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  ⚽ ${lang === 'az' ? 'Karyera Qolları' : 'Career Goals'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200 mt-1 block">
                  ${profile.totalGoals}
                </span>
              </div>

              <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 p-4 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 dark:text-purple-300 block">
                  👟 ${lang === 'az' ? 'Asistlər' : 'Assists'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-purple-900 dark:text-purple-200 mt-1 block">
                  ${profile.totalAssists}
                </span>
              </div>

              <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 p-4 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 block">
                  🏟️ ${lang === 'az' ? 'Matç Sayı' : 'Matches'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-sky-900 dark:text-sky-200 mt-1 block">
                  ${profile.totalMatches}
                </span>
              </div>

              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-4 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  📈 ${lang === 'az' ? 'Qol/Oyun' : 'Goal Ratio'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200 mt-1 block">
                  ${profile.goalRatio}
                </span>
              </div>
            </div>

            <!-- Season Breakdown Table -->
            <div className="bg-gray-50 dark:bg-slate-950/60 rounded-2xl border border-gray-100 dark:border-slate-800 p-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-200 mb-3 flex items-center gap-1.5">
                <i className="fas fa-history text-green-500"></i>
                <span>${lang === 'az' ? 'Mövsümlər Üzrə Çıxış Tarixçəsi' : 'Season-by-Season Performance'}</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-400 font-bold border-b border-gray-200 dark:border-slate-800 pb-2">
                      <th className="py-2 px-3">${lang === 'az' ? 'Mövsüm' : 'Season'}</th>
                      <th className="py-2 px-3">${lang === 'az' ? 'Sinif' : 'Class'}</th>
                      <th className="py-2 px-3 text-center">${lang === 'az' ? 'Oyun' : 'Pld'}</th>
                      <th className="py-2 px-3 text-center">${lang === 'az' ? 'Qol' : 'Goals'}</th>
                      <th className="py-2 px-3 text-center">${lang === 'az' ? 'Asist' : 'Assists'}</th>
                      <th className="py-2 px-3 text-center">Sofascore</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    ${profile.seasons.map(s => html`
                      <tr key=${s.id || s.year} className="hover:bg-purple-50/30 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-purple-950 dark:text-slate-200">${s.year}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-700 dark:text-slate-300">${s.class} Sinfi</td>
                        <td className="py-2.5 px-3 text-center font-bold text-gray-600 dark:text-slate-400">${s.matchesPlayed}</td>
                        <td className="py-2.5 px-3 text-center font-black text-emerald-700 dark:text-emerald-400">⚽ ${s.goals}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-900 dark:text-purple-300">👟 ${s.assists}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className=${`text-[11px] font-black px-2 py-0.5 rounded-md ${getSofascoreBadgeStyle(s.rating)}`}>
                            ${s.rating}
                          </span>
                        </td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Match Highlights & Scoring Log -->
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                <i className="fas fa-futbol text-green-500"></i>
                <span>${lang === 'az' ? 'Qol Vurduğu və Fərqləndiyi Matçlar' : 'Match Scoring & Appearance Log'}</span>
                <span className="text-[10px] text-gray-400">(${profile.matches.length} ${lang === 'az' ? 'matç' : 'matches'})</span>
              </h4>

              ${profile.matches.length === 0 ? html`
                <p className="text-xs text-gray-400 py-3 text-center border border-dashed rounded-xl">
                  ${lang === 'az' ? 'Matç qolu qeydə alınmayıb.' : 'No detailed match goals logged.'}
                </p>
              ` : html`
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  ${profile.matches.map(m => html`
                    <div key=${m.id} className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 p-3 rounded-xl flex items-center justify-between shadow-2xs hover:border-purple-200 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded uppercase">
                            ${m.stage}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold">${m.year}</span>
                          ${m.videoUrl && html`
                            <span className="text-red-500 text-[10px]" title="Video İcmal"><i className="fab fa-youtube"></i></span>
                          `}
                        </div>
                        <p className="text-xs font-black text-purple-950 dark:text-slate-100 mt-1">
                          ${m.teamA} ${m.scoreA} - ${m.scoreB} ${m.teamB}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        ${m.goals > 0 && html`
                          <span className="goal-badge px-2 py-0.5 rounded-lg text-xs font-black">
                            ⚽ ${m.goals} ${lang === 'az' ? 'Qol' : 'Goals'}
                          </span>
                        `}
                        ${m.rating && html`
                          <span className=${`text-xs font-black px-1.5 py-0.5 rounded-md ${getSofascoreBadgeStyle(m.rating)}`}>
                            ${m.rating}
                          </span>
                        `}
                      </div>
                    </div>
                  `)}
                </div>
              `}
            </div>
          `}
        </div>

        <!-- Modal Footer -->
        <div className="p-4 bg-gray-50 dark:bg-slate-950/80 border-t border-gray-100 dark:border-slate-800 rounded-b-3xl flex justify-between items-center text-xs text-gray-400">
          <span>TDV BTL Football Cup • Sofascore Rating System</span>
          <button 
            onClick=${onClose}
            className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white font-bold rounded-xl transition shadow-xs"
          >
            ${lang === 'az' ? 'Bağla' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  `;
}
