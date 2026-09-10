/**
 * ============================================================================
 * FAYL ADI: components/GlobalSearchModal.js
 * MƏQSƏDİ: Turnir Üzrə Universal Çox-Obyektli Qlobal Axtarış Pəncərəsi
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Real-vaxt axtarış: İstifadəçi yazdıqca dərhal nəticələri filtrləyir.
 *   2. 3 istiqamətdə eyni vaxtda axtarış:
 *      - Oyunçular (adı, sinfi, illəri, qol sayı, reytinqi)
 *      - Siniflər / Komandalar (kateqoriyası, oynadığı illər)
 *      - Matçlar (komandalar, hesablar, mərhələlər)
 *   3. Klaviatura qısayolu (Ctrl+K / Cmd+K) ilə dərhal açılma.
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { db, getSofascoreBadgeStyle } from '../services/database.js';
import { t as fallbackT } from '../services/i18n.js';

const html = htm.bind(React.createElement);

export default function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectPlayer,
  onSelectClass,
  onSelectMatch,
  lang = 'en',
  t = (k) => fallbackT(k, lang)
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ players: [], classes: [], matches: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    } else {
      setQuery('');
      setResults({ players: [], classes: [], matches: [] });
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({ players: [], classes: [], matches: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      db.searchAll(query).then(res => {
        setResults(res || { players: [], classes: [], matches: [] });
        setLoading(false);
      }).catch(err => {
        console.error("Global search error:", err);
        setLoading(false);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.players.length + results.classes.length + results.matches.length;
  const popularQueries = ['Taleh', 'Ağamir', '11A', '10A', 'Final', '11F', '6A'];

  return html`
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-purple-950/70 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20 animate-fadeIn"
      onClick=${(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-purple-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        
        <!-- Search Input Header -->
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 bg-gray-50/70 dark:bg-slate-950/50">
          <i className="fas fa-search text-lg text-purple-900 dark:text-purple-400 shrink-0"></i>
          
          <input
            ref=${inputRef}
            type="text"
            value=${query}
            onInput=${(e) => setQuery(e.target.value)}
            placeholder=${lang === 'az' ? 'Oyunçu, sinif və ya matç axtarın... (Məs: Taleh, 11A)' : 'Search players, classes, or matches... (e.g. Taleh, 11A)'}
            className="flex-1 bg-transparent text-sm sm:text-base font-bold text-purple-950 dark:text-white placeholder-gray-400 focus:outline-none"
          />

          ${loading && html`
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent shrink-0"></div>
          `}

          ${query && html`
            <button
              onClick=${() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              title="Təmizlə"
            >
              <i className="fas fa-times-circle text-sm"></i>
            </button>
          `}

          <span className="hidden sm:inline text-[10px] font-black uppercase text-gray-400 bg-gray-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            ESC
          </span>
        </div>

        <!-- Search Results / Body -->
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-6">
          
          <!-- Empty Query: Quick suggestions -->
          ${(!query || query.trim().length < 2) && html`
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-purple-900 dark:text-purple-300 flex items-center justify-center mx-auto text-xl">
                <i className="fas fa-bolt"></i>
              </div>
              <div>
                <h4 className="text-sm font-black text-purple-950 dark:text-slate-200">
                  ${lang === 'az' ? 'Bütün Çempionat Arxivində Sürətli Axtarış' : 'Search Across All Championship Archives'}
                </h4>
                <p className="text-xs text-gray-400 mt-1">
                  ${lang === 'az' ? 'Oyunçuların adlarını, sinifləri və ya mərhələləri axtarın' : 'Search by player names, classes, or tournament stages'}
                </p>
              </div>

              <!-- Popular tags -->
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">${lang === 'az' ? 'Məşhur:' : 'Popular:'}</span>
                ${popularQueries.map(tag => html`
                  <button
                    key=${tag}
                    onClick=${() => setQuery(tag)}
                    className="bg-purple-50 dark:bg-slate-800 hover:bg-purple-100 text-purple-950 dark:text-purple-200 text-xs font-extrabold px-3 py-1 rounded-xl transition border border-purple-100/70 dark:border-slate-700"
                  >
                    ${tag}
                  </button>
                `)}
              </div>
            </div>
          `}

          <!-- Query with No Results -->
          ${query && query.trim().length >= 2 && !loading && totalResults === 0 && html`
            <div className="py-12 text-center text-gray-400 space-y-2">
              <i className="fas fa-search-minus text-3xl opacity-40"></i>
              <p className="text-sm font-bold text-purple-950 dark:text-slate-300">
                "${query}" ${lang === 'az' ? 'üzrə nəticə tapılmadı.' : 'not found.'}
              </p>
              <p className="text-xs text-gray-400">
                ${lang === 'az' ? 'Zəhmət olmasa başqa oyunçu adı və ya sinif daxil edin.' : 'Please try a different player name or class.'}
              </p>
            </div>
          `}

          <!-- Section 1: PLAYERS -->
          ${results.players.length > 0 && html`
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                  <i className="fas fa-running text-green-500"></i>
                  <span>${lang === 'az' ? 'Oyunçular' : 'Players'}</span>
                </span>
                <span className="text-[10px] text-gray-400 font-bold">${results.players.length} ${lang === 'az' ? 'nəticə' : 'results'}</span>
              </div>

              <div className="space-y-2">
                ${results.players.map(p => html`
                  <div
                    key=${p.normalizedName}
                    onClick=${() => {
                      onClose();
                      if (onSelectPlayer) onSelectPlayer(p.name);
                    }}
                    className="group bg-white dark:bg-slate-800/80 hover:bg-purple-50/50 dark:hover:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 flex items-center justify-center font-black text-sm shrink-0">
                        ${p.isKeeper ? '🧤' : '🏃'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="font-extrabold text-sm text-purple-950 dark:text-white truncate group-hover:text-purple-900 transition">
                            ${p.name}
                          </h5>
                          <span className="text-[9px] font-black uppercase text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.2 rounded">
                            ${p.classes.join(', ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                          ${p.years.join(' • ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      ${p.totalGoals > 0 && html`
                        <span className="goal-badge px-2 py-0.5 rounded-lg text-xs font-black">
                          ⚽ ${p.totalGoals}
                        </span>
                      `}
                      <span className=${`text-xs font-black px-2 py-0.5 rounded-md ${getSofascoreBadgeStyle(p.overallRating)}`}>
                        ${p.overallRating}
                      </span>
                      <i className="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-purple-600 transition pl-1"></i>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `}

          <!-- Section 2: CLASSES / TEAMS -->
          ${results.classes.length > 0 && html`
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                  <i className="fas fa-shield-alt text-sky-500"></i>
                  <span>${lang === 'az' ? 'Siniflər və Komandalar' : 'Classes & Teams'}</span>
                </span>
                <span className="text-[10px] text-gray-400 font-bold">${results.classes.length} ${lang === 'az' ? 'nəticə' : 'results'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${results.classes.map(c => html`
                  <div
                    key=${c.name}
                    onClick=${() => {
                      onClose();
                      if (onSelectClass) onSelectClass(c.name, c.years[0], c.division);
                    }}
                    className="group bg-white dark:bg-slate-800/80 hover:bg-sky-50/40 dark:hover:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 transition cursor-pointer flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 flex items-center justify-center font-black text-xs">
                        🛡️
                      </div>
                      <div>
                        <h5 className="font-extrabold text-xs text-purple-950 dark:text-white group-hover:text-sky-700 transition">
                          ${c.name} Sinfi
                        </h5>
                        <p className="text-[10px] text-gray-400">
                          ${c.years.join(', ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md">
                      ${lang === 'az' ? 'Cədvələ Bax' : 'View'} →
                    </span>
                  </div>
                `)}
              </div>
            </div>
          `}

          <!-- Section 3: MATCHES -->
          ${results.matches.length > 0 && html`
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                  <i className="fas fa-futbol text-emerald-500"></i>
                  <span>${lang === 'az' ? 'Matçlar' : 'Matches'}</span>
                </span>
                <span className="text-[10px] text-gray-400 font-bold">${results.matches.length} ${lang === 'az' ? 'nəticə' : 'results'}</span>
              </div>

              <div className="space-y-2">
                ${results.matches.map(m => html`
                  <div
                    key=${m.id}
                    onClick=${() => {
                      onClose();
                      if (onSelectMatch) onSelectMatch(m);
                    }}
                    className="group bg-white dark:bg-slate-800/80 hover:bg-emerald-50/40 dark:hover:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700 transition cursor-pointer flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-1.5 py-0.2 rounded">
                          ${m.stage}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold">${m.year}</span>
                        ${m.videoUrl && html`
                          <span className="text-red-500 text-[10px]"><i className="fab fa-youtube"></i></span>
                        `}
                      </div>
                      <p className="text-xs font-black text-purple-950 dark:text-white mt-1 group-hover:text-emerald-700 transition">
                        ${m.teamA} ${m.scoreA} - ${m.scoreB} ${m.teamB}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-purple-900 transition">
                        ${lang === 'az' ? 'Detallar' : 'Details'} →
                      </span>
                    </div>
                  </div>
                `)}
              </div>
            </div>
          `}

        </div>

        <!-- Search Modal Footer -->
        <div className="p-3 bg-gray-50 dark:bg-slate-950/80 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-gray-400 px-5">
          <span className="flex items-center gap-2">
            <span><i className="fas fa-keyboard mr-1"></i> <b>ESC</b> ${lang === 'az' ? 'bağlayır' : 'closes'}</span>
            <span>•</span>
            <span><b>Ctrl+K</b> ${lang === 'az' ? 'açar' : 'opens'}</span>
          </span>
          <span className="text-purple-900 dark:text-purple-400 font-bold">TDV BTL Mini-Football</span>
        </div>

      </div>
    </div>
  `;
}
