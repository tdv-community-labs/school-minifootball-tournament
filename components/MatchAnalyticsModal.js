/**
 * ============================================================================
 * FAYL ADI: components/MatchAnalyticsModal.js
 * MƏQSƏDİ: Sofascore Standartlarında Tam Matç Mərkəzi və Mobil Səhifə Rejimi
 * 
 * VƏZİFƏLƏRİ:
 *   1. Mobil İnterfeys üçün Nativ Səhifə Rejimi (Webkit-safe, No Flex Collapse).
 *   2. Stadion Üzərində Birləşdirilmiş 3D Qapı POV-u (Goalmouth POV directly on pitch).
 *   3. Meydançadan Qapıya Dinamik Lazer Trayektoriyası (Animated Laser Trajectory).
 *   4. İnteraktiv Zərbə Naviqatoru və Sürətli Filtrlər (Hamısı, Qollar, Seyvlər, Komandalar).
 *   5. 5v5 Minifutbol Taktiki Düzülüşü və Fərdi Sofascore Reytinqləri.
 *   6. İstilik Xəritəsi (Heatmap), Komanda Müqayisə Barları və Video İcmal.
 * ============================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import { getMatchAnalytics } from '../services/matchAnalyticsData.js?v=20260912_0120';
import { getSofascoreBadgeStyle } from '../services/database.js?v=20260912_0120';

const html = htm.bind(React.createElement);

export default function MatchAnalyticsModal({ match, isOpen, onClose, allPlayers = [], lang = 'az' }) {
  const analytics = useMemo(() => (match ? getMatchAnalytics(match, allPlayers) : null), [match, allPlayers]);
  const [activeTab, setActiveTab] = useState('shotmap'); // 'shotmap' | 'lineup' | 'heatmap' | 'stats' | 'video'
  const [selectedShotIndex, setSelectedShotIndex] = useState(0);
  const [shotFilter, setShotFilter] = useState('all'); // 'all' | 'goal' | 'saved' | 'teamA' | 'teamB'
  const [heatmapFilter, setHeatmapFilter] = useState('all'); // 'all' | 'teamA' | 'teamB' | 'player'
  const [selectedHeatmapPlayer, setSelectedHeatmapPlayer] = useState('Murad Abdullayev');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const allShots = analytics?.shots || [];

  // Filtrlənmiş zərbələr
  const filteredShots = useMemo(() => {
    if (!match) return [];
    if (shotFilter === 'goal') return allShots.filter(s => s.outcome === 'goal');
    if (shotFilter === 'saved') return allShots.filter(s => s.outcome === 'saved');
    if (shotFilter === 'teamA') return allShots.filter(s => s.team === match.teamA);
    if (shotFilter === 'teamB') return allShots.filter(s => s.team === match.teamB);
    return allShots;
  }, [allShots, shotFilter, match?.teamA, match?.teamB]);

  const handlePrevShot = () => {
    if (filteredShots.length === 0) return;
    setSelectedShotIndex(prev => (prev > 0 ? prev - 1 : filteredShots.length - 1));
  };

  const handleNextShot = () => {
    if (filteredShots.length === 0) return;
    setSelectedShotIndex(prev => (prev < filteredShots.length - 1 ? prev + 1 : 0));
  };

  // Mobil brauzer geri düyməsi və URL hash idarəetməsi
  useEffect(() => {
    if (!isOpen || !match) return;

    const matchHash = `#match/${match.id || 'current'}`;
    if (window.location.hash !== matchHash) {
      window.history.pushState({ matchView: true, matchId: match.id }, '', matchHash);
    }

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevShot();
      if (e.key === 'ArrowRight') handleNextShot();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    // Body scroll lock
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (window.location.hash.startsWith('#match/')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
  }, [isOpen, match?.id]);

  if (!isOpen || !match) return null;

  // Cari seçilmiş zərbə
  const currentShot = filteredShots[selectedShotIndex] || filteredShots[0] || allShots[0] || null;
  const stats = analytics?.stats || {};

  const handleBack = () => {
    if (window.location.hash.startsWith('#match/')) {
      window.history.back();
    } else {
      onClose();
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && window.location.href) {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  // Nəticə rəngi və etiketi
  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'goal':
        return { text: 'Qol', bg: 'bg-emerald-600 text-white', ring: 'ring-emerald-400', icon: 'fa-futbol' };
      case 'saved':
        return { text: 'Seyv', bg: 'bg-sky-600 text-white', ring: 'ring-sky-400', icon: 'fa-hand-paper' };
      case 'blocked':
        return { text: 'Blok', bg: 'bg-slate-600 text-white', ring: 'ring-slate-400', icon: 'fa-shield-alt' };
      default:
        return { text: 'Meydandan Kənar', bg: 'bg-rose-600 text-white', ring: 'ring-rose-400', icon: 'fa-times' };
    }
  };

  const goalCount = allShots.filter(s => s.outcome === 'goal').length;
  const saveCount = allShots.filter(s => s.outcome === 'saved').length;
  const shotsACount = allShots.filter(s => s.team === match.teamA).length;
  const shotsBCount = allShots.filter(s => s.team === match.teamB).length;

  return html`
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-contain bg-[#090d16] text-slate-100"
      style=${{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: '#090d16'
      }}
      role="dialog"
      aria-modal="true"
    >
      <!-- INNER CONTENT EXPANDER (Prevents Safari flex collapse) -->
      <div className="min-h-full flex flex-col justify-between w-full">

        <!-- STICKY TOP APP BAR (Safe-area aware, high-contrast back button) -->
        <header 
          className="sticky top-0 z-50 bg-[#0d1527]/98 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xl"
          style=${{ paddingTop: 'max(10px, env(safe-area-inset-top, 10px))' }}
        >
          <!-- Sol: Yüksək Kontrastlı Geri Düyməsi -->
          <button
            onClick=${handleBack}
            className="flex items-center gap-2 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-400 hover:text-emerald-300 border border-emerald-500/50 px-3.5 sm:px-4 py-2 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
            title="Oyunlar siyahısına qayıt"
          >
            <i className="fas fa-arrow-left text-xs sm:text-sm"></i>
            <span>${lang === 'az' ? 'Geri' : 'Back'}</span>
          </button>

          <!-- Mərkəz: Matç Başlığı və Hesab -->
          <div className="text-center px-2 min-w-0 max-w-[200px] sm:max-w-md">
            <div className="text-xs sm:text-sm font-black text-white truncate flex items-center justify-center gap-1.5">
              <span className="text-red-400 font-extrabold">${match.teamA}</span>
              <span className="text-emerald-400 font-black">${match.scoreA} - ${match.scoreB}</span>
              <span className="text-sky-400 font-extrabold">${match.teamB}</span>
            </div>
            <div className="text-[10px] text-purple-300 font-extrabold uppercase tracking-wider truncate">
              ${match.stage || 'Matç'} • ${match.year || '2022-2023'}
            </div>
          </div>

          <!-- Sağ: Paylaş və Bağla Düymələri -->
          <div className="flex items-center gap-2">
            <button
              onClick=${handleCopyLink}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-xs font-bold transition border border-slate-800 flex items-center gap-1.5 cursor-pointer"
              title="Matç linkini kopyala"
            >
              <i className="fas fa-share-alt text-xs"></i>
              <span className="hidden sm:inline">${copyFeedback ? (lang === 'az' ? 'Kopyalandı!' : 'Copied!') : (lang === 'az' ? 'Paylaş' : 'Share')}</span>
            </button>
            <button
              onClick=${onClose}
              className="p-2 sm:p-2.5 rounded-2xl bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition border border-slate-800 cursor-pointer flex items-center justify-center w-9 h-9"
              title="Bağla"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        </header>

        <!-- SCOREBOARD HERO BANNER -->
        <section className="bg-gradient-to-b from-[#0d1527] via-purple-950/30 to-[#090d16] border-b border-purple-900/40 px-4 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                <i className="fas fa-chart-line text-[9px]"></i> Sofascore AI Match Center
              </span>
              <span className="text-[11px] text-slate-400 font-bold">
                ${match.date || 'Tarix'}
              </span>
            </div>

            <!-- Komandalar və Hesab Bloku -->
            <div className="w-full flex items-center justify-between gap-2 sm:gap-6 py-2">
              <!-- Team A -->
              <div className="flex-1 text-center sm:text-right">
                <div className="inline-flex flex-col items-center sm:items-end">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-red-600/20 border-2 border-red-500/60 text-red-400 flex items-center justify-center font-black text-lg sm:text-2xl shadow-lg mb-1">
                    ${match.teamA}
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-white truncate max-w-[120px] sm:max-w-[180px]">
                    ${match.teamA}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ev Sahibi</span>
                </div>
              </div>

              <!-- Score Center Box -->
              <div className="flex flex-col items-center px-2 shrink-0">
                <div className="bg-gradient-to-br from-purple-950 to-slate-900 border-2 border-emerald-500/80 text-white rounded-3xl px-5 sm:px-8 py-2 sm:py-3 font-black text-2xl sm:text-4xl shadow-2xl tracking-tight flex items-center gap-3">
                  <span className="text-white">${match.scoreA}</span>
                  <span className="text-emerald-400 font-mono text-xl sm:text-2xl">-</span>
                  <span className="text-white">${match.scoreB}</span>
                </div>
                ${(match.penaltyScoreA !== null && match.penaltyScoreA !== undefined && match.penaltyScoreA !== '') && html`
                  <span className="text-[10px] sm:text-xs text-emerald-400 font-extrabold mt-1">
                    pen. ${match.penaltyScoreA} - ${match.penaltyScoreB}
                  </span>
                `}
                <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                  <i className="fas fa-check-circle text-[9px]"></i> Tamamlandı • BTL Arena
                </span>
              </div>

              <!-- Team B -->
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex flex-col items-center sm:items-start">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-sky-600/20 border-2 border-sky-500/60 text-sky-400 flex items-center justify-center font-black text-lg sm:text-2xl shadow-lg mb-1">
                    ${match.teamB}
                  </div>
                  <h3 className="text-base sm:text-xl font-black text-white truncate max-w-[120px] sm:max-w-[180px]">
                    ${match.teamB}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Qonaq</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- STICKY HORIZONTAL TAB BAR (Swipeable) -->
        <nav 
          className="sticky top-[52px] sm:top-[60px] z-40 bg-[#0d1527]/98 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar"
          style=${{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="max-w-4xl mx-auto w-full flex gap-1.5 sm:gap-2">
            ${[
              { id: 'shotmap', label: 'Zərbələr & Qapı POV', icon: 'fa-bullseye' },
              { id: 'lineup', label: '5v5 Heyət (Düzülüş)', icon: 'fa-users' },
              { id: 'heatmap', label: 'İstilik Xəritəsi (Heatmap)', icon: 'fa-fire-flame-curved' },
              { id: 'stats', label: 'Komanda Göstəriciləri', icon: 'fa-chart-bar' },
              ...(match.videoUrl ? [{ id: 'video', label: 'Video Arxiv', icon: 'fa-video' }] : [])
            ].map(tab => html`
              <button
                key=${tab.id}
                onClick=${() => setActiveTab(tab.id)}
                className=${`py-2.5 sm:py-3 px-3 sm:px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-950/40 shadow-inner'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <i className=${`fas ${tab.icon} text-[11px]`}></i>
                <span>${tab.label}</span>
              </button>
            `)}
          </div>
        </nav>

        <!-- MAIN SCROLLABLE CONTENT BODY -->
        <main className="flex-1 p-3 sm:p-6 max-w-5xl mx-auto w-full space-y-6">

          <!-- ================================================================= -->
          <!-- TAB 1: ZƏRBƏLƏR & BİRLƏŞDİRİLMİŞ 3D QAPI POV STADİONU -->
          <!-- ================================================================= -->
          ${activeTab === 'shotmap' && html`
            <div className="space-y-4 sm:space-y-5">
              
              <!-- STADION BAŞLIĞI VƏ SÜRƏTLİ FİLTRLƏR -->
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <i className="fas fa-bullseye text-emerald-400"></i> Sofascore Stadion Zərbələri & Qapı POV
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Meydançadan vurulan zərbə və birbaşa qapı xəttindəki 3D Qapı Önü (POV) trayektoriyası
                  </p>
                </div>

                <!-- Filter Pills -->
                <div className="flex items-center gap-1.5 flex-wrap">
                  ${[
                    { id: 'all', label: `Hamısı (${allShots.length})`, color: 'bg-purple-900 text-white' },
                    { id: 'goal', label: `⚽ Qollar (${goalCount})`, color: 'bg-emerald-600 text-white' },
                    { id: 'saved', label: `🧤 Seyvlər (${saveCount})`, color: 'bg-sky-600 text-white' },
                    { id: 'teamA', label: `🔴 ${match.teamA} (${shotsACount})`, color: 'bg-red-700 text-white' },
                    { id: 'teamB', label: `🔵 ${match.teamB} (${shotsBCount})`, color: 'bg-sky-700 text-white' }
                  ].map(f => html`
                    <button
                      key=${f.id}
                      onClick=${() => { setShotFilter(f.id); setSelectedShotIndex(0); }}
                      className=${`px-2.5 py-1 rounded-xl text-[11px] font-black transition cursor-pointer ${
                        shotFilter === f.id
                          ? `${f.color} shadow-md ring-2 ring-emerald-400/50`
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ${f.label}
                    </button>
                  `)}
                </div>
              </div>

              <!-- ============================================================= -->
              <!-- VAHİD STADİON VƏ BİRLƏŞDİRİLMİŞ 3D QAPI POV-U -->
              <!-- ============================================================= -->
              <div className="bg-slate-950 border-2 border-emerald-600/60 rounded-3xl overflow-hidden shadow-2xl relative">
                
                <!-- Stadium Header Bar -->
                <div className="bg-slate-900/90 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>TDV BTL Minifutbol Stadionu</span>
                  </span>
                  <span className="text-emerald-400 font-extrabold truncate max-w-[160px] sm:max-w-none">
                    ${currentShot ? `${currentShot.player} (${currentShot.minute}')` : ''}
                  </span>
                </div>

                <!-- PITCH & INTEGRATED 3D GOAL CONTAINER (Touch pan-y safe) -->
                <div 
                  className="relative w-full h-[460px] sm:h-[520px] bg-[#0c2918] overflow-hidden select-none"
                  style=${{ touchAction: 'pan-y' }}
                >
                  
                  <!-- Ot zolaqları (Realistic Grass Stripes) -->
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style=${{
                      backgroundImage: 'repeating-linear-gradient(180deg, #103b22 0px, #103b22 36px, #0b2e1b 36px, #0b2e1b 72px)'
                    }}
                  ></div>

                  <!-- Stadium Spotlight Ambient Glow -->
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-44 bg-emerald-400/15 blur-3xl pointer-events-none"></div>

                  <!-- ========================================================= -->
                  <!-- 3D QAPININ ÖNÜ POV-U (STADİONUN QAPI XƏTTİ ÜZƏRİNDƏ) -->
                  <!-- ========================================================= -->
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 w-[260px] sm:w-[340px]">
                    
                    <!-- Qapı Etiketi -->
                    <div className="text-center mb-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-sm inline-flex items-center gap-1">
                        <i className="fas fa-eye text-[8px]"></i> Qapının Önü POV (Goalmouth Zone)
                      </span>
                    </div>

                    <!-- 3D Goalmouth Box Frame -->
                    <div className="relative w-full h-24 sm:h-28 rounded-t-lg bg-gradient-to-b from-black/85 via-slate-950/95 to-emerald-950/70 border-t-4 border-x-4 border-slate-100 shadow-2xl overflow-visible">
                      
                      <!-- 3D Metallic Crossbar (Üst Tir) -->
                      <div className="absolute -top-1.5 -left-1.5 -right-1.5 h-3 bg-gradient-to-r from-slate-300 via-white to-slate-300 rounded shadow-md border-b border-slate-400 flex items-center justify-center">
                        <span className="text-[8px] font-black text-slate-800 tracking-widest uppercase opacity-60">Crossbar</span>
                      </div>

                      <!-- 3D Left & Right Posts (Yan Dirəklər) -->
                      <div className="absolute -top-1.5 -left-1.5 w-3 bottom-0 bg-gradient-to-b from-white via-slate-200 to-slate-400 shadow-lg"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 bottom-0 bg-gradient-to-b from-white via-slate-200 to-slate-400 shadow-lg"></div>

                      <!-- 3D Perspective Net Grid (Torun Dərinliyi) -->
                      <div 
                        className="absolute inset-0 opacity-25 pointer-events-none"
                        style=${{
                          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)',
                          backgroundSize: '16px 14px'
                        }}
                      ></div>

                      <!-- Goal Zones Indicators (90-lar, künclər) -->
                      <div className="absolute top-1 left-1.5 text-[8px] text-emerald-400/70 font-mono font-bold">Sol 90</div>
                      <div className="absolute top-1 right-1.5 text-[8px] text-emerald-400/70 font-mono font-bold">Sağ 90</div>
                      <div className="absolute bottom-1 left-1.5 text-[8px] text-slate-400/70 font-mono font-bold">Aşağı Sol</div>
                      <div className="absolute bottom-1 right-1.5 text-[8px] text-slate-400/70 font-mono font-bold">Aşağı Sağ</div>

                      <!-- Goalkeeper Silhouette / Reach -->
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-12 opacity-25 pointer-events-none flex flex-col items-center justify-end">
                        <div className="w-4 h-4 rounded-full bg-sky-400 mb-0.5"></div>
                        <div className="w-10 h-7 bg-sky-400 rounded-t-xl"></div>
                      </div>

                      <!-- CURRENT SHOT TARGET MARKER IN 3D GOAL (Topun Dəqiq Getdiyi Nöqtə) -->
                      ${currentShot && html`
                        <div
                          style=${{
                            left: `${Math.max(4, Math.min(96, currentShot.goalX))}%`,
                            top: `${Math.max(6, Math.min(92, currentShot.goalY))}%`
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500 z-30 pointer-events-none"
                        >
                          <!-- Ping Glow -->
                          <span className=${`absolute -inset-2 rounded-full animate-ping opacity-75 ${
                            currentShot.outcome === 'goal' ? 'bg-emerald-400' : currentShot.outcome === 'saved' ? 'bg-sky-400' : 'bg-rose-400'
                          }`}></span>

                          <!-- Main Ball Marker -->
                          <div className=${`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm shadow-2xl border-2 border-white relative font-black ${
                            currentShot.outcome === 'goal'
                              ? 'bg-emerald-500 text-slate-950 shadow-emerald-400/90'
                              : currentShot.outcome === 'saved'
                              ? 'bg-sky-500 text-white shadow-sky-400/90'
                              : 'bg-rose-500 text-white shadow-rose-400/90'
                          }`}>
                            ${currentShot.outcome === 'goal' ? '⚽' : currentShot.outcome === 'saved' ? '🧤' : '❌'}
                          </div>

                          <!-- Target Goal Zone Label -->
                          <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-emerald-500/60 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-md shadow-lg">
                            ${currentShot.goalZone}
                          </div>
                        </div>
                      `}
                    </div>

                    <!-- Goal Line (Qapı Xətti - otun üzərində davam edir) -->
                    <div className="w-full h-1 bg-white/90 shadow-md"></div>
                  </div>

                  <!-- ========================================================= -->
                  <!-- PITCH MARKINGS (Cərimə Meydançası, Qapı Meydançası, Nöqtələr) -->
                  <!-- ========================================================= -->
                  
                  <!-- 6-yard Goal Area (Qapı Meydançası) -->
                  <div className="absolute top-32 sm:top-36 left-1/2 -translate-x-1/2 w-44 sm:w-56 h-12 border-b-2 border-x-2 border-white/60 bg-white/5 pointer-events-none"></div>

                  <!-- 18-yard Penalty Area (Cərimə Meydançası) -->
                  <div className="absolute top-32 sm:top-36 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-36 border-b-2 border-x-2 border-white/70 bg-white/5 pointer-events-none"></div>

                  <!-- Penalty Spot (Penalti Nöqtəsi) -->
                  <div className="absolute top-60 sm:top-64 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md pointer-events-none"></div>

                  <!-- Penalty Arc (Cərimə Meydançası Qövsü) -->
                  <div className="absolute top-68 sm:top-72 left-1/2 -translate-x-1/2 w-28 h-12 border-b-2 border-white/60 rounded-b-full pointer-events-none"></div>

                  <!-- Midfield Line (Orta Xətt) -->
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/70 pointer-events-none"></div>
                  
                  <!-- Center Circle Arc (Mərkəz Dairəsi Qövsü) -->
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-18 border-t-2 border-white/60 rounded-t-full pointer-events-none"></div>

                  <!-- ========================================================= -->
                  <!-- SVG DYNAMIC LASER TRAJECTORY (Meydançadan Qapıya Lazer Şüası) -->
                  <!-- ========================================================= -->
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <defs>
                      <linearGradient id="laserBeamGoal" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="laserBeamSaved" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                      </linearGradient>
                      <linearGradient id="laserBeamMissed" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#fb7185" stopOpacity="0.9" />
                      </linearGradient>
                    </defs>

                    ${currentShot && html`
                      <g>
                        <!-- Trajectory Beam Shadow / Glow -->
                        <line
                          x1=${`${currentShot.pitchX}%`}
                          y1=${`${currentShot.pitchY}%`}
                          x2="50%"
                          y2="20%"
                          stroke=${currentShot.outcome === 'goal' ? '#10b981' : currentShot.outcome === 'saved' ? '#38bdf8' : '#f43f5e'}
                          strokeWidth="6"
                          strokeOpacity="0.25"
                        />
                        <!-- Main Laser Beam -->
                        <line
                          x1=${`${currentShot.pitchX}%`}
                          y1=${`${currentShot.pitchY}%`}
                          x2="50%"
                          y2="20%"
                          stroke=${`url(#${currentShot.outcome === 'goal' ? 'laserBeamGoal' : currentShot.outcome === 'saved' ? 'laserBeamSaved' : 'laserBeamMissed'})`}
                          strokeWidth="3"
                          strokeDasharray="6 3"
                        />
                        <!-- Strike Origin Ping Circle -->
                        <circle
                          cx=${`${currentShot.pitchX}%`}
                          cy=${`${currentShot.pitchY}%`}
                          r="10"
                          fill="none"
                          stroke=${currentShot.outcome === 'goal' ? '#10b981' : '#38bdf8'}
                          strokeWidth="2"
                          opacity="0.8"
                        />
                      </g>
                    `}
                  </svg>

                  <!-- ========================================================= -->
                  <!-- ALL SHOTS PLOTTED ON PITCH (Meydançadakı Bütün Zərbələr) -->
                  <!-- ========================================================= -->
                  ${filteredShots.map((shot, idx) => {
                    const isSelected = currentShot?.id === shot.id;
                    const isGoal = shot.outcome === 'goal';
                    const isSaved = shot.outcome === 'saved';
                    const isBlocked = shot.outcome === 'blocked';

                    let dotBg = 'bg-rose-500 border-white text-white';
                    if (isGoal) dotBg = 'bg-emerald-500 border-white text-slate-950 font-black';
                    else if (isSaved) dotBg = 'bg-sky-500 border-white text-white';
                    else if (isBlocked) dotBg = 'bg-slate-400 border-white text-slate-900';

                    return html`
                      <div
                        key=${shot.id}
                        onClick=${() => setSelectedShotIndex(idx)}
                        style=${{ left: `${shot.pitchX}%`, top: `${shot.pitchY}%` }}
                        className=${`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 ${
                          isSelected 
                            ? 'scale-150 z-30 ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-950 animate-bounce' 
                            : 'hover:scale-130 opacity-85 hover:opacity-100'
                        }`}
                        title=${`${shot.player} (${shot.minute}') - ${shot.outcome.toUpperCase()} (xG: ${shot.xg})`}
                      >
                        <div className=${`w-6 h-6 rounded-full flex items-center justify-center border-2 text-[9px] shadow-xl ${dotBg}`}>
                          ${isGoal ? '⚽' : (idx + 1)}
                        </div>
                      </div>
                    `;
                  })}

                  <!-- Bottom Legend Badge -->
                  <div className="absolute bottom-2 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-slate-300 border border-slate-800">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Qol</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Seyv</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Blok</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Kənar</span>
                  </div>

                </div>
              </div>

              <!-- ============================================================= -->
              <!-- SOFASCORE SHOT NAVIGATOR & EPISODE BREAKDOWN CARD -->
              <!-- ============================================================= -->
              ${currentShot && html`
                <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
                  
                  <!-- Navigator Header: < Player Name Minute > -->
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <button
                      onClick=${handlePrevShot}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-black text-xs cursor-pointer active:scale-95 min-h-[44px]"
                      title="Əvvəlki Zərbə"
                    >
                      <i className="fas fa-chevron-left text-sm"></i>
                      <span className="hidden sm:inline">Əvvəlki</span>
                    </button>

                    <div className="flex items-center gap-2.5 sm:gap-3 text-center">
                      <div className=${`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black border-2 shadow-lg ${
                        currentShot.team === match.teamA ? 'bg-red-600/30 border-red-500 text-red-300' : 'bg-sky-600/30 border-sky-500 text-sky-300'
                      }`}>
                        ${currentShot.number || '⚽'}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 justify-center">
                          <span className="truncate max-w-[140px] sm:max-w-none">${currentShot.player}</span>
                          <span className=${`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            currentShot.team === match.teamA ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-sky-950 text-sky-400 border border-sky-800'
                          }`}>
                            ${currentShot.team}
                          </span>
                        </h4>
                        <div className="text-[11px] text-emerald-400 font-extrabold flex items-center justify-center gap-1.5 mt-0.5">
                          <i className="far fa-clock text-[10px]"></i>
                          <span>Dəqiqə: ${currentShot.minute}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 font-mono font-bold">${selectedShotIndex + 1} / ${filteredShots.length}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick=${handleNextShot}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition font-black text-xs cursor-pointer active:scale-95 min-h-[44px]"
                      title="Növbəti Zərbə"
                    >
                      <span className="hidden sm:inline">Növbəti</span>
                      <i className="fas fa-chevron-right text-sm"></i>
                    </button>
                  </div>

                  <!-- Deep Shot Metrics Grid -->
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                    
                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">xG (Gözlənilən Qol)</span>
                      <span className="text-lg font-black text-amber-400 font-mono">${currentShot.xg}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">xGOT (Dəqiqlik)</span>
                      <span className="text-lg font-black text-emerald-400 font-mono">${currentShot.xgot || '0.00'}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Zərbə Nəticəsi</span>
                      <span className=${`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md mt-0.5 ${getOutcomeBadge(currentShot.outcome).bg}`}>
                        <i className=${`fas ${getOutcomeBadge(currentShot.outcome).icon} text-[9px]`}></i>
                        ${getOutcomeBadge(currentShot.outcome).text}
                      </span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Qol Zonası</span>
                      <span className="text-xs font-black text-emerald-300 truncate block mt-0.5">${currentShot.goalZone}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Zərbə Növü</span>
                      <span className="text-xs font-black text-slate-200 block mt-0.5">${currentShot.shotType}</span>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Oyun Vəziyyəti</span>
                      <span className="text-xs font-black text-slate-200 block mt-0.5">${currentShot.situation}</span>
                    </div>

                    <div className="col-span-2 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Epizod Təsviri</span>
                      <span className="text-xs font-semibold text-slate-300 block mt-0.5" title=${currentShot.desc}>
                        ${currentShot.desc}
                      </span>
                    </div>

                  </div>

                </div>
              `}

            </div>
          `}

          <!-- ================================================================= -->
          <!-- TAB 2: 5V5 HEYƏT VƏ DÜZÜLÜŞ (LINEUP) -->
          <!-- ================================================================= -->
          ${activeTab === 'lineup' && html`
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Rəsmi 5v5 Minifutbol Standartı
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <i className="fas fa-users text-emerald-400"></i> 5v5 Minifutbol Taktiki Düzülüşü (1-2-1 Romb)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Meydançada hər komandadan 5 oyunçu (1 Qapıçı + 4 Sahə Oyunçusu) və ehtiyat skamyası</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-red-400 font-black"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> ${match.teamA}</span>
                  <span className="text-slate-500">vs</span>
                  <span className="flex items-center gap-1.5 text-sky-400 font-black"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> ${match.teamB}</span>
                </div>
              </div>

              <!-- Horizontal Full Pitch (Minifootball 40m x 20m) -->
              <div 
                className="w-full h-96 sm:h-[440px] bg-gradient-to-r from-[#0a2316] via-[#123823] to-[#0a2316] rounded-3xl border-2 border-emerald-500/60 relative overflow-hidden shadow-2xl p-4"
                style=${{ touchAction: 'pan-y' }}
              >
                <!-- Authentic Turf Mowing Stripes (Qazon Zolaqları) -->
                <div className="absolute inset-0 opacity-15 pointer-events-none" style=${{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 40px, transparent 40px, transparent 80px)'
                }}></div>

                <!-- Pitch Markings (5v5 Futsal / Minifootball Standard: 40m x 20m) -->
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-xs"></div>

                <!-- 6m Curved Penalty Arcs (D-Qövsü) -->
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 h-48 sm:h-56 border-r-2 border-y-2 border-white/50 rounded-r-full bg-white/5 pointer-events-none"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 h-48 sm:h-56 border-l-2 border-y-2 border-white/50 rounded-l-full bg-white/5 pointer-events-none"></div>

                <!-- 6m Penalty Kick Spots -->
                <div className="absolute top-1/2 left-[15%] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow pointer-events-none" title="6m Penalti Nöqtəsi"></div>
                <div className="absolute top-1/2 right-[15%] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow pointer-events-none" title="6m Penalti Nöqtəsi"></div>

                <!-- 3m x 2m Goal Nets -->
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-4 h-24 border-y-2 border-l-2 border-white/80 bg-white/10 rounded-l"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-4 h-24 border-y-2 border-r-2 border-white/80 bg-white/10 rounded-r"></div>

                <!-- Team A Lineup (Red - 5 Players in 1-2-1 Diamond) -->
                ${analytics.lineupA.map(p => html`
                  <div
                    key=${p.id}
                    onClick=${() => setSelectedPlayer(p)}
                    style=${{ left: `${p.x}%`, top: `${p.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-transform hover:scale-125 z-20"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-600 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white shadow-xl group-hover:ring-2 group-hover:ring-purple-400">
                        ${p.number}
                      </div>
                      <span className=${`absolute -bottom-1 -right-1 text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded-md shadow-md ${getSofascoreBadgeStyle(p.rating)}`}>
                        ${p.rating}
                      </span>
                      ${p.redCard && html`<span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded shadow" title="Qırmızı Vərəqə 17'">🟥</span>`}
                    </div>
                    <span className="text-[10px] sm:text-xs font-extrabold text-white mt-1 drop-shadow-md text-center max-w-[90px] truncate">
                      ${p.name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-red-200 opacity-90">${p.roleName || p.pos}</span>
                  </div>
                `)}

                <!-- Team B Lineup (Sky - 5 Players in 1-2-1 Diamond) -->
                ${analytics.lineupB.map(p => html`
                  <div
                    key=${p.id}
                    onClick=${() => setSelectedPlayer(p)}
                    style=${{ left: `${p.x}%`, top: `${p.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group transition-transform hover:scale-125 z-20"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-sky-600 text-white font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white shadow-xl group-hover:ring-2 group-hover:ring-purple-400">
                        ${p.number}
                      </div>
                      <span className=${`absolute -bottom-1 -right-1 text-[9px] sm:text-[10px] font-black px-1 sm:px-1.5 py-0.2 rounded-md shadow-md ${getSofascoreBadgeStyle(p.rating)}`}>
                        ${p.rating}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-extrabold text-white mt-1 drop-shadow-md text-center max-w-[90px] truncate">
                      ${p.name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-sky-200 opacity-90">${p.roleName || p.pos}</span>
                  </div>
                `)}

                <div className="absolute bottom-3 left-4 bg-black/75 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-slate-300 border border-slate-800">
                  Formasiya: 1-2-1 Romb (GK + 1 Fix + 2 Ala + 1 Pivot)
                </div>
              </div>

              <!-- Substitutes Bench (Ehtiyat Skamyası) -->
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Team A Bench -->
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                    <span className="font-black text-red-400 flex items-center gap-1.5">
                      <i className="fas fa-chair text-slate-500"></i> ${match.teamA} Ehtiyat Skamyası
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">${(analytics.benchA || []).length} Oyunçu</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    ${(analytics.benchA || []).length === 0 ? html`
                      <span className="text-xs text-slate-500 italic py-1">Ehtiyat oyunçu qeyd olunmayıb</span>
                    ` : analytics.benchA.map(sub => html`
                      <div key=${sub.id} className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
                        <span className="w-5 h-5 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 text-[10px] font-black flex items-center justify-center">
                          ${sub.number}
                        </span>
                        <span className="text-xs font-bold text-white">${sub.name}</span>
                        <span className=${`text-[9px] font-black px-1 py-0.2 rounded ${getSofascoreBadgeStyle(sub.rating)}`}>
                          ${sub.rating}
                        </span>
                      </div>
                    `)}
                  </div>
                </div>

                <!-- Team B Bench -->
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
                    <span className="font-black text-sky-400 flex items-center gap-1.5">
                      <i className="fas fa-chair text-slate-500"></i> ${match.teamB} Ehtiyat Skamyası
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">${(analytics.benchB || []).length} Oyunçu</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    ${(analytics.benchB || []).length === 0 ? html`
                      <span className="text-xs text-slate-500 italic py-1">Ehtiyat oyunçu qeyd olunmayıb</span>
                    ` : analytics.benchB.map(sub => html`
                      <div key=${sub.id} className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
                        <span className="w-5 h-5 rounded-full bg-sky-600/30 text-sky-300 border border-sky-500/40 text-[10px] font-black flex items-center justify-center">
                          ${sub.number}
                        </span>
                        <span className="text-xs font-bold text-white">${sub.name}</span>
                        <span className=${`text-[9px] font-black px-1 py-0.2 rounded ${getSofascoreBadgeStyle(sub.rating)}`}>
                          ${sub.rating}
                        </span>
                      </div>
                    `)}
                  </div>
                </div>
              </div>

              <!-- Player Detail Card when clicked -->
              ${selectedPlayer && html`
                <div className="bg-slate-900/95 border border-purple-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-900/80 text-white font-black text-lg flex items-center justify-center border border-purple-500 shadow-md">
                      ${selectedPlayer.number}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>${selectedPlayer.name}</span>
                        <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-bold">${selectedPlayer.roleName || selectedPlayer.pos}</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        ${selectedPlayer.goals ? `⚽ ${selectedPlayer.goals} Qol  ` : ''}
                        ${selectedPlayer.assists ? `👟 ${selectedPlayer.assists} Ötürmə  ` : ''}
                        ${selectedPlayer.saves ? `🧤 ${selectedPlayer.saves} Qapıçı Seyvi  ` : ''}
                        ${selectedPlayer.redCard ? `🟥 Qırmızı Vərəqə (${selectedPlayer.redCard})` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick=${() => {
                        setHeatmapFilter('player');
                        setSelectedHeatmapPlayer(selectedPlayer.name);
                        setActiveTab('heatmap');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95"
                    >
                      <i className="fas fa-fire-flame-curved text-amber-300"></i>
                      <span>İstilik Xəritəsində Bax</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-bold hidden sm:inline">Reytinq:</span>
                      <span className=${`text-sm font-black px-3 py-1 rounded-xl shadow-lg ${getSofascoreBadgeStyle(selectedPlayer.rating)}`}>
                        ${selectedPlayer.rating}
                      </span>
                    </div>
                  </div>
                </div>
              `}
            </div>
          `}

          <!-- ================================================================= -->
          <!-- TAB 3: İSTİLİK XƏRİTƏSİ (HEATMAP) -->
          <!-- ================================================================= -->
          ${activeTab === 'heatmap' && html`
            <div className="space-y-5">
              <!-- Top Header & Heatmap Filters -->
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    Termal Sensor • 40m × 20m 5v5 Arena
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <i className="fas fa-fire-flame-curved text-red-500"></i> Meydança İstilik Xəritəsi & Taktiki Zonalar
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Komandaların təzyiq sıxlığı, cinah hücumları və fərdi oyunçu hərəkət radiusu</p>
                </div>

                <!-- Filter Selector Tabs -->
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl flex-wrap">
                  <button
                    onClick=${() => setHeatmapFilter('all')}
                    className=${`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      heatmapFilter === 'all' ? 'bg-purple-900 text-white shadow-md shadow-purple-900/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Ümumi</span>
                  </button>
                  <button
                    onClick=${() => setHeatmapFilter('teamA')}
                    className=${`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      heatmapFilter === 'teamA' ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>${match.teamA}</span>
                  </button>
                  <button
                    onClick=${() => setHeatmapFilter('teamB')}
                    className=${`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      heatmapFilter === 'teamB' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>${match.teamB}</span>
                  </button>
                  <button
                    onClick=${() => setHeatmapFilter('player')}
                    className=${`px-3 py-1.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                      heatmapFilter === 'player' ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className="fas fa-user text-[11px]"></i>
                    <span>Oyunçu</span>
                  </button>
                </div>
              </div>

              <!-- Individual Player Selector (When 'player' filter is active) -->
              ${heatmapFilter === 'player' && html`
                <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <i className="fas fa-hand-pointer text-amber-400"></i> Fərdi Taktiki İstilik Xəritəsi Üçün Oyunçu Seçin:
                    </span>
                    <span className="text-[10px] text-purple-400 font-bold">5v5 Heyətlər</span>
                  </div>

                  <!-- Player Chips: Team A & Team B starting 5 -->
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    ${[...analytics.lineupA, ...analytics.lineupB].map(p => {
                      const isA = analytics.lineupA.some(a => a.id === p.id);
                      const isSelected = selectedHeatmapPlayer === p.name;
                      return html`
                        <button
                          key=${p.id}
                          onClick=${() => setSelectedHeatmapPlayer(p.name)}
                          className=${`px-2.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md scale-105 ring-2 ring-purple-400/40'
                              : isA
                              ? 'bg-red-950/40 text-red-200 border-red-800/60 hover:bg-red-900/40'
                              : 'bg-sky-950/40 text-sky-200 border-sky-800/60 hover:bg-sky-900/40'
                          }`}
                        >
                          <span className=${`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                            isA ? 'bg-red-500 text-white' : 'bg-sky-500 text-white'
                          }`}>
                            ${p.number}
                          </span>
                          <span className="truncate max-w-[110px] sm:max-w-none">${p.name}</span>
                          <span className="text-[9px] opacity-75 font-normal">(${p.pos})</span>
                        </button>
                      `;
                    })}
                  </div>

                  <!-- Selected Player Performance & Movement Metrics -->
                  ${(() => {
                    const heatData = analytics.heatmapData?.playerHeatmaps?.[selectedHeatmapPlayer];
                    if (!heatData) return null;
                    return html`
                      <div className="mt-2 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Taktiki Mövqe</span>
                          <span className="text-xs font-black text-amber-300 mt-0.5 block truncate">${heatData.role}</span>
                        </div>
                        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Topla Təmas</span>
                          <span className="text-xs font-black text-emerald-400 mt-0.5 block">${heatData.touches} Təmas</span>
                        </div>
                        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Döyüşlərdə Qələbə</span>
                          <span className="text-xs font-black text-sky-300 mt-0.5 block">${heatData.duelsWon}</span>
                        </div>
                        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Maks. Sürət</span>
                          <span className="text-xs font-black text-purple-300 mt-0.5 block">${heatData.maxSpeed}</span>
                        </div>
                      </div>
                    `;
                  })()}
                </div>
              `}

              <!-- Authentic 5v5 Minifootball Pitch (40m x 20m) with HD Thermal Heatmap -->
              <div 
                className="w-full h-84 sm:h-[420px] bg-gradient-to-r from-[#071d12] via-[#0d2a1b] to-[#071d12] rounded-3xl border-2 border-emerald-500/60 relative overflow-hidden shadow-2xl flex items-center justify-center p-4"
                style=${{ touchAction: 'pan-y' }}
              >
                <!-- Alternating Mower Turf Stripes -->
                <div className="absolute inset-0 opacity-15 pointer-events-none" style=${{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 40px, transparent 40px, transparent 80px)'
                }}></div>

                <!-- Standard 5v5 Pitch Markings -->
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/50"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-xs"></div>

                <!-- 6m Curved D-Box Penalty Areas -->
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 h-48 sm:h-56 border-r-2 border-y-2 border-white/50 rounded-r-full bg-white/5 pointer-events-none"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 sm:w-36 h-48 sm:h-56 border-l-2 border-y-2 border-white/50 rounded-l-full bg-white/5 pointer-events-none"></div>

                <!-- 6m & 10m Penalty Spots -->
                <div className="absolute top-1/2 left-[15%] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 pointer-events-none"></div>
                <div className="absolute top-1/2 right-[15%] -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/80 pointer-events-none"></div>

                <!-- DYNAMIC MULTI-TIER THERMAL HEATMAP LAYERS -->
                ${(() => {
                  let points = [];
                  if (heatmapFilter === 'all') {
                    points = [
                      ...(analytics.heatmapData?.teamA || []).map(p => ({ ...p, color: 'red' })),
                      ...(analytics.heatmapData?.teamB || []).map(p => ({ ...p, color: 'blue' }))
                    ];
                  } else if (heatmapFilter === 'teamA') {
                    points = (analytics.heatmapData?.teamA || []).map(p => ({ ...p, color: 'red' }));
                  } else if (heatmapFilter === 'teamB') {
                    points = (analytics.heatmapData?.teamB || []).map(p => ({ ...p, color: 'blue' }));
                  } else if (heatmapFilter === 'player') {
                    const pHeat = analytics.heatmapData?.playerHeatmaps?.[selectedHeatmapPlayer];
                    points = (pHeat?.points || []).map(p => ({ ...p, color: pHeat.team === match.teamA ? 'red' : 'blue' }));
                  }

                  return html`
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      ${points.map((pt, i) => {
                        const isRed = pt.color === 'red';
                        const size = pt.radius * 2;
                        return html`
                          <div
                            key=${`heat_${i}`}
                            style=${{
                              left: `${pt.x}%`,
                              top: `${pt.y}%`,
                              width: `${size}px`,
                              height: `${size}px`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            className="absolute rounded-full"
                          >
                            <!-- Core Hot Spot -->
                            <div className=${`w-full h-full rounded-full blur-2xl opacity-80 ${
                              isRed 
                                ? 'bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-300' 
                                : 'bg-gradient-to-tr from-blue-600 via-cyan-400 to-emerald-300'
                            }`}></div>
                            <!-- Concentrated Pulse Center -->
                            <div className=${`absolute inset-1/4 rounded-full blur-xl opacity-90 animate-pulse ${
                              isRed ? 'bg-red-500' : 'bg-cyan-400'
                            }`}></div>
                          </div>
                        `;
                      })}
                    </div>
                  `;
                })()}

                <!-- Player Active Territory Center Tag (In Player Mode) -->
                ${heatmapFilter === 'player' && html`
                  <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md border border-purple-500/50 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs font-black text-white">${selectedHeatmapPlayer}</span>
                    <span className="text-[10px] text-purple-300 font-bold">
                      ${analytics.heatmapData?.playerHeatmaps?.[selectedHeatmapPlayer]?.dominantZone || 'Meydança Mərkəzi'}
                    </span>
                  </div>
                `}

                <div className="absolute bottom-3 right-4 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-300 border border-slate-800 shadow-md">
                  Minifutbol Meydançası (40m × 20m) • 5v5
                </div>

                <!-- Heat Intensity Color Legend -->
                <div className="absolute bottom-3 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-md flex items-center gap-2 text-[10px] font-bold text-slate-300">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">İntensivlik:</span>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Zəif"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" title="Orta"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Yüksək"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" title="Maksimal Təzyiq"></span>
                  </div>
                </div>
              </div>

              <!-- TACTICAL ATTACK CHANNELS & THIRD TERRITORY BARS -->
              ${(() => {
                const zones = analytics.heatmapData?.tacticalZones || {
                  flanksA: { left: 34, center: 48, right: 18 },
                  flanksB: { left: 45, center: 36, right: 19 },
                  thirdsA: { def: 20, mid: 42, att: 38 },
                  thirdsB: { def: 42, mid: 36, att: 22 }
                };

                return html`
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Flank Attack Distribution -->
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                          <i className="fas fa-arrows-split-up-and-left text-emerald-400"></i> Cinah Hücum Kanalları (Flanks)
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">${match.teamA} vs ${match.teamB}</span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <!-- Left Flank -->
                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.flanksA.left}%</span>
                            <span className="text-slate-300">Sol Cinah (Left Channel)</span>
                            <span className="text-sky-400 font-black">${zones.flanksB.left}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.flanksA.left}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.flanksB.left}%` }}></div>
                          </div>
                        </div>

                        <!-- Center -->
                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.flanksA.center}%</span>
                            <span className="text-slate-300 font-black text-amber-300">Mərkəz / Göbək (Center)</span>
                            <span className="text-sky-400 font-black">${zones.flanksB.center}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.flanksA.center}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.flanksB.center}%` }}></div>
                          </div>
                        </div>

                        <!-- Right Flank -->
                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.flanksA.right}%</span>
                            <span className="text-slate-300">Sağ Cinah (Right Channel)</span>
                            <span className="text-sky-400 font-black">${zones.flanksB.right}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.flanksA.right}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.flanksB.right}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Pitch Thirds Control -->
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                          <i className="fas fa-layer-group text-sky-400"></i> Meydança Zonaları Nəzarəti (Thirds)
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">Sahə Təzyiqi</span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.thirdsA.def}%</span>
                            <span className="text-slate-300">Müdafiə Zonası (Defensive 3rd)</span>
                            <span className="text-sky-400 font-black">${zones.thirdsB.def}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.thirdsA.def}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.thirdsB.def}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.thirdsA.mid}%</span>
                            <span className="text-slate-300">Mərkəz Keçid (Middle 3rd)</span>
                            <span className="text-sky-400 font-black">${zones.thirdsB.mid}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.thirdsA.mid}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.thirdsB.mid}%` }}></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center font-bold mb-1 text-[11px]">
                            <span className="text-red-400 font-black">${zones.thirdsA.att}%</span>
                            <span className="text-slate-300">Hücum & Qapı Önü (Attacking 3rd)</span>
                            <span className="text-sky-400 font-black">${zones.thirdsB.att}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                            <div className="bg-red-500 h-full" style=${{ width: `${zones.thirdsA.att}%` }}></div>
                            <div className="bg-sky-500 h-full" style=${{ width: `${zones.thirdsB.att}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              })()}

              <!-- 5v5 Minifootball Tactical Guide Banner -->
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/50 flex items-start gap-3 text-xs text-purple-200">
                <i className="fas fa-info-circle text-purple-400 text-base shrink-0 mt-0.5"></i>
                <div className="space-y-1">
                  <span className="font-black uppercase tracking-wider text-purple-300 block">
                    5v5 Minifutbol Taktiki İcmalı:
                  </span>
                  <p className="leading-relaxed font-medium">
                    TDV BTL turnirində oyunlar rəsmi 40m × 20m meydançada 5v5 formatında keçirilir. Komandalar 1-2-1 Romb (Futsal) sistemi ilə oynayaraq yüksək temp, sürətli cinah hücumları və cərimə qövsü önündə sıx presinq tətbiq edirlər. Yuxarıdakı istilik xəritəsi zərbə və topla təmas koordinatlarının dəqiq termal paylanmasını əks etdirir.
                  </p>
                </div>
              </div>
            </div>
          `}

          <!-- ================================================================= -->
          <!-- TAB 4: KOMANDA GÖSTƏRİCİLƏRİ (STATS) -->
          <!-- ================================================================= -->
          ${activeTab === 'stats' && html`
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="font-black text-sm text-red-400">${match.teamA}</span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 text-center">
                  Rəsmi Matç Müqayisəsi (Sofascore 5v5)
                </h4>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-sky-400">${match.teamB}</span>
                  <div className="w-4 h-4 rounded-full bg-sky-500"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 text-xs">
                ${[
                  { label: 'Expected Goals (xG)', a: stats.xgA || 0, b: stats.xgB || 0 },
                  { label: 'Expected On Target (xGOT)', a: stats.xgotA || 0, b: stats.xgotB || 0 },
                  { label: 'Ümumi Zərbələr', a: stats.totalShotsA || 0, b: stats.totalShotsB || 0 },
                  { label: 'Qapıya Dəqiq Zərbələr', a: stats.shotsOnTargetA || 0, b: stats.shotsOnTargetB || 0 },
                  { label: 'Qapıçı Qurtarışları (Seyv)', a: stats.gkSavesA || 0, b: stats.gkSavesB || 0 },
                  { label: 'Real Qol Epizodları (Big Chances)', a: stats.bigChancesA || 0, b: stats.bigChancesB || 0 },
                  { label: 'Topa Sahib Olma (%)', a: `${stats.possessionA || 50}%`, b: `${stats.possessionB || 50}%`, isPct: true },
                  { label: 'Qət edilən məsafə (5v5)', a: stats.distanceCoveredA || '13.4 km', b: stats.distanceCoveredB || '12.8 km', isString: true },
                  { label: 'Dəqiq Ötürmələr', a: stats.passesA || 215, b: stats.passesB || 168 },
                  { label: 'Top Alma Uğuru (Tackles)', a: stats.tacklesA || 14, b: stats.tacklesB || 18 },
                  { label: 'Künc Zərbələri', a: stats.cornersA || 5, b: stats.cornersB || 4 },
                  { label: 'Qayda Pozuntuları (Follar)', a: stats.foulsA || 11, b: stats.foulsB || 5 }
                ].map(item => {
                  const valA = item.isString ? parseFloat(item.a) : (item.isPct ? parseInt(item.a) : item.a);
                  const valB = item.isString ? parseFloat(item.b) : (item.isPct ? parseInt(item.b) : item.b);
                  const total = (valA + valB) || 1;
                  const pctA = Math.round((valA / total) * 100);
                  const pctB = 100 - pctA;
                  return html`
                    <div key=${item.label} className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/40">
                      <div className="flex justify-between items-center text-xs font-black mb-1.5">
                        <span className="text-red-400 text-sm">${item.a}</span>
                        <span className="text-slate-300 font-bold uppercase text-[10px] tracking-wide">${item.label}</span>
                        <span className="text-sky-400 text-sm">${item.b}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full flex overflow-hidden">
                        <div className="bg-red-500 h-full transition-all" style=${{ width: `${pctA}%` }}></div>
                        <div className="bg-sky-500 h-full transition-all" style=${{ width: `${pctB}%` }}></div>
                      </div>
                    </div>
                  `;
                })}
              </div>
            </div>
          `}

          <!-- ================================================================= -->
          <!-- TAB 5: VİDEO İCMAL VƏ HADİSƏLƏR (VIDEO ARCHIVE) -->
          <!-- ================================================================= -->
          ${activeTab === 'video' && match.videoUrl && html`
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-purple-800/60 shadow-2xl bg-black">
                <iframe
                  src=${match.videoUrl.replace('watch?v=', 'embed/')}
                  title="Matç Video Yayımı"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              <!-- Video Timeline Events -->
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-black uppercase text-purple-300 tracking-wider mb-2 flex items-center gap-1.5">
                  <i className="fas fa-clock text-emerald-400"></i> Video Zaman Nişanələri (Qollar və Hadisələr)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  ${[
                    { min: '03:35', desc: '⚽ 10A Qol (Murad, 1-0)', color: 'text-emerald-400' },
                    { min: '04:40', desc: '⚽ 11H Qol (Şahbazlı, 1-1)', color: 'text-sky-400' },
                    { min: '05:15', desc: '⚽ 10A Qol (Fərid, 2-1)', color: 'text-emerald-400' },
                    { min: '06:05', desc: '⚽ 11H Qol (Əhmədzadə, 2-2)', color: 'text-sky-400' },
                    { min: '07:00', desc: '⚽ 11H Penalti (Şahbazlı, 2-3)', color: 'text-sky-400' },
                    { min: '08:20', desc: '⚽ 10A Qol (Murad, 3-3)', color: 'text-emerald-400' },
                    { min: '09:45', desc: '⚽ 10A Qol (Fərid, 4-3)', color: 'text-emerald-400' },
                    { min: '10:30', desc: '⚽ 11H Qol (Əhmədzadə, 4-4)', color: 'text-sky-400' },
                    { min: '11:00', desc: '⚽ 10A Qol (Murad Het-trik, 5-4)', color: 'text-emerald-400' },
                    { min: '17:19', desc: '🟥 10A Qırmızı Vərəqə (Fərid)', color: 'text-rose-400' }
                  ].map(e => html`
                    <div key=${e.min} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-slate-300">${e.desc}</span>
                      <span className="font-mono text-xs font-black text-amber-400 ml-2">${e.min}</span>
                    </div>
                  `)}
                </div>
              </div>
            </div>
          `}

        </main>

        <!-- BOTTOM SAFE AREA BAR -->
        <footer 
          className="bg-[#0d1527]/98 border-t border-slate-800/80 p-3.5 sm:p-4 text-center"
          style=${{ paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))' }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold">
              TDV Bakı Türk Liseyi • Sofascore AI Match Center
            </span>
            <button
              onClick=${handleBack}
              className="px-5 sm:px-6 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-black text-xs transition shadow-lg cursor-pointer"
            >
              ${lang === 'az' ? 'Geri Qayıt' : 'Back'}
            </button>
          </div>
        </footer>

      </div>
    </div>
  `;
}
