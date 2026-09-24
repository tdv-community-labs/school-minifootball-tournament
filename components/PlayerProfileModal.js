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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 animate-fadeIn"
      style=${{
        WebkitOverflowScrolling: 'touch',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
      }}
      onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200 dark:border-zinc-800 relative flex flex-col transition-colors duration-200">
        
        <!-- Modal Top Header Banner -->
        <div className="relative bg-zinc-900 dark:bg-zinc-950 text-white p-4 sm:p-6 rounded-t-3xl border-b border-zinc-800 overflow-hidden">
          <div className="absolute right-0 top-0 -mr-10 -mt-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-start justify-between relative z-10 gap-2">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              <!-- Jersey / Avatar Badge -->
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl sm:text-2xl shadow-xs text-emerald-400 font-black shrink-0">
                ${profile?.isKeeper ? '🧤' : '🏃'}
              </div>
              
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    ${profile ? profile.primaryClass : '—'} ${lang === 'az' ? 'Sinfi' : ''}
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-300 font-semibold truncate">
                    ${(profile?.positions || []).join(' • ') || (profile?.isKeeper ? (lang === 'az' ? 'Qapıçı' : 'Goalkeeper') : (lang === 'az' ? 'Hücumçu' : 'Player'))}
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-black mt-1 text-white tracking-tight truncate">
                  ${profile ? profile.name : playerName}
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 font-medium truncate">
                  ${lang === 'az' ? 'Məktəb Mini-Futbol Karyera Profili' : 'School Mini-Football Career Profile'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <!-- Career Rating Badge -->
              ${profile && html`
                <div className=${`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center font-black shadow-xs ${getSofascoreBadgeStyle(profile.careerRating)}`}>
                  <span className="text-sm sm:text-lg leading-none">${profile.careerRating}</span>
                  <span className="text-[7px] sm:text-[8px] font-medium opacity-80 mt-0.5">Sofascore</span>
                </div>
              `}

              <!-- Close button -->
              <button 
                onClick=${onClose}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0 cursor-pointer"
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
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600"></div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">${lang === 'az' ? 'Karyera məlumatları toplanır...' : 'Loading career stats...'}</p>
            </div>
          ` : !profile ? html`
            <div className="py-12 text-center text-zinc-400">
              <p className="text-sm font-semibold">${lang === 'az' ? 'Oyunçu məlumatı tapılmadı.' : 'Player profile not found.'}</p>
            </div>
          ` : html`
            
            <!-- Stat Highlights Grid (4 cards) -->
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 p-4 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  ⚽ ${lang === 'az' ? 'Karyera Qolları' : 'Career Goals'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1 block">
                  ${profile.totalGoals}
                </span>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 p-4 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 block">
                  👟 ${lang === 'az' ? 'Asistlər' : 'Assists'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1 block">
                  ${profile.totalAssists}
                </span>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 p-4 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400 block">
                  🏟️ ${lang === 'az' ? 'Matç Sayı' : 'Matches'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1 block">
                  ${profile.totalMatches}
                </span>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 p-4 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  📈 ${lang === 'az' ? 'Qol/Oyun' : 'Goal Ratio'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mt-1 block">
                  ${profile.goalRatio}
                </span>
              </div>
            </div>

            <!-- Season Breakdown Table -->
            <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 p-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white mb-3 flex items-center gap-1.5">
                <i className="fas fa-history text-emerald-500"></i>
                <span>${lang === 'az' ? 'Mövsümlər Üzrə Çıxış Tarixçəsi' : 'Season-by-Season Performance'}</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-zinc-500 dark:text-zinc-400 font-bold border-b border-zinc-200 dark:border-zinc-700/60 pb-2">
                      <th className="py-2 px-3">${lang === 'az' ? 'Mövsüm' : 'Season'}</th>
                      <th className="py-2 px-3">${lang === 'az' ? 'Sinif' : 'Class'}</th>
                      <th className="py-2 px-3 text-center">${lang === 'az' ? 'Oyun' : 'Pld'}</th>
                      <th className="py-2 px-3 text-center">${lang === 'az' ? 'Qol' : 'Goals'}</th>
                      <th className="py-2 px-3 text-center">${lang === 'az' ? 'Asist' : 'Assists'}</th>
                      <th className="py-2 px-3 text-center">Sofascore</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-700/60">
                    ${profile.seasons.map(s => html`
                      <tr key=${s.id || s.year} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-700/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">${s.year}</td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-300">${s.class} Sinfi</td>
                        <td className="py-2.5 px-3 text-center font-bold text-zinc-600 dark:text-zinc-400">${s.matchesPlayed}</td>
                        <td className="py-2.5 px-3 text-center font-black text-emerald-600 dark:text-emerald-400">⚽ ${s.goals}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-zinc-900 dark:text-zinc-200">👟 ${s.assists}</td>
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
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
                <i className="fas fa-futbol text-emerald-500"></i>
                <span>${lang === 'az' ? 'Qol Vurduğu və Fərqləndiyi Matçlar' : 'Match Scoring & Appearance Log'}</span>
                <span className="text-[10px] text-zinc-400">(${profile.matches.length} ${lang === 'az' ? 'matç' : 'matches'})</span>
              </h4>

              ${profile.matches.length === 0 ? html`
                <p className="text-xs text-zinc-400 py-3 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  ${lang === 'az' ? 'Matç qolu qeydə alınmayıb.' : 'No detailed match goals logged.'}
                </p>
              ` : html`
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  ${profile.matches.map(m => html`
                    <div key=${m.id} className="bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 p-3 rounded-xl flex items-center justify-between shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-600 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded uppercase">
                            ${m.stage}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-semibold">${m.year}</span>
                          ${m.videoUrl && html`
                            <span className="text-red-500 text-[10px]" title="Video İcmal"><i className="fab fa-youtube"></i></span>
                          `}
                        </div>
                        <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 mt-1">
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
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 rounded-b-3xl flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
          <span>TDV BTL Football Cup • Sofascore Rating System</span>
          <button 
            onClick=${onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            ${lang === 'az' ? 'Bağla' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  `;
}
