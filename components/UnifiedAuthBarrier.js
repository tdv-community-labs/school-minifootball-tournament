/**
 * TDV Community Labs - Vahid Giriş Baryeri (Unified Auth Gate Barrier)
 * TDV Sports (Futbol Turniri) üçün Qoruyucu Giriş Ekranı
 * Aktiv vahid sessiya olmadan turnirə girişi tamamilə bloklayır.
 */

import React, { useState } from 'react';
import htm from 'htm';
import { authService } from '../services/authService.js?v=20260912_0120';

const html = htm.bind(React.createElement);

export default function UnifiedAuthBarrier({ onLogin, lang = 'az' }) {
  const [username, setUsername] = useState('');
  const [teamClass, setTeamClass] = useState('10A');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError(lang === 'az' ? 'Zəhmət olmasa adınızı və ya oyunçu kodunuzu daxil edin.' : 'Please enter your name or player code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const session = authService.login(username, teamClass, pin, 'player');
        if (onLogin) onLogin(session);
      } catch (err) {
        setError(err.message || 'Giriş xətası');
      } finally {
        setIsLoading(false);
      }
    }, 400);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070A12] text-slate-100 overflow-y-auto font-sans">
      
      <!-- Stadium Ambient Glow -->
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Auth Card -->
      <div className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-6 my-auto">
        
        <!-- Header & Emblem -->
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
            <img 
              src="assets/tdv-logo.png" 
              alt="TDV Crest" 
              className="w-12 h-12 rounded-full object-contain border border-amber-400/60 shadow-md"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ${lang === 'az' ? 'Vahid İdman Giriş Sistemi • Qorunan Resurs' : 'Unified Sports Auth System • Protected'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">TDV SPORTS</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              ${lang === 'az' 
                ? 'Minifutbol turnir cədvəlinə, canlı oyun nəticələrinə və Sofascore statistikasına baxmaq üçün daxil olun.' 
                : 'Sign in with your school account to access tournament standings, live results and Sofascore player analytics.'}
            </p>
          </div>
        </div>

        <!-- Error notification -->
        ${error && html`
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-2">
            <i className="fas fa-triangle-exclamation text-rose-400"></i>
            <span>${error}</span>
          </div>
        `}

        <!-- Form -->
        <form onSubmit=${handleSubmit} className="space-y-4">
          <!-- Username / Name -->
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              ${lang === 'az' ? 'Ad, Soyad və ya Şagird Kodu:' : 'Name or Player ID:'}
            </label>
            <div className="relative">
              <i className="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="text"
                value=${username}
                onChange=${(e) => setUsername(e.target.value)}
                placeholder=${lang === 'az' ? 'Məs: Orxan Əliyev' : 'e.g. Alex Green'}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <!-- Team / Class Selector -->
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              ${lang === 'az' ? 'Sinif / Komanda:' : 'Class / Team:'}
            </label>
            <div className="relative">
              <i className="fas fa-shield-halved absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <select
                value=${teamClass}
                onChange=${(e) => setTeamClass(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition appearance-none cursor-pointer"
              >
                ${['11A', '11B', '11C', '11D', '10A', '10B', '10C', '9A', '9B', '8A', '8B', '7A', '6A'].map(cls => html`
                  <option key=${cls} value=${cls}>${cls} Komandası</option>
                `)}
                <option value="Məşqçi">Məşqçi / Müəllim</option>
              </select>
            </div>
          </div>

          <!-- PIN (optional) -->
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              ${lang === 'az' ? 'Giriş Şifrəsi və ya PİN:' : 'PIN / Password:'}
            </label>
            <div className="relative">
              <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
              <input
                type="password"
                value=${pin}
                onChange=${(e) => setPin(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            disabled=${isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            ${isLoading ? html`<i className="fas fa-circle-notch fa-spin text-xs"></i>` : html`<i className="fas fa-arrow-right-to-bracket text-xs"></i>`}
            <span>${isLoading ? (lang === 'az' ? 'Yoxlanılır...' : 'Verifying...') : (lang === 'az' ? 'Turnirə Daxil Ol' : 'Enter Tournament')}</span>
          </button>
        </form>

        <!-- Quick 1-Click Access -->
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
            ${lang === 'az' ? 'Sürətli Oyunçu Girişi:' : 'Quick Player Access:'}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick=${() => handleQuickLogin('player-10a')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-center transition group cursor-pointer"
            >
              <span className="text-sm block mb-0.5">⚽</span>
              <span className="text-[10px] font-bold text-slate-300 block">10A Oyunçusu</span>
            </button>
            <button
              type="button"
              onClick=${() => handleQuickLogin('player-11b')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-center transition group cursor-pointer"
            >
              <span className="text-sm block mb-0.5">🏆</span>
              <span className="text-[10px] font-bold text-slate-300 block">11B Oyunçusu</span>
            </button>
            <button
              type="button"
              onClick=${() => handleQuickLogin('coach')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/5 text-center transition group cursor-pointer"
            >
              <span className="text-sm block mb-0.5">👨‍🏫</span>
              <span className="text-[10px] font-bold text-slate-300 block">Məşqçi</span>
            </button>
          </div>
        </div>

        <!-- Back to Hub -->
        <div className="text-center pt-2">
          <a
            href="https://tdv-community-hubs.vercel.app/"
            className="text-[11px] font-semibold text-slate-400 hover:text-emerald-400 transition inline-flex items-center gap-1.5"
          >
            <i className="fas fa-arrow-left text-[10px]"></i>
            <span>${lang === 'az' ? 'TDV Community Labs Mərkəzi Qovşağına Qayıt' : 'Back to Central Hub'}</span>
          </a>
        </div>

      </div>
    </div>
  `;
}
