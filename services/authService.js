/**
 * TDV Community Labs - Vahid Giriş Sistemi (Unified Ecosystem SSO & Session Service)
 * TDV Sports (Futbol Turniri) üçün Vahid Sessiya İdarəedicisi
 */

const SESSION_KEY = 'tdv_ecosystem_session_v1';

export const authService = {
  /**
   * Cari aktiv sessiyanı yoxlayır və qaytarır.
   * Əgər URL-də ?sso_ticket= varsa, onu oxuyub sessiyaya çevirir.
   */
  getSession() {
    if (typeof window === 'undefined') return null;

    // 1. URL parametrlərindən SSO biletini yoxla
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ssoTicket = urlParams.get('sso_ticket');
      if (ssoTicket) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(ssoTicket))));
        if (decoded && (decoded.username || decoded.userId)) {
          const sessionData = {
            ...decoded,
            expiresAt: decoded.expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000)
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
          
          // URL-i təmizlə
          urlParams.delete('sso_ticket');
          const newSearch = urlParams.toString();
          const cleanUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
          
          return sessionData;
        }
      }
    } catch (e) {
      console.warn('⚠️ [SSO] Keçid bileti oxunarkən xəta:', e);
    }

    // 2. localStorage-də mövcud vahid sessiyanı yoxla
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session && session.expiresAt && session.expiresAt > Date.now()) {
          return session;
        } else if (session) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (e) {
      console.warn('⚠️ [Auth] Sessiya oxunarkən xəta:', e);
    }

    return null;
  },

  /**
   * İstifadəçi adı, sinif/komanda və şifrə ilə daxilolma
   */
  login(username, teamClass = '10A', pin = '', role = 'player') {
    const trimmed = (username || '').trim();
    if (!trimmed) throw new Error('Zəhmət olmasa adınızı və ya oyunçu kodunu daxil edin.');

    const cleanClass = teamClass || '10A';
    const gradeMatch = cleanClass.match(/\d+/);
    const grade = gradeMatch ? Number(gradeMatch[0]) : 10;
    const avatar = role === 'coach' ? '👨‍🏫' : '⚽';

    const session = {
      userId: 'tdv-usr-' + Date.now().toString(36),
      username: trimmed,
      fullName: trimmed,
      grade: grade,
      schoolClass: cleanClass,
      role: role || 'player',
      avatar: avatar,
      token: 'tdv_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('⚠️ [Auth] Sessiya yaddaşa yazıla bilmədi:', e);
    }

    return session;
  },

  /**
   * Sürətli test girişi
   */
  loginWithDemo(type = 'player-10a') {
    if (type === 'player-11b') {
      return this.login('Murad Məmmədov', '11B', '1100', 'player');
    }
    if (type === 'coach') {
      return this.login('Elvin Müəllim (Bədən Tərbiyəsi)', 'Məşqçi', 'coach2026', 'coach');
    }
    return this.login('Orxan Əliyev', '10A', '1000', 'player');
  },

  /**
   * Çıxış funksiyası
   */
  logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('⚠️ [Auth] Sessiya silinmə xətası:', e);
    }
  },

  /**
   * Cross-domain SSO bilet generasiyası
   */
  createSsoTicket(session) {
    if (!session) return '';
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(session))));
    } catch (e) {
      return '';
    }
  }
};
