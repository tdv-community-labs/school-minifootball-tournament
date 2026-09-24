/**
 * TDV Community Labs - Vahid Giriş və Qeydiyyat Baryeri (Unified Auth Gate Barrier)
 * TDV Sports (Futbol Turniri) üçün Qoruyucu Giriş və Qeydiyyat Ekranı
 * Aktiv vahid sessiya olmadan turnirə girişi tamamilə bloklayır.
 */

import React, { useState } from 'react';
import htm from 'htm';
import { authService } from '../services/authService.js?v=20260912_0125';

const html = htm.bind(React.createElement);

export default function UnifiedAuthBarrier({ onLogin, lang = 'az' }) {
  const [tab, setTab] = useState('login'); // 'login' və ya 'register'

  // Daxilolma sahələri
  const [loginUsername, setLoginUsername] = useState('');
  const [loginTeamClass, setLoginTeamClass] = useState('10A');
  const [loginPin, setLoginPin] = useState('');

  // Qeydiyyat sahələri
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regTeamClass, setRegTeamClass] = useState('10A');
  const [regAvatar, setRegAvatar] = useState('⚽');
  const [regPin, setRegPin] = useState('');
  const [regConfirmPin, setRegConfirmPin] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const footballAvatars = ['⚽', '🏃‍♂️', '🧤', '🏆', '🥇', '⚡', '🔥', '🦁'];
  const teamList = ['11A', '11B', '11C', '11D', '10A', '10B', '10C', '9A', '9B', '8A', '8B', '7A', '6A', 'Məşqçi'];

  // Daxilolma göndərilməsi
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginUsername.trim()) {
      setError(lang === 'az' ? 'Zəhmət olmasa adınızı və ya oyunçu kodunuzu daxil edin.' : 'Please enter your name or player code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const session = authService.login(loginUsername, loginTeamClass, loginPin, loginTeamClass === 'Məşqçi' ? 'coach' : 'player');
        if (onLogin) onLogin(session);
      } catch (err) {
        setError(err.message || 'Giriş xətası');
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  // Qeydiyyat göndərilməsi
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regFullName.trim()) {
      setError(lang === 'az' ? 'Zəhmət olmasa ad və soyadınızı daxil edin.' : 'Please enter your full name.');
      return;
    }
    if (!regUsername.trim()) {
      setError(lang === 'az' ? 'Zəhmət olmasa istifadəçi adı təyin edin.' : 'Please enter a username.');
      return;
    }
    if (regPin && regConfirmPin && regPin !== regConfirmPin) {
      setError(lang === 'az' ? 'Daxil edilən şifrələr bir-birinə uyğun gəlmir.' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const session = authService.register({
          fullName: regFullName,
          username: regUsername,
          teamClass: regTeamClass,
          avatar: regAvatar,
          pin: regPin,
          role: regTeamClass === 'Məşqçi' ? 'coach' : 'player'
        });
        setSuccessMsg(lang === 'az' ? 'Oyunçu profili yaradıldı! Turnirə daxil olunur...' : 'Player profile created! Entering tournament...');
        setTimeout(() => {
          if (onLogin) onLogin(session);
        }, 500);
      } catch (err) {
        setError(err.message || 'Qeydiyyat zamanı xəta baş verdi.');
      } finally {
        setIsLoading(false);
      }
    }, 450);
  };

  const handleQuickLogin = (type) => {
    setIsLoading(true);
    setTimeout(() => {
      try {
        const session = authService.loginWithDemo(type);
        if (onLogin) onLogin(session);
      } catch (err) {
        setError(err.message || 'Sürətli giriş xətası');
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  return html`
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 overflow-y-auto font-sans">
      
      <!-- Stadium Ambient Glow -->
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Auth Card -->
      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl space-y-5 my-auto">
        
        <!-- Header & Emblem -->
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 shadow-xs">
            <img 
              src="assets/tdv-logo.jpg" 
              alt="TDV Crest" 
              className="w-11 h-11 rounded-full object-cover border border-amber-500/60 shadow-xs" 
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ${lang === 'az' ? 'Vahid Ekosistem Profili • 1 Hesab = Bütün Ekosistem' : 'Unified Ecosystem Profile • 1 Account for All'}
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">TDV SPORTS</h1>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              ${lang === 'az' 
                ? 'Tək 1 profil Futbol Turniri, E-School, Games və Mafia portallarının hamısına bəs edir! Vahid profilinizlə daxil olun və ya yeni vahid profil yaradın.' 
                : 'One single profile is enough for Football, E-School, Games and Mafia! Sign in with your unified profile or create one.'}
            </p>
          </div>
        </div>

        <!-- Daxil Ol / Qeydiyyatdan Keç Segmented Tablar -->
        <div className="flex p-1 rounded-2xl bg-zinc-800/80 border border-zinc-700/80">
          <button
            type="button"
            onClick=${() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            className=${`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              tab === 'login'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <i className="fas fa-arrow-right-to-bracket text-xs"></i>
            <span>${lang === 'az' ? 'Vahid Giriş' : 'Sign In'}</span>
          </button>
          <button
            type="button"
            onClick=${() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            className=${`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              tab === 'register'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <i className="fas fa-user-plus text-xs"></i>
            <span>${lang === 'az' ? 'Vahid Profil Yarat' : 'Create Profile'}</span>
          </button>
        </div>

        <!-- Bildirişlər -->
        ${error && html`
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <i className="fas fa-triangle-exclamation text-red-400"></i>
            <span>${error}</span>
          </div>
        `}
        ${successMsg && html`
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <i className="fas fa-circle-check text-emerald-400"></i>
            <span>${successMsg}</span>
          </div>
        `}

        <!-- ================= TAB 1: DAXİL OL ================= -->
        ${tab === 'login' && html`
          <form onSubmit=${handleLoginSubmit} className="space-y-3.5">
            <!-- Username / Name -->
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300">
                ${lang === 'az' ? 'Ad, Soyad və ya Oyunçu Kodu:' : 'Name or Player ID:'}
              </label>
              <div className="relative">
                <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
                <input
                  type="text"
                  value=${loginUsername}
                  onChange=${(e) => setLoginUsername(e.target.value)}
                  placeholder=${lang === 'az' ? 'Məs: Orxan Əliyev' : 'e.g. Alex Green'}
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <!-- Team / Class Selector -->
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300">
                ${lang === 'az' ? 'Sinif / Komanda:' : 'Class / Team:'}
              </label>
              <div className="relative">
                <i className="fas fa-shield-halved absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
                <select
                  value=${loginTeamClass}
                  onChange=${(e) => setLoginTeamClass(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer"
                >
                  ${teamList.map(cls => html`
                    <option key=${cls} value=${cls} className="bg-zinc-900 text-white">${cls === 'Məşqçi' ? (lang === 'az' ? 'Məşqçi / Müəllim' : 'Coach / Teacher') : `${cls} Komandası`}</option>
                  `)}
                </select>
              </div>
            </div>

            <!-- PIN (optional) -->
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300">
                ${lang === 'az' ? 'Giriş Şifrəsi və ya PİN:' : 'PIN / Password:'}
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
                <input
                  type="password"
                  value=${loginPin}
                  onChange=${(e) => setLoginPin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              disabled=${isLoading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer mt-1"
            >
              ${isLoading ? html`<i className="fas fa-circle-notch fa-spin text-xs"></i>` : html`<i className="fas fa-arrow-right-to-bracket text-xs"></i>`}
              <span>${isLoading ? (lang === 'az' ? 'Yoxlanılır...' : 'Verifying...') : (lang === 'az' ? 'Turnirə Daxil Ol' : 'Enter Tournament')}</span>
            </button>
          </form>
        `}

        <!-- ================= TAB 2: QEYDİYYATDAN KEÇ ================= -->
        ${tab === 'register' && html`
          <form onSubmit=${handleRegisterSubmit} className="space-y-3">
            <!-- Full Name -->
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300">
                ${lang === 'az' ? 'Ad və Soyad:' : 'Full Name:'}
              </label>
              <input
                type="text"
                value=${regFullName}
                onChange=${(e) => setRegFullName(e.target.value)}
                placeholder=${lang === 'az' ? 'Məs: Elmir Qasımov' : 'e.g. John Doe'}
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <!-- Username / Player ID -->
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300">
                ${lang === 'az' ? 'İstifadəçi Adı (Oyunçu Kodu):' : 'Username / Player ID:'}
              </label>
              <input
                type="text"
                value=${regUsername}
                onChange=${(e) => setRegUsername(e.target.value)}
                placeholder=${lang === 'az' ? 'Məs: elmir_forvard' : 'e.g. striker99'}
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <!-- Team / Class Selector -->
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300">
                ${lang === 'az' ? 'Komanda / Sinif:' : 'Team / Class:'}
              </label>
              <select
                value=${regTeamClass}
                onChange=${(e) => setRegTeamClass(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                ${teamList.map(cls => html`
                  <option key=${cls} value=${cls} className="bg-zinc-900 text-white">${cls === 'Məşqçi' ? (lang === 'az' ? 'Məşqçi / Müəllim' : 'Coach / Teacher') : `${cls} Komandası`}</option>
                `)}
              </select>
            </div>

            <!-- Avatar Selector -->
            <div className="space-y-1">
              <label className="block text-xs font-bold text-zinc-300">
                ${lang === 'az' ? 'Oyunçu Emblemi / Avatar:' : 'Player Badge / Avatar:'}
              </label>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                ${footballAvatars.map(av => html`
                  <button
                    key=${av}
                    type="button"
                    onClick=${() => setRegAvatar(av)}
                    className=${`w-8 h-8 rounded-xl flex items-center justify-center text-base transition cursor-pointer ${
                      regAvatar === av
                        ? 'bg-emerald-500 text-zinc-950 scale-110 shadow-xs ring-2 ring-emerald-400'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    ${av}
                  </button>
                `)}
              </div>
            </div>

            <!-- PIN / Password & Confirm -->
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">
                  ${lang === 'az' ? 'Şifrə / PİN:' : 'PIN:'}
                </label>
                <input
                  type="password"
                  value=${regPin}
                  onChange=${(e) => setRegPin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-300">
                  ${lang === 'az' ? 'Təkrarı:' : 'Confirm:'}
                </label>
                <input
                  type="password"
                  value=${regConfirmPin}
                  onChange=${(e) => setRegConfirmPin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <!-- Submit Register -->
            <button
              type="submit"
              disabled=${isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer mt-1"
            >
              ${isLoading ? html`<i className="fas fa-circle-notch fa-spin text-xs"></i>` : html`<i className="fas fa-user-check text-xs"></i>`}
              <span>${isLoading ? (lang === 'az' ? 'Profil Yaradılır...' : 'Creating...') : (lang === 'az' ? 'Vahid Profil Yarat və Ekosistemə Daxil Ol' : 'Create Profile & Enter')}</span>
            </button>
          </form>
        `}

        <!-- Quick 1-Click Access -->
        <div className="pt-2.5 border-t border-zinc-800 space-y-1.5">
          <div className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-wider">
            ${lang === 'az' ? 'Sürətli Oyunçu Girişi:' : 'Quick Player Access:'}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick=${() => handleQuickLogin('player-10a')}
              className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-center transition group cursor-pointer"
            >
              <span className="text-sm block">⚽</span>
              <span className="text-[10px] font-bold text-zinc-300 block">10A Oyunçusu</span>
            </button>
            <button
              type="button"
              onClick=${() => handleQuickLogin('player-11b')}
              className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-center transition group cursor-pointer"
            >
              <span className="text-sm block">🏆</span>
              <span className="text-[10px] font-bold text-zinc-300 block">11B Oyunçusu</span>
            </button>
            <button
              type="button"
              onClick=${() => handleQuickLogin('coach')}
              className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-center transition group cursor-pointer"
            >
              <span className="text-sm block">👨‍🏫</span>
              <span className="text-[10px] font-bold text-zinc-300 block">Məşqçi</span>
            </button>
          </div>
        </div>

        <!-- Back to Hub -->
        <div className="text-center pt-1">
          <a
            href="https://tdv-community-hubs.vercel.app/"
            className="text-[11px] font-semibold text-zinc-400 hover:text-emerald-400 transition inline-flex items-center gap-1.5"
          >
            <i className="fas fa-arrow-left text-[10px]"></i>
            <span>${lang === 'az' ? 'TDV Community Labs Mərkəzi Qovşağına Qayıt' : 'Back to Central Hub'}</span>
          </a>
        </div>

      </div>
    </div>
  `;
}
