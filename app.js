import React, { useState, useEffect } from 'react';
import htm from 'htm';
import Dashboard from './components/Dashboard.js?v=20260909_0060';
import Standings from './components/Standings.js?v=20260909_0060';
import Matches from './components/Matches.js?v=20260909_0060';
import Players from './components/Players.js?v=20260909_0060';
import AdminDashboard from './components/AdminDashboard.js?v=20260909_0060';
import PlayerProfileModal from './components/PlayerProfileModal.js?v=20260909_0060';
import GlobalSearchModal from './components/GlobalSearchModal.js?v=20260909_0060';
import PublicAiChatbot from './components/PublicAiChatbot.js?v=20260909_0060';
import { db } from './services/database.js?v=20260909_0060';
import { t, getDivisionLabel } from './services/i18n.js?v=20260909_0060';
import { verifyAdminPassword, isSessionValid, logoutAdmin, checkBruteForceLockout } from './services/security.js?v=20260909_0060';

const html = htm.bind(React.createElement);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDivision, setActiveDivision] = useState('10-11'); // '6', '7-8', '9', '10-11'
  const [activeYear, setActiveYear] = useState(() => {
    return localStorage.getItem('btl_selected_year') || '2022-2023';
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
    return localStorage.getItem('btl_theme') || 'system';
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
    applyTheme(newTheme);
  };

  const fetchYearsList = async () => {
    const allYears = await db.getYears();
    setYears(allYears);
    const savedYear = localStorage.getItem('btl_selected_year');
    if (savedYear && allYears.includes(savedYear)) {
      setActiveYear(savedYear);
    } else if (allYears.includes('2022-2023')) {
      setActiveYear('2022-2023');
    } else if (allYears.length > 0) {
      setActiveYear(allYears[0]);
    }
  };

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
    }
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
    { id: 'matches', label: t('navMatches', lang), icon: 'fas fa-video' },
    { id: 'players', label: t('navPlayers', lang), icon: 'fas fa-users' },
    ...(isAdminAuthorized ? [{ id: 'admin', label: t('navAdmin', lang), icon: 'fas fa-user-cog' }] : [])
  ];

  const divisions = [
    { id: '6', label: getDivisionLabel('6', lang) },
    { id: '7-8', label: getDivisionLabel('7-8', lang) },
    { id: '9', label: getDivisionLabel('9', lang) },
    { id: '10-11', label: getDivisionLabel('10-11', lang) }
  ];

  const handleYearChange = (newYear) => {
    setActiveYear(newYear);
    localStorage.setItem('btl_selected_year', newYear);
  };

  return html`
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      <!-- Top Premium Navbar (Branded TDV BTL Futbol) -->
      <header className="bg-purple-950 sticky top-0 z-40 text-white shadow-xl border-b border-purple-800/40 flex flex-col no-scrollbar" style=${{ backgroundColor: '#2e0249' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full no-scrollbar">
          <div className="flex items-center justify-between h-16">
            
            <!-- Left Logo & Year Selector Section -->
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shrink-0" onClick=${() => setActiveTab('dashboard')}>
                <div className="bg-green-500 text-purple-950 p-1.5 sm:p-2 rounded-xl flex items-center justify-center shadow-md animate-pulse shrink-0">
                  <i className="fas fa-futbol text-base sm:text-lg"></i>
                </div>
                <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-wider uppercase whitespace-nowrap">
                  ${t('appTitle', lang)} <span className="text-green-400 font-extrabold hidden min-[480px]:inline">${t('appSubtitle', lang)}</span>
                </h1>
              </div>

              <!-- Premium Year Selector -->
              ${years.length > 0 && html`
                <div className="flex items-center space-x-1 bg-purple-900/80 border border-purple-700/60 rounded-xl px-1.5 sm:px-2 py-1 ml-1 sm:ml-2 md:ml-4 shadow-inner shrink-0">
                  <span className="text-[9px] text-green-400 font-black uppercase tracking-wider hidden sm:inline px-1">
                    <i className="fas fa-calendar-days mr-1"></i> ${t('academicYear', lang)}
                  </span>
                  <select
                    value=${activeYear}
                    onChange=${(e) => handleYearChange(e.target.value)}
                    className="bg-transparent text-white text-[11px] sm:text-xs font-black focus:outline-none cursor-pointer border-none py-0.5 px-1 pr-5"
                  >
                    ${years.map(y => html`
                      <option key=${y} value=${y} className="bg-purple-950 text-white font-bold text-xs">${y}</option>
                    `)}
                  </select>
                </div>
              `}
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

        <!-- Division Switcher Bar -->
        <div className="bg-purple-950/90 border-t border-purple-800/40 py-2 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest mr-2 whitespace-nowrap">
              <i className="fas fa-trophy mr-1"></i> ${lang === 'az' ? 'Turnir:' : 'Division:'}
            </span>
            ${divisions.map(div => {
              const isSelected = activeDivision === div.id;
              return html`
                <button
                  key=${div.id}
                  onClick=${() => setActiveDivision(div.id)}
                  className=${`px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-wide whitespace-nowrap transition-all ${
                    isSelected 
                      ? 'bg-green-500 text-purple-950 shadow bg-green-500 scale-105' 
                      : 'bg-purple-900/40 text-purple-200 hover:bg-purple-800/50 hover:text-white'
                  }`}
                >
                  ${div.label}
                </button>
              `;
            })}
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        ${renderContent()}
      </main>

      <!-- Premium Footer -->
      <footer className="bg-purple-950 text-purple-200 border-t border-purple-900 py-6 text-center text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 TDV BTL ${t('appSubtitle', lang)}. ${t('allRightsReserved', lang)}</p>
          <div className="flex items-center space-x-4">
            <button
              onClick=${() => setShowRulesModal(true)}
              className="hover:text-green-400 transition cursor-pointer flex items-center space-x-1.5 py-1 px-2 rounded-lg hover:bg-purple-900/60"
            >
              <i className="fas fa-book-open text-xs text-green-400"></i>
              <span className="font-bold">${t('rulesBtn', lang)}</span>
            </button>
            <span className="text-purple-700">•</span>
            <button
              onClick=${() => setShowContactModal(true)}
              className="hover:text-green-400 transition cursor-pointer flex items-center space-x-1.5 py-1 px-2 rounded-lg hover:bg-purple-900/60"
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
    </div>
  `;
}
