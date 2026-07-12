import React, { useState, useEffect } from 'react';
import htm from 'htm';
import Dashboard from './components/Dashboard.js';
import Standings from './components/Standings.js';
import Matches from './components/Matches.js';
import Players from './components/Players.js';
import AdminDashboard from './components/AdminDashboard.js';
import { db } from './services/database.js';

const html = htm.bind(React.createElement);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDivision, setActiveDivision] = useState('11'); // '6', '7-8', '9-10', '11'
  const [activeYear, setActiveYear] = useState('2025-2026');
  const [years, setYears] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(
    localStorage.getItem('minifootball_admin_authorized') === 'true'
  );

  const fetchYearsList = async () => {
    const allYears = await db.getYears();
    setYears(allYears);
    if (allYears.length > 0 && !allYears.includes(activeYear)) {
      setActiveYear(allYears[0]);
    }
  };

  useEffect(() => {
    fetchYearsList();

    // Check for secret gate query parameter, hash, or clean URL pathname
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    
    if (
      params.get('gate') === 'admin-secret-gate' || 
      hash === '#admin-secret-gate' || 
      pathname === '/admin-secret-gate' ||
      pathname.endsWith('/admin-secret-gate')
    ) {
      localStorage.setItem('minifootball_admin_authorized', 'true');
      setIsAdminAuthorized(true);
      setActiveTab('admin');
      
      // Clean URL: redirect browser to root path
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const handleReloadYears = async () => {
    await fetchYearsList();
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('minifootball_admin_authorized');
    setIsAdminAuthorized(false);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return html`<${Dashboard} setActiveTab=${setActiveTab} activeDivision=${activeDivision} activeYear=${activeYear} />`;
      case 'standings':
        return html`<${Standings} activeDivision=${activeDivision} activeYear=${activeYear} />`;
      case 'matches':
        return html`<${Matches} activeDivision=${activeDivision} activeYear=${activeYear} />`;
      case 'players':
        return html`<${Players} activeDivision=${activeDivision} activeYear=${activeYear} />`;
      case 'admin':
        return html`<${AdminDashboard} activeDivision=${activeDivision} activeYear=${activeYear} onYearsChanged=${handleReloadYears} onLogout=${handleAdminLogout} />`;
      default:
        return html`<${Dashboard} setActiveTab=${setActiveTab} activeDivision=${activeDivision} activeYear=${activeYear} />`;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Ana Səhifə', icon: 'fas fa-chart-pie' },
    { id: 'standings', label: 'Turnir Cədvəli', icon: 'fas fa-list-ol' },
    { id: 'matches', label: 'Matçlar & Video', icon: 'fas fa-video' },
    { id: 'players', label: 'Oyunçular', icon: 'fas fa-users' },
    ...(isAdminAuthorized ? [{ id: 'admin', label: 'Admin Panel', icon: 'fas fa-user-cog' }] : [])
  ];

  const divisions = [
    { id: '6', label: '6-cı Siniflər' },
    { id: '7-8', label: '7-8-ci Siniflər' },
    { id: '9-10', label: '9-10-cu Siniflər' },
    { id: '11', label: '11-ci Siniflər' }
  ];

  return html`
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <!-- Top Premium Navbar (Branded TDV BTL Futbol) -->
      <header className="glass-nav sticky top-0 z-40 text-white shadow-lg border-b border-purple-800/40 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16">
            
            <!-- Left Logo & Year Selector Section -->
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 cursor-pointer" onClick=${() => setActiveTab('dashboard')}>
                <div className="bg-green-500 text-purple-950 p-2 rounded-xl flex items-center justify-center shadow-md animate-pulse">
                  <i className="fas fa-futbol text-lg"></i>
                </div>
                <h1 className="text-lg md:text-xl font-black tracking-wider uppercase">
                  TDV BTL <span className="text-green-400 font-extrabold">FUTBOL</span>
                </h1>
              </div>

              <!-- Premium Year Selector -->
              ${years.length > 0 && html`
                <div className="flex items-center space-x-1 bg-purple-950/60 border border-purple-800/60 rounded-xl px-2 py-1 ml-2 md:ml-4 shadow-inner">
                  <span className="text-[9px] text-green-400 font-black uppercase tracking-wider hidden sm:inline px-1">
                    <i className="fas fa-calendar-days mr-1"></i> Tədris İli:
                  </span>
                  <select
                    value=${activeYear}
                    onChange=${(e) => setActiveYear(e.target.value)}
                    className="bg-transparent text-white text-xs font-black focus:outline-none cursor-pointer border-none py-0.5 px-2 pr-6"
                  >
                    ${years.map(y => html`
                      <option key=${y} value=${y} className="bg-purple-950 text-white font-bold text-xs">${y}</option>
                    `)}
                  </select>
                </div>
              `}
            </div>

            <!-- Desktop Nav Items -->
            <nav className="hidden md:flex space-x-1">
              ${navItems.map(item => {
                const isActive = activeTab === item.id;
                return html`
                  <button
                    key=${item.id}
                    onClick=${() => setActiveTab(item.id)}
                    className=${`px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 ${
                      isActive 
                        ? 'bg-green-500 text-purple-950 shadow-md transform scale-105' 
                        : 'text-purple-100 hover:bg-purple-800/50 hover:text-white'
                    }`}
                  >
                    <i className=${item.icon}></i>
                    <span>${item.label}</span>
                  </button>
                `;
              })}
            </nav>

            <!-- Mobile menu button -->
            <div className="md:hidden">
              <button
                onClick=${() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-purple-200 hover:text-white hover:bg-purple-800 focus:outline-none transition"
              >
                <i className=${`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
              </button>
            </div>

          </div>
        </div>

        <!-- Mobile Menu (Dropdown) -->
        ${isMobileMenuOpen && html`
          <div className="md:hidden bg-purple-950 border-t border-purple-900 px-4 pt-2 pb-4 space-y-1">
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
        `}

        <!-- Division Switcher Bar -->
        <div className="bg-purple-950/80 border-t border-purple-800/30 py-2 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest mr-2 whitespace-nowrap">
              <i className="fas fa-trophy mr-1"></i> Turnir:
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${renderContent()}
      </main>

      <!-- Premium Footer -->
      <footer className="bg-purple-950 text-purple-200 border-t border-purple-900 py-6 text-center text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 TDV BTL Futbol. Bütün hüquqlar qorunur.</p>
          <div className="flex space-x-4">
            <span className="hover:text-green-400 transition cursor-pointer">Reqlament</span>
            <span>•</span>
            <span className="hover:text-green-400 transition cursor-pointer">Əlaqə</span>
          </div>
        </div>
      </footer>
    </div>
  `;
}
