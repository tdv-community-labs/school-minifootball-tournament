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
      if (document.body) {
        document.body.classList.add('dark');
        document.body.style.backgroundColor = '#080c14';
      }
    } else {
      document.documentElement.classList.remove('dark');
      if (document.body) {
        document.body.classList.remove('dark');
        document.body.style.backgroundColor = '#f1f5f9';
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

  return html`
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      <!-- Top Premium Navbar (Branded TDV BTL Futbol) -->
      <header className="bg-purple-950 sticky top-0 z-40 text-white shadow-xl border-b border-purple-800/40 flex flex-col no-scrollbar" style=${{ backgroundColor: '#2e0249', paddingTop: 'max(0px, env(safe-area-inset-top, 0px))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full no-scrollbar">
          <div className="flex items-center justify-between h-16">
            
            <!-- Left Logo Section -->
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              <div className="flex items-center space-x-2 cursor-pointer shrink-0" onClick=${() => setActiveTab('dashboard')}>
                <div className="bg-green-500 text-purple-950 p-1.5 sm:p-2 rounded-xl flex items-center justify-center shadow-md animate-pulse shrink-0">
                  <i className="fas fa-futbol text-base sm:text-lg"></i>
                </div>
                <h1 className="text-base sm:text-lg md:text-xl font-black tracking-wider uppercase whitespace-nowrap">
                  ${t('appTitle', lang)} <span className="text-green-400 font-extrabold hidden min-[480px]:inline">${t('appSubtitle', lang)}</span>
                </h1>
              </div>
            </div>

            <!-- Desktop Nav Items -->
            <nav className="hidden lg:flex space-x-1.5 overflow-x-auto no-scrollbar">
              ${navItems.map(item => {
                const isActive = activeTab === item.id;
                return html`
                  <button
                    key=${item.id}
                    onClick=${() => setActiveTab(item.id)}
                    className=${`px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
                      isActive 
                        ? 'bg-green-500 text-purple-950 shadow-lg transform scale-105 border border-green-400' 
                        : 'text-purple-100 hover:bg-purple-800/80 hover:text-white border border-transparent'
                    }`}
                  >
                    <i className=${item.icon}></i>
                    <span>${item.label}</span>
                  </button>
                `;
              })}
            </nav>

            <!-- Right Controls: always visible (desktop + mobile) -->
            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
              <!-- Global Search Button (always visible) -->
              <button
                type="button"
                onClick=${() => setIsSearchOpen(true)}
                title=${lang === 'az' ? 'Axtarış (Ctrl+K)' : 'Search (Ctrl+K)'}
                className="flex items-center space-x-1.5 bg-purple-900/80 hover:bg-purple-800 text-purple-200 hover:text-white p-2 sm:px-3 sm:py-1.5 rounded-xl border border-purple-700/60 text-xs font-bold transition shadow-inner cursor-pointer"
              >
                <i className="fas fa-search text-green-400 text-xs"></i>
                <span className="hidden sm:inline text-[11px] font-extrabold tracking-wide">${lang === 'az' ? 'Axtar...' : 'Search...'}</span>
              </button>

              <!-- Language Switcher (hidden on xs, visible sm+) -->
              <div className="hidden sm:flex items-center bg-purple-900/80 border border-purple-700/60 rounded-xl p-0.5 shadow-inner space-x-1">
                <button
                  type="button"
                  title="English (Primary)"
                  onClick=${() => handleLangChange('en')}
                  className=${`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                    lang === 'en'
                      ? 'bg-green-500 text-purple-950 shadow-md transform scale-105'
                      : 'text-purple-200 hover:text-white hover:bg-purple-800/60'
                  }`}
                >
                  <span className="text-[11px]">🇬🇧</span>
                  <span className="text-[10px] tracking-wider uppercase font-extrabold">EN</span>
                </button>
                <button
                  type="button"
                  title="Azərbaycan dili"
                  onClick=${() => handleLangChange('az')}
                  className=${`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                    lang === 'az'
                      ? 'bg-green-500 text-purple-950 shadow-md transform scale-105'
                      : 'text-purple-200 hover:text-white hover:bg-purple-800/60'
                  }`}
                >
                  <span className="text-[11px]">🇦🇿</span>
                  <span className="text-[10px] tracking-wider uppercase font-extrabold">AZ</span>
                </button>
              </div>

              <!-- Theme Switcher (hidden on xs, visible sm+) -->
              <div className="hidden sm:flex items-center bg-purple-900/80 border border-purple-700/60 rounded-xl p-0.5 shadow-inner space-x-1">
                <button
                  type="button"
                  title=${t('themeSystem', lang)}
                  onClick=${() => handleThemeChange('system')}
                  className=${`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                    theme === 'system'
                      ? 'bg-green-500 text-purple-950 shadow-md transform scale-105'
                      : 'text-purple-200 hover:text-white hover:bg-purple-800/60'
                  }`}
                >
                  <i className="fas fa-desktop text-[11px]"></i>
                </button>
                <button
                  type="button"
                  title=${t('themeLight', lang)}
                  onClick=${() => handleThemeChange('light')}
                  className=${`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                    theme === 'light'
                      ? 'bg-green-500 text-purple-950 shadow-md transform scale-105'
                      : 'text-purple-200 hover:text-white hover:bg-purple-800/60'
                  }`}
                >
                  <i className="fas fa-sun text-[11px]"></i>
                </button>
                <button
                  type="button"
                  title=${t('themeDark', lang)}
                  onClick=${() => handleThemeChange('dark')}
                  className=${`px-2 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1 ${
                    theme === 'dark'
                      ? 'bg-green-500 text-purple-950 shadow-md transform scale-105'
                      : 'text-purple-200 hover:text-white hover:bg-purple-800/60'
                  }`}
                >
                  <i className="fas fa-moon text-[11px]"></i>
                </button>
              </div>

              <!-- Mobile compact controls (xs only) -->
              <div className="flex sm:hidden items-center space-x-1 shrink-0">
                <!-- Mobile Language Toggle -->
                <button
                  onClick=${() => handleLangChange(lang === 'en' ? 'az' : 'en')}
                  title=${lang === 'en' ? 'Azərbaycan dilinə keç' : 'Switch to English'}
                  className="px-1.5 py-1 rounded-lg bg-purple-900/80 border border-purple-700/60 text-[11px] font-black text-white hover:bg-purple-800 transition flex items-center shadow-inner"
                >
                  <span>${lang === 'en' ? '🇬🇧' : '🇦🇿'}</span>
                </button>

                <!-- Mobile Theme Toggle -->
                <button
                  onClick=${() => handleThemeChange(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
                  title=${`Theme: ${theme}`}
                  className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-purple-800 transition"
                >
                  <i className=${`fas ${theme === 'dark' ? 'fa-moon text-purple-300' : theme === 'light' ? 'fa-sun text-amber-300' : 'fa-desktop text-green-400'} text-sm`}></i>
                </button>

                <!-- Hamburger (mobile nav tabs) -->
                <button
                  onClick=${() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden inline-flex items-center justify-center p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-purple-800 focus:outline-none transition"
                >
                  <i className=${`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-base`}></i>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Mobile Menu (Dropdown) -->
        ${isMobileMenuOpen && html`
          <div className="lg:hidden bg-purple-950 border-t border-purple-900 px-4 pt-2 pb-4 space-y-3">
            <!-- Mobile Search Bar In Menu -->
            <button
              type="button"
              onClick=${() => {
                setIsSearchOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center space-x-3 bg-purple-900/80 border border-purple-700 text-green-400 hover:bg-purple-800 shadow-inner"
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
                    className=${`w-full text-left px-4 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition flex items-center space-x-3 ${
                      isActive 
                        ? 'bg-green-500 text-purple-950' 
                        : 'text-purple-100 hover:bg-purple-900'
                    }`}
                  >
                    <i className=${`${item.icon} w-5`}></i>
                    <span>${item.label}</span>
                  </button>
                `;
              })}
            </div>

            <!-- Mobile Theme Switcher -->
            <div className="pt-2 border-t border-purple-900/60">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                  <i className="fas fa-palette mr-1 text-green-400"></i> Mövzu
                </span>
                <span className="text-[10px] font-bold text-green-400 uppercase">
                  ${theme === 'system' ? 'Sistem (Avto)' : theme === 'light' ? 'Açıq' : 'Qaranlıq'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-purple-900/90 border border-purple-700/60 rounded-xl p-1 shadow-inner">
                <button
                  onClick=${() => handleThemeChange('system')}
                  className=${`py-2 rounded-lg text-xs font-black transition flex flex-col items-center justify-center space-y-1 ${
                    theme === 'system' ? 'bg-green-500 text-purple-950 shadow' : 'text-purple-200 hover:text-white'
                  }`}
                >
                  <i className="fas fa-desktop text-xs"></i>
                  <span className="text-[10px] uppercase tracking-wider">Sistem</span>
                </button>
                <button
                  onClick=${() => handleThemeChange('light')}
                  className=${`py-2 rounded-lg text-xs font-black transition flex flex-col items-center justify-center space-y-1 ${
                    theme === 'light' ? 'bg-green-500 text-purple-950 shadow' : 'text-purple-200 hover:text-white'
                  }`}
                >
                  <i className="fas fa-sun text-xs"></i>
                  <span className="text-[10px] uppercase tracking-wider">Açıq</span>
                </button>
                <button
                  onClick=${() => handleThemeChange('dark')}
                  className=${`py-2 rounded-lg text-xs font-black transition flex flex-col items-center justify-center space-y-1 ${
                    theme === 'dark' ? 'bg-green-500 text-purple-950 shadow' : 'text-purple-200 hover:text-white'
                  }`}
                >
                  <i className="fas fa-moon text-xs"></i>
                  <span className="text-[10px] uppercase tracking-wider">Qaranlıq</span>
                </button>
              </div>
            </div>
          </div>
        `}

        <!-- Tournament Controls Bar (Season & Division) -->
        <div className="bg-purple-950/95 border-t border-purple-800/50 py-2 sm:py-2.5 w-full backdrop-blur-md shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            
            <!-- Premium Season Selector Pill -->
            ${years.length > 0 && html`
              <div className="relative inline-flex items-center shrink-0">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 via-purple-900 to-purple-900 border border-green-500/40 hover:border-green-400 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-sm transition-all cursor-pointer">
                  <i className="far fa-calendar-alt text-green-400 text-xs"></i>
                  <span className="text-xs font-black text-white tracking-wide whitespace-nowrap">${activeYear}</span>
                  <i className="fas fa-chevron-down text-[9px] text-green-400/80 ml-0.5"></i>
                </div>
                <select
                  value=${activeYear}
                  onChange=${(e) => handleYearChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
                  title=${lang === 'az' ? 'Mövsümü seçin' : 'Select Season'}
                >
                  ${years.map(y => html`
                    <option key=${y} value=${y} className="bg-purple-950 text-white font-bold text-xs">
                      ${y} ${lang === 'az' ? 'Mövsümü' : 'Season'}
                    </option>
                  `)}
                </select>
              </div>
            `}

            <!-- Elegant Separator -->
            <div className="h-5 w-px bg-purple-800/80 shrink-0"></div>

            <!-- Division Switcher Bar -->
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest hidden min-[440px]:inline-block mr-1">
                <i className="fas fa-trophy mr-1 text-amber-400"></i> ${lang === 'az' ? 'Turnir:' : 'Division:'}
              </span>
              ${divisions.map(div => {
                const isSelected = activeDivision === div.id;
                return html`
                  <button
                    key=${div.id}
                    onClick=${() => setActiveDivision(div.id)}
                    className=${`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide whitespace-nowrap transition-all ${
                      isSelected 
                        ? 'bg-green-500 text-purple-950 shadow-md transform scale-105 border border-green-400' 
                        : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800/70 hover:text-white border border-purple-700/40'
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
      <footer className="bg-purple-950 text-purple-200 border-t border-purple-900 py-6 text-center text-xs font-semibold pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 pr-4 md:pr-48">
          <p>© 2026 TDV BTL ${t('appSubtitle', lang)}. ${t('allRightsReserved', lang)}</p>
          <div className="flex items-center space-x-4">
            <button
              onClick=${() => setShowRulesModal(true)}
              className="hover:text-green-400 transition cursor-pointer flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-900/80 border border-purple-700/40"
            >
              <i className="fas fa-book-open text-xs text-green-400"></i>
              <span className="font-bold">${t('rulesBtn', lang)}</span>
            </button>
            <span className="text-purple-700">•</span>
            <button
              onClick=${() => setShowContactModal(true)}
              className="hover:text-green-400 transition cursor-pointer flex items-center space-x-1.5 py-1.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-900/80 border border-purple-700/40"
            >
              <i className="fas fa-envelope text-xs text-green-400"></i>
              <span className="font-bold">${t('contactBtn', lang)}</span>
            </button>
          </div>
        </div>
      </footer>

      <!-- Tournament Regulations (Reqlament) Modal -->
      ${showRulesModal && html`
        <div 
          className="fixed inset-0 z-50 bg-purple-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick=${(e) => { if (e.target === e.currentTarget) setShowRulesModal(false); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-purple-100 dark:border-slate-800 text-left animate-fadeIn max-h-[90vh] flex flex-col">
            <!-- Header -->
            <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-green-500/20 text-green-500 flex items-center justify-center text-lg">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div>
                  <h3 className="text-lg font-black text-purple-950 dark:text-white">${t('rulesModalTitle', lang)}</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">${t('rulesModalSubtitle', lang)}</p>
                </div>
              </div>
              <button
                onClick=${() => setShowRulesModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>

            <!-- Scrollable Body -->
            <div className="overflow-y-auto py-4 space-y-4 pr-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <!-- Tournament History & About Block -->
              <div className="bg-gradient-to-r from-purple-50 via-purple-100/40 to-indigo-50 dark:from-purple-950/60 dark:via-purple-900/40 dark:to-indigo-950/60 p-4 rounded-2xl border border-purple-200/80 dark:border-purple-800/80">
                <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200 mb-1.5 flex items-center">
                  <i className="fas fa-info-circle mr-2 text-green-500"></i> ${lang === 'az' ? 'Turnir Haqqında Ümumi Məlumat' : 'About the Championship'}
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  ${lang === 'az' 
                    ? 'TDV Bakı Türk Liseyinin ənənəvi minifutbol çempionatı 2017-ci ildən təşkil olunur. Çempionat məktəbimizin 9, 10 və 11-ci sinif şagirdləri arasında keçirilir və liseyimizin ən böyük idman ənənələrindən biridir. Məqsəd şagirdlər arasında idman əxlaqını, dostluq əlaqələrini və komanda ruhunu yüksəltməkdir. Bu rəsmi platformada bütün tarixi oyunlar, nəticələr, bombardirlər və Sofascore reytinqləri canlı arxivləşdirilib.' 
                    : 'The traditional mini-football championship of TDV Baku Turkish Lyceum has been held since 2017 among 9th, 10th, and 11th grade students. The tournament is dedicated to sportsmanship, teamwork, and healthy competition, digitally featuring complete historical match records, goal statistics, and Sofascore ratings.'}
                </p>
              </div>

              <!-- Item 1 -->
              <div className="bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100/60 dark:border-purple-900/40">
                <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200 mb-1 flex items-center">
                  <span className="mr-2">⏱️</span> ${t('rule1Title', lang)}
                </h4>
                <p>${t('rule1Desc', lang)}</p>
              </div>

              <!-- Item 2 -->
              <div className="bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100/60 dark:border-purple-900/40">
                <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200 mb-1 flex items-center">
                  <span className="mr-2">📊</span> ${t('rule2Title', lang)}
                </h4>
                <p>${t('rule2Desc', lang)}</p>
              </div>

              <!-- Item 3 -->
              <div className="bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100/60 dark:border-purple-900/40">
                <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200 mb-1 flex items-center">
                  <span className="mr-2">🎯</span> ${t('rule3Title', lang)}
                </h4>
                <p>${t('rule3Desc', lang)}</p>
              </div>

              <!-- Item 4 -->
              <div className="bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100/60 dark:border-purple-900/40">
                <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200 mb-1 flex items-center">
                  <span className="mr-2">🟨</span> ${t('rule4Title', lang)}
                </h4>
                <p>${t('rule4Desc', lang)}</p>
              </div>

              <!-- Item 5 -->
              <div className="bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100/60 dark:border-purple-900/40">
                <h4 className="font-extrabold text-sm text-purple-950 dark:text-purple-200 mb-1 flex items-center">
                  <span className="mr-2">🏆</span> ${t('rule5Title', lang)}
                </h4>
                <p>${t('rule5Desc', lang)}</p>
              </div>
            </div>

            <!-- Footer Action -->
            <div className="pt-4 border-t border-purple-100 dark:border-slate-800 flex justify-end">
              <button
                onClick=${() => setShowRulesModal(false)}
                className="bg-purple-900 hover:bg-purple-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition"
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
          className="fixed inset-0 z-50 bg-purple-950/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick=${(e) => { if (e.target === e.currentTarget) setShowContactModal(false); }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-purple-100 dark:border-slate-800 text-center animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-green-500/20 text-green-500 flex items-center justify-center text-2xl mx-auto mb-4">
              <i className="fas fa-envelope-open-text"></i>
            </div>
            
            <h3 className="text-xl font-black text-purple-950 dark:text-white mb-1">${t('contactModalTitle', lang)}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              ${t('contactModalSubtitle', lang)}
            </p>

            <!-- Contact Box -->
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 mb-6 text-left space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-300 flex items-center justify-center text-xs">
                  <i className="fas fa-at"></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] uppercase font-bold text-slate-400">${t('contactEmailLabel', lang)}</p>
                  <a 
                    href="mailto:orxannamazovld@gmail.com?subject=TDV%20BTL%20Futbol%20Turniri" 
                    className="text-xs font-black text-purple-950 dark:text-white hover:text-green-500 transition break-all"
                  >
                    orxannamazovld@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 flex items-center justify-center text-xs">
                  <i className="fas fa-location-dot"></i>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">${lang === 'az' ? 'Məkan' : 'Location'}</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">TDV Bakı Türk Liseyi Meydançası</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <a
                href="mailto:orxannamazovld@gmail.com?subject=TDV%20BTL%20Futbol%20Turniri"
                className="flex-1 bg-green-500 hover:bg-green-600 text-purple-950 font-black py-3 rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-green-500/20"
              >
                <i className="fas fa-paper-plane"></i>
                <span>${t('sendEmailBtn', lang)}</span>
              </a>
              <button
                onClick=${() => setShowContactModal(false)}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-5 rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                ${t('closeBtn', lang)}
              </button>
            </div>
          </div>
        </div>
      `}

      <!-- Password Prompt Overlay Modal -->
      ${showPasswordPrompt && html`
        <div className="fixed inset-0 z-50 bg-purple-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-purple-100 text-center animate-fadeIn">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-900">
              <i className="fas fa-lock text-xl"></i>
            </div>
            <h3 className="text-lg font-black text-purple-950 mb-2">Admin Girişi</h3>
            <p className="text-xs text-gray-500 mb-4">İdarəetmə panelinə daxil olmaq üçün təhlükəsizlik şifrəsini yazın.</p>
            
            <form onSubmit=${handlePasswordSubmit} className="space-y-4">
              <input
                type="password"
                required
                placeholder="Şifrə"
                value=${inputPassword}
                onChange=${(e) => setInputPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-center text-sm rounded-xl p-3 font-bold focus:outline-none focus:border-purple-900 transition"
              />
              ${authError && html`
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold leading-tight animate-fadeIn">
                  <i className="fas fa-shield-halved mr-1.5 text-red-500"></i>
                  ${authError}
                </div>
              `}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-900 text-white font-bold py-3 rounded-xl text-xs hover:bg-purple-800 transition"
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
                  className="bg-gray-150 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs hover:bg-gray-200 transition"
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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1e0231]/98 backdrop-blur-lg border-t border-purple-800/60 py-1.5 px-2 flex justify-around items-center shadow-2xl"
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
                  ? 'text-green-400 font-black scale-105 bg-purple-900/80 shadow-inner'
                  : 'text-purple-200/80 hover:text-white font-bold'
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
