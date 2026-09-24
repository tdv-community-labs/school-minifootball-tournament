import { authService } from './services/authService.js?v=20260912_0120';
import UnifiedAuthBarrier from './components/UnifiedAuthBarrier.js?v=20260912_0120';
/**
 * ============================================================================
 * FAYL ADI: app.js
 * MƏQSƏDİ: Turnirin Əsas Başlanğıc Komponenti və Tətbiq Konteyneri (App Shell)
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Əsas Naviqasiya Başlığı (Header) və Mobil Menyu.
 *   2. Mövsüm Seçicisi (Tournament Year Selector) və Yaş Kateqoriyası Pill-ləri.
 *   3. Səhifə yönləndirməsi (Dashboard, Standings, Matches, Players, Admin).
 *   4. Qlobal modalların idarə edilməsi (Qaydalar, Əlaqə, Axtarış, Oyunçu Profili).
 *   5. Dil (AZ, EN) və Qaranlıq/İşıqlı Tema (Dark/Light Mode) keçidləri.
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import Dashboard from './components/Dashboard.js?v=20260912_0120';
import Standings from './components/Standings.js?v=20260912_0120';
import Matches from './components/Matches.js?v=20260912_0120';
import Players from './components/Players.js?v=20260912_0120';
import AdminDashboard from './components/AdminDashboard.js?v=20260912_0120';
import PlayerProfileModal from './components/PlayerProfileModal.js?v=20260912_0120';
import GlobalSearchModal from './components/GlobalSearchModal.js?v=20260912_0120';
import PublicAiChatbot from './components/PublicAiChatbot.js?v=20260912_0120';
import { db } from './services/database.js?v=20260912_0120';
import { t, getDivisionLabel, isMatchDivision, getDivisionsForYear } from './services/i18n.js?v=20260912_0120';
import { verifyAdminPassword, isSessionValid, logoutAdmin, checkBruteForceLockout } from './services/security.js?v=20260912_0120';

const html = htm.bind(React.createElement);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return html`
        <div className="p-8 text-center bg-purple-950/40 dark:bg-slate-900/60 border border-purple-800/50 dark:border-slate-800 rounded-3xl my-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className="text-lg font-black text-white mb-2">Bölmə Yüklənərkən Xəta Baş Verdi</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto mb-4 font-mono bg-rose-950/60 p-3 rounded-xl border border-rose-900/60 break-all text-left">
            ${String(this.state.error?.message || this.state.error || 'Naməlum xəta')}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick=${() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
            >
              <i className="fas fa-redo-alt mr-1"></i> Yenidən Cəhd Et
            </button>
            <button
              onClick=${() => {
                try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
                window.location.href = window.location.pathname + '?fresh=' + Date.now();
              }}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
            >
              <i className="fas fa-sync-alt mr-1"></i> Keşi Təmizlə və Yüklə
            </button>
          </div>
        </div>
      `;
    }
    return this.props.children;
  }
}

export default function App() {
  const [userSession, setUserSession] = useState(() => authService.getSession());

  useEffect(() => {
    const unsub = authService.subscribe((newSession) => {
      setUserSession(newSession);
    });
    return unsub;
  }, []);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeYear, setActiveYear] = useState(() => {
    return localStorage.getItem('btl_selected_year') || '2022-2023';
  });
  const [availableDivisions, setAvailableDivisions] = useState(() => {
    const savedYear = localStorage.getItem('btl_selected_year') || '2022-2023';
    return getDivisionsForYear(savedYear);
  });
  const [activeDivision, setActiveDivision] = useState(() => {
    const savedYear = localStorage.getItem('btl_selected_year') || '2022-2023';
    const initDivs = getDivisionsForYear(savedYear);
    return initDivs.includes('11') ? '11' : (initDivs[0] || '10-11');
  });
  const [years, setYears] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => isSessionValid());
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState(null);

  // Language state (defaults to English as requested)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('btl_language') || 'en';
  });

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('btl_language', newLang);
  };

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('btl_theme') || localStorage.getItem('tdv_theme') || 'system';
  });

  const applyTheme = (currentTheme) => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = currentTheme === 'dark' || (currentTheme === 'system' && prefersDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
      if (document.body) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        document.body.style.backgroundColor = '#09090b';
        document.body.style.color = '#fafafa';
      }
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      if (document.body) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        document.body.style.backgroundColor = '#fafafa';
        document.body.style.color = '#09090b';
      }
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('btl_theme', newTheme);
    if (newTheme === 'dark' || newTheme === 'light') {
      localStorage.setItem('tdv_theme', newTheme);
    }
    applyTheme(newTheme);
  };

  const fetchYearsList = async () => {
    const allYears = await db.getYears();
    setYears(allYears);
    const savedYear = localStorage.getItem('btl_selected_year');
    let targetYear = '2022-2023';
    if (savedYear && allYears.includes(savedYear)) {
      targetYear = savedYear;
    } else if (allYears.includes('2022-2023')) {
      targetYear = '2022-2023';
    } else if (allYears.length > 0) {
      targetYear = allYears[0];
    }
    setActiveYear(targetYear);
    const divs = await db.getDivisions(targetYear);
    setAvailableDivisions(divs);
  };

  useEffect(() => {
    let isMounted = true;
    const syncDivisions = async () => {
      const divs = await db.getDivisions(activeYear);
      if (!isMounted) return;
      setAvailableDivisions(divs);
      if (!divs.includes(activeDivision)) {
        const compatible = divs.find(d => isMatchDivision(activeDivision, d));
        setActiveDivision(compatible || divs[0] || '11');
      }
    };
    syncDivisions();
    return () => { isMounted = false; };
  }, [activeYear]);

  useEffect(() => {
    applyTheme(theme);
    const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const listener = () => {
      const stored = localStorage.getItem('btl_theme') || 'system';
      if (stored === 'system') {
        applyTheme('system');
      }
    };
    if (mql && mql.addEventListener) {
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }
  }, [theme]);

  useEffect(() => {
    fetchYearsList();

    // Check for secret gate query parameter, hash, or clean URL pathname
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    
    if (
      params.get('gate') === 'admin-secret-gate' || 
      params.get('admin') === 'true' ||
      hash === '#admin-secret-gate' || 
      hash === '#admin' ||
      pathname === '/admin-secret-gate' ||
      pathname.endsWith('/admin-secret-gate')
    ) {
      // Clean URL: redirect browser to root path immediately
      window.history.replaceState({}, document.title, '/');
      
      // If already authorized, go straight to admin tab
      if (isSessionValid()) {
        setActiveTab('admin');
      } else {
        // Otherwise trigger password modal prompt
        setAuthError('');
        setShowPasswordPrompt(true);
      }
    } else if (hash && hash.startsWith('#match/')) {
      setActiveTab('matches');
    }

    const handleHashChange = () => {
      const currentHash = window.location.hash;
      if (currentHash && currentHash.startsWith('#match/')) {
        setActiveTab('matches');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const result = await verifyAdminPassword(inputPassword);
    if (result.success) {
      setIsAdminAuthorized(true);
      setShowPasswordPrompt(false);
      setInputPassword('');
      setActiveTab('admin');
    } else {
      setAuthError(result.reason || 'Xəta: Yanlış şifrə!');
      if (result.isLocked) {
        setTimeout(() => {
          setShowPasswordPrompt(false);
          setActiveTab('dashboard');
        }, 3000);
      }
      setInputPassword('');
    }
  };

  const handleReloadYears = async () => {
    await fetchYearsList();
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdminAuthorized(false);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    const curT = (k) => t(k, lang);
    switch (activeTab) {
      case 'dashboard':
        return html`<${Dashboard} setActiveTab=${setActiveTab} activeDivision=${activeDivision} activeYear=${activeYear} lang=${lang} t=${curT} onOpenPlayerProfile=${(name) => setSelectedPlayerProfile(name)} />`;
      case 'standings':
        return html`<${Standings} activeDivision=${activeDivision} activeYear=${activeYear} lang=${lang} t=${curT} onOpenPlayerProfile=${(name) => setSelectedPlayerProfile(name)} />`;
      case 'matches':
        return html`<${Matches} activeDivision=${activeDivision} activeYear=${activeYear} lang=${lang} t=${curT} />`;
      case 'players':
        return html`<${Players} activeDivision=${activeDivision} activeYear=${activeYear} lang=${lang} t=${curT} onOpenPlayerProfile=${(name) => setSelectedPlayerProfile(name)} />`;
      case 'admin':
        return html`<${AdminDashboard} activeDivision=${activeDivision} activeYear=${activeYear} lang=${lang} t=${curT} onYearsChanged=${handleReloadYears} onLogout=${handleAdminLogout} />`;
      default:
        return html`<${Dashboard} setActiveTab=${setActiveTab} activeDivision=${activeDivision} activeYear=${activeYear} lang=${lang} t=${curT} onOpenPlayerProfile=${(name) => setSelectedPlayerProfile(name)} />`;
    }
  };

  const navItems = [
    { id: 'dashboard', label: t('navHome', lang), icon: 'fas fa-chart-pie' },
    { id: 'standings', label: t('navStandings', lang), icon: 'fas fa-list-ol' },
    { id: 'matches', label: t('navMatches', lang), icon: 'fas fa-futbol' },
    { id: 'players', label: t('navPlayers', lang), icon: 'fas fa-users' },
    ...(isAdminAuthorized ? [{ id: 'admin', label: t('navAdmin', lang), icon: 'fas fa-user-cog' }] : [])
  ];

  const divisions = availableDivisions.map(divId => ({
    id: divId,
    label: getDivisionLabel(divId, lang)
  }));

  const handleYearChange = async (newYear) => {
    setActiveYear(newYear);
    localStorage.setItem('btl_selected_year', newYear);
    const divs = await db.getDivisions(newYear);
    setAvailableDivisions(divs);
    if (!divs.includes(activeDivision)) {
      const compatible = divs.find(d => isMatchDivision(activeDivision, d));
      setActiveDivision(compatible || divs[0] || '11');
    }
  };

  // MƏCBURİ VAHİD GİRİŞ QAPISI (MANDATORY AUTH GATE)
  if (!userSession) {
    return html`
      <${UnifiedAuthBarrier}
        lang=${lang}
        onLogin=${(session) => setUserSession(session)}
      />
    `;
  }

  return html`
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col transition-colors duration-200">
      <!-- Top Premium Navbar (Branded TDV Sports) -->
      <header className="sticky top-[33px] sm:top-[35px] z-40 bg-white/90 dark:bg-[#09090b]/85 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/[0.08] transition-all duration-200 no-print flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full no-scrollbar">
          <div className="flex items-center justify-between h-16 gap-3">
            
            <!-- Left Logo Section: Dedicated Sports Product Logo -->
            <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
              <div className="flex items-center space-x-2.5 cursor-pointer shrink-0 group" onClick=${() => setActiveTab('dashboard')}>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 shrink-0 group-hover:scale-105 transition-transform">
                  <i className="fas fa-futbol text-lg text-white"></i>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm sm:text-base md:text-lg font-black tracking-wider text-zinc-900 dark:text-white uppercase whitespace-nowrap m-0">
                      ${t('appTitle', lang)} <span className="text-purple-600 dark:text-purple-400 font-extrabold">${t('appSubtitle', lang)}</span>
                    </h1>
                    <span className="hidden sm:inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      LİQA
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase hidden min-[480px]:inline">
                    TDV COMMUNITY LABS • ATLETİKA & FUTBOL
                  </span>
                </div>
              </div>
            </div>

            <!-- Desktop Nav Items -->
            <nav className="hidden lg:flex items-center space-x-1 bg-zinc-100/80 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-white/[0.06] p-1 rounded-2xl backdrop-blur-md">
              ${navItems.map(item => {
                const isActive = activeTab === item.id;
                return html`
                  <button
                    key=${item.id}
                    onClick=${() => setActiveTab(item.id)}
                    className=${`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center space-x-2 cursor-pointer ${
                      isActive 
                        ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm border border-purple-200/80 dark:border-purple-800/40' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <i className=${`${item.icon} text-xs ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400 dark:text-zinc-500'}`}></i>
                    <span>${item.label}</span>
                  </button>
                `;
              })}
            </nav>

            <!-- Right Controls: always visible (desktop + mobile) -->
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              <!-- Active User Profile Chip & Logout -->
              ${userSession ? html`
                <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/[0.08] px-2.5 py-1 rounded-xl shadow-xs">
                  <span className="text-sm">${userSession.avatar || '⚽'}</span>
                  <div className="flex flex-col text-left leading-tight hidden md:flex">
                    <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 truncate max-w-[100px]">${userSession.fullName || userSession.username}</span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-bold">${userSession.schoolClass || 'Oyunçu'}</span>
                  </div>
                  <button
                    type="button"
                    onClick=${() => { authService.logout(); setUserSession(null); }}
                    title="Çıxış (Girişi kilidlə)"
                    className="ml-0.5 sm:ml-1 p-1 text-rose-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    <i className="fas fa-sign-out-alt text-xs"></i>
                  </button>
                </div>
              ` : null}

              <!-- Global Search Button -->
              <button
                type="button"
                onClick=${() => setIsSearchOpen(true)}
                title=${lang === 'az' ? 'Axtarış (Ctrl+K)' : 'Search (Ctrl+K)'}
                className="flex items-center space-x-1.5 bg-zinc-100 dark:bg-zinc-900/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] text-xs font-bold transition cursor-pointer"
              >
                <i className="fas fa-search text-purple-600 dark:text-purple-400 text-xs"></i>
                <span className="hidden sm:inline text-[11px] font-bold tracking-wide">${lang === 'az' ? 'Axtar...' : 'Search...'}</span>
              </button>

              <!-- Language Switcher -->
              <div className="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/[0.08] rounded-xl p-0.5 space-x-0.5">
                <button
                  type="button"
                  title="English"
                  onClick=${() => handleLangChange('en')}
                  className=${`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    lang === 'en'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span className="text-[11px]">🇬🇧</span>
                  <span className="text-[10px] uppercase font-bold">EN</span>
                </button>
                <button
                  type="button"
                  title="Azərbaycan dili"
                  onClick=${() => handleLangChange('az')}
                  className=${`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    lang === 'az'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <span className="text-[11px]">🇦🇿</span>
                  <span className="text-[10px] uppercase font-bold">AZ</span>
                </button>
              </div>

              <!-- Theme Switcher -->
              <div className="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-white/[0.08] rounded-xl p-0.5 space-x-0.5">
                <button
                  type="button"
                  title=${t('themeSystem', lang)}
                  onClick=${() => handleThemeChange('system')}
                  className=${`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <i className="fas fa-desktop text-xs"></i>
                </button>
                <button
                  type="button"
                  title=${t('themeLight', lang)}
                  onClick=${() => handleThemeChange('light')}
                  className=${`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <i className="fas fa-sun text-xs"></i>
                </button>
                <button
                  type="button"
                  title=${t('themeDark', lang)}
                  onClick=${() => handleThemeChange('dark')}
                  className=${`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-zinc-800 text-purple-400 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <i className="fas fa-moon text-xs"></i>
                </button>
              </div>

              <!-- Mobile Hamburger -->
              <div className="flex sm:hidden items-center space-x-1">
                <button
                  onClick=${() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  <i className=${`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-sm`}></i>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Mobile Menu (Dropdown) -->
        ${isMobileMenuOpen && html`
          <div className="lg:hidden bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <button
              type="button"
              onClick=${() => {
                setIsSearchOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-purple-600 dark:text-purple-400 cursor-pointer"
            >
              <i className="fas fa-search"></i>
              <span>${lang === 'az' ? 'Turnirdə Axtarış...' : 'Search Tournament...'}</span>
            </button>
            <div className="space-y-1">
              ${navItems.map(item => {
                const isActive = activeTab === item.id;
                return html`
                  <button
                    key=${item.id}
                    onClick=${() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className=${`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center space-x-3 cursor-pointer ${
                      isActive 
                        ? 'bg-purple-600 text-white shadow-xs' 
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <i className=${`${item.icon} w-5 text-xs`}></i>
                    <span>${item.label}</span>
                  </button>
                `;
              })}
            </div>

            <!-- Mobile Language & Theme Controls Row -->
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
              <!-- Language Switcher -->
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-0.5 space-x-0.5">
                <button
                  type="button"
                  onClick=${() => handleLangChange('en')}
                  className=${`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    lang === 'en'
                      ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <span>🇬🇧</span>
                  <span className="text-[10px] uppercase font-bold">EN</span>
                </button>
                <button
                  type="button"
                  onClick=${() => handleLangChange('az')}
                  className=${`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                    lang === 'az'
                      ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <span>🇦🇿</span>
                  <span className="text-[10px] uppercase font-bold">AZ</span>
                </button>
              </div>

              <!-- Theme Switcher -->
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-0.5 space-x-0.5">
                <button
                  type="button"
                  title="Sistem"
                  onClick=${() => handleThemeChange('system')}
                  className=${`p-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    theme === 'system'
                      ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <i className="fas fa-desktop text-xs"></i>
                </button>
                <button
                  type="button"
                  title="İşıqlı"
                  onClick=${() => handleThemeChange('light')}
                  className=${`p-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white dark:bg-zinc-700 text-amber-500 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <i className="fas fa-sun text-xs"></i>
                </button>
                <button
                  type="button"
                  title="Qaranlıq"
                  onClick=${() => handleThemeChange('dark')}
                  className=${`p-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-zinc-700 text-purple-400 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  <i className="fas fa-moon text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        `}

        <!-- Tournament Controls Bar (Season & Division) -->
        <div className="bg-zinc-50/95 dark:bg-zinc-900/90 border-t border-zinc-200/80 dark:border-zinc-800/80 py-2 sm:py-2.5 w-full backdrop-blur-md shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            
            <!-- Season Selector Pill -->
            ${years.length > 0 && html`
              <div className="relative inline-flex items-center shrink-0">
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-purple-500/50 rounded-xl px-3 py-1.5 shadow-2xs transition-all cursor-pointer">
                  <i className="far fa-calendar-alt text-purple-600 dark:text-purple-400 text-xs"></i>
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 tracking-wide whitespace-nowrap">${activeYear}</span>
                  <i className="fas fa-chevron-down text-[9px] text-zinc-400 ml-0.5"></i>
                </div>
                <select
                  value=${activeYear}
                  onChange=${(e) => handleYearChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                  title=${lang === 'az' ? 'Mövsümü seçin' : 'Select Season'}
                >
                  ${years.map(y => html`
                    <option key=${y} value=${y} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold text-xs">
                      ${y} ${lang === 'az' ? 'Mövsümü' : 'Season'}
                    </option>
                  `)}
                </select>
              </div>
            `}

            <!-- Separator -->
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>

            <!-- Division Switcher Bar -->
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hidden min-[440px]:inline-block mr-1">
                <i className="fas fa-trophy mr-1 text-amber-500"></i> ${lang === 'az' ? 'Liqa:' : 'Division:'}
              </span>
              ${divisions.map(div => {
                const isSelected = activeDivision === div.id;
                return html`
                  <button
                    key=${div.id}
                    onClick=${() => setActiveDivision(div.id)}
                    className=${`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-150 cursor-pointer ${
                      isSelected 
                        ? 'bg-purple-600 text-white shadow-xs border border-purple-500/40' 
                        : 'bg-white dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200/80 dark:border-zinc-700/60 hover:border-purple-300'
                    }`}
                  >
                    ${div.label}
                  </button>
                `;
              })}
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 sm:pb-8">
        <${ErrorBoundary} key=${activeTab + '_' + activeDivision + '_' + activeYear}>
          ${renderContent()}
        </${ErrorBoundary}>
      </main>

      <!-- Premium Footer -->
      <footer className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800/80 py-8 text-center text-xs font-semibold pb-24 sm:pb-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 pr-4 md:pr-48">
          <div className="flex items-center gap-2.5">
            <img src="assets/tdv-logo.jpg" alt="TDV BTL" className="w-6 h-6 rounded-full object-cover border border-amber-500/60 shadow-xs" />
            <p className="text-zinc-600 dark:text-zinc-300">© 2026 Türkiye Diyanet Vakfı Bakı Türk Liseyi • TDV Sports Liqası. ${t('allRightsReserved', lang)}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick=${() => setShowRulesModal(true)}
              className="transition-colors duration-150 cursor-pointer flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <i className="fas fa-book-open text-xs text-emerald-500"></i>
              <span className="font-bold">${t('rulesBtn', lang)}</span>
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <button
              onClick=${() => setShowContactModal(true)}
              className="transition-colors duration-150 cursor-pointer flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <i className="fas fa-envelope text-xs text-emerald-500"></i>
              <span className="font-bold">${t('contactBtn', lang)}</span>
            </button>
          </div>
        </div>
      </footer>

      <!-- Tournament Regulations (Reqlament) Modal -->
      ${showRulesModal && html`
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
          onClick=${(e) => { if (e.target === e.currentTarget) setShowRulesModal(false); }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-left animate-scaleIn max-h-[90vh] flex flex-col transition-colors duration-200">
            <!-- Header -->
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg border border-emerald-500/20">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">${t('rulesModalTitle', lang)}</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">${t('rulesModalSubtitle', lang)}</p>
                </div>
              </div>
              <button
                onClick=${() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                title=${lang === 'az' ? 'Bağla' : 'Close'}
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            <!-- Scrollable Body -->
            <div className="overflow-y-auto py-4 space-y-4 pr-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              <!-- Tournament History & About Block -->
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white mb-1.5 flex items-center">
                  <i className="fas fa-info-circle mr-2 text-emerald-500"></i> ${lang === 'az' ? 'Turnir Haqqında Ümumi Məlumat' : 'About the Championship'}
                </h4>
                <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                  ${lang === 'az' 
                    ? 'TDV Bakı Türk Liseyinin ənənəvi minifutbol çempionatı 2017-ci ildən təşkil olunur. Çempionat məktəbimizin 9, 10 və 11-ci sinif şagirdləri arasında keçirilir və liseyimizin ən böyük idman ənənələrindən biridir. Məqsəd şagirdlər arasında idman əxlaqını, dostluq əlaqələrini və komanda ruhunu yüksəltməkdir. Bu platformada bütün tarixi oyunlar, nəticələr, bombardirlər və Sofascore reytinqləri canlı arxivləşdirilib.' 
                    : 'The traditional mini-football championship of TDV Baku Turkish Lyceum has been held since 2017 among 9th, 10th, and 11th grade students. The tournament is dedicated to sportsmanship, teamwork, and healthy competition, digitally featuring complete historical match records, goal statistics, and Sofascore ratings.'}
                </p>
              </div>

              <!-- Item 1 -->
              <div className="bg-zinc-50/70 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mb-1 flex items-center">
                  <span className="mr-2">⏱️</span> ${t('rule1Title', lang)}
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400">${t('rule1Desc', lang)}</p>
              </div>

              <!-- Item 2 -->
              <div className="bg-zinc-50/70 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mb-1 flex items-center">
                  <span className="mr-2">📊</span> ${t('rule2Title', lang)}
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400">${t('rule2Desc', lang)}</p>
              </div>

              <!-- Item 3 -->
              <div className="bg-zinc-50/70 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mb-1 flex items-center">
                  <span className="mr-2">🎯</span> ${t('rule3Title', lang)}
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400">${t('rule3Desc', lang)}</p>
              </div>

              <!-- Item 4 -->
              <div className="bg-zinc-50/70 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mb-1 flex items-center">
                  <span className="mr-2">🟨</span> ${t('rule4Title', lang)}
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400">${t('rule4Desc', lang)}</p>
              </div>

              <!-- Item 5 -->
              <div className="bg-zinc-50/70 dark:bg-zinc-800/30 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mb-1 flex items-center">
                  <span className="mr-2">🏆</span> ${t('rule5Title', lang)}
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400">${t('rule5Desc', lang)}</p>
              </div>
            </div>

            <!-- Footer Action -->
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick=${() => setShowRulesModal(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition shadow-xs cursor-pointer"
              >
                ${t('closeBtn', lang)}
              </button>
            </div>
          </div>
        </div>
      `}

      <!-- Contact (Əlaqə) Modal -->
      ${showContactModal && html`
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick=${(e) => { if (e.target === e.currentTarget) setShowContactModal(false); }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center animate-scaleIn transition-colors duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto mb-4 border border-emerald-500/20">
              <i className="fas fa-envelope-open-text"></i>
            </div>
            
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-1">${t('contactModalTitle', lang)}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              ${t('contactModalSubtitle', lang)}
            </p>

            <!-- Contact Box -->
            <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 mb-6 text-left space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-200/70 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-xs">
                  <i className="fas fa-at"></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] uppercase font-bold text-zinc-400">${t('contactEmailLabel', lang)}</p>
                  <a 
                    href="mailto:orxannamazovld@gmail.com?subject=TDV%20BTL%20Futbol%20Turniri" 
                    className="text-xs font-black text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition break-all"
                  >
                    orxannamazovld@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                  <i className="fas fa-location-dot"></i>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">${lang === 'az' ? 'Məkan' : 'Location'}</p>
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">TDV Bakı Türk Liseyi Meydançası</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <a
                href="mailto:orxannamazovld@gmail.com?subject=TDV%20BTL%20Futbol%20Turniri"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
              >
                <i className="fas fa-paper-plane"></i>
                <span>${t('sendEmailBtn', lang)}</span>
              </a>
              <button
                onClick=${() => setShowContactModal(false)}
                className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-3 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                ${t('closeBtn', lang)}
              </button>
            </div>
          </div>
        </div>
      `}

      <!-- Password Prompt Overlay Modal -->
      ${showPasswordPrompt && html`
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center animate-scaleIn transition-colors duration-200">
            <div className="w-12 h-12 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <i className="fas fa-lock text-lg"></i>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2">Admin Girişi</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">İdarəetmə panelinə daxil olmaq üçün təhlükəsizlik şifrəsini yazın.</p>
            
            <form onSubmit=${handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                required
                placeholder="Şifrə"
                value=${inputPassword}
                onChange=${(e) => setInputPassword(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-center text-sm rounded-xl p-3 font-bold text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition"
              />
              ${authError && html`
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold leading-tight animate-fadeIn">
                  <i className="fas fa-shield-halved mr-1.5"></i>
                  ${authError}
                </div>
              `}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-xs cursor-pointer"
                >
                  Daxil Ol
                </button>
                <button
                  type="button"
                  onClick=${() => {
                    setShowPasswordPrompt(false);
                    setInputPassword('');
                    setActiveTab('dashboard');
                  }}
                  className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-3 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Ləğv Et
                </button>
              </div>
            </form>
          </div>
        </div>
      `}

      <!-- Global Search Modal -->
      <${GlobalSearchModal}
        isOpen=${isSearchOpen}
        onClose=${() => setIsSearchOpen(false)}
        onSelectPlayer=${(name) => {
          setIsSearchOpen(false);
          setSelectedPlayerProfile(name);
        }}
        onSelectClass=${(cName, yr, div) => {
          setIsSearchOpen(false);
          if (yr) handleYearChange(yr);
          if (div) setActiveDivision(div);
          setActiveTab('standings');
        }}
        onSelectMatch=${(m) => {
          setIsSearchOpen(false);
          if (m.year) handleYearChange(m.year);
          if (m.division) setActiveDivision(m.division);
          setActiveTab('matches');
        }}
        lang=${lang}
      />

      <!-- Unified Player Career Profile Modal -->
      <${PlayerProfileModal}
        playerName=${selectedPlayerProfile}
        onClose=${() => setSelectedPlayerProfile(null)}
        lang=${lang}
      />

      <!-- Public Interactive AI Chatbot for Visitors -->
      <${PublicAiChatbot}
        activeYear=${activeYear}
        activeDivision=${activeDivision}
        lang=${lang}
      />

      <!-- Native Mobile Bottom Navigation Bar (Sofascore Standard) -->
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800/80 py-1.5 px-2 flex justify-around items-center shadow-lg transition-colors duration-200"
        style=${{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
      >
        ${navItems.map(item => {
          const isActive = activeTab === item.id;
          return html`
            <button
              key=${item.id}
              onClick=${() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className=${`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-purple-600 dark:text-purple-400 font-black bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 font-bold'
              }`}
            >
              <i className=${`${item.icon} text-base mb-0.5`}></i>
              <span className="text-[10px] tracking-wider uppercase">${item.label}</span>
            </button>
          `;
        })}
      </nav>
    </div>
  `;
}
