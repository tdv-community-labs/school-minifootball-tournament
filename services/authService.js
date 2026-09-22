/**
 * TDV Community Labs - Vahid Ekosistem Profili və SSO Xidməti (Unified Ecosystem SSO)
 * TDV Sports (Futbol Turniri) üçün Vahid Sessiya İdarəedicisi
 * Tək bir profil bütün ekosistemə (E-School, TDV Sports, Games, Mafia) bəs edir!
 */

const SESSION_KEY = 'tdv_ecosystem_session_v1';
const BROKER_URL = 'https://tdv-community-hubs.vercel.app/sso-broker.html';

let brokerIframe = null;
let brokerReady = false;
const brokerQueue = [];

function getOrCreateBroker() {
  if (typeof window === 'undefined') return null;
  if (brokerIframe) return brokerIframe;

  try {
    brokerIframe = document.createElement('iframe');
    brokerIframe.src = BROKER_URL;
    brokerIframe.style.display = 'none';
    brokerIframe.style.position = 'absolute';
    brokerIframe.style.width = '0';
    brokerIframe.style.height = '0';
    brokerIframe.style.border = '0';
    brokerIframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(brokerIframe);

    window.addEventListener('message', (e) => {
      if (!e.origin.includes('vercel.app') && !e.origin.includes('localhost')) return;
      if (e.data && e.data.type === 'TDV_SSO_BROKER_READY') {
        brokerReady = true;
        while (brokerQueue.length) {
          const fn = brokerQueue.shift();
          try { fn(); } catch(err) {}
        }
      }
    });
  } catch(e) {
    console.warn('[SSO Broker] Başladıla bilmədi:', e);
  }
  return brokerIframe;
}

function sendToBroker(msg) {
  if (typeof window === 'undefined') return;
  getOrCreateBroker();
  const send = () => {
    if (brokerIframe && brokerIframe.contentWindow) {
      brokerIframe.contentWindow.postMessage(msg, '*');
    }
  };
  if (brokerReady) {
    send();
  } else {
    brokerQueue.push(send);
    setTimeout(send, 800);
  }
}

export const authService = {
  listeners: new Set(),

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  notify(session) {
    this.listeners.forEach(fn => {
      try { fn(session); } catch(e) {}
    });
  },

  /**
   * Cari aktiv vahid profili oxuyur.
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
          
          sendToBroker({ type: 'TDV_SSO_SET', session: sessionData });
          this.updateOutboundLinks(sessionData);
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
          this.updateOutboundLinks(session);
          return session;
        } else if (session) {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (e) {}

    // 3. Əgər yerli yaddaşda yoxdursa, mərkəzi brokerdən avtomatik soruş
    this.syncFromBroker();
    return null;
  },

  syncFromBroker() {
    if (typeof window === 'undefined') return;
    const reqId = 'sync_sport_' + Date.now();

    const handler = (e) => {
      if (!e.origin.includes('vercel.app') && !e.origin.includes('localhost')) return;
      if (e.data && e.data.type === 'TDV_SSO_DATA' && e.data.requestId === reqId) {
        window.removeEventListener('message', handler);
        if (e.data.session) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(e.data.session));
          this.updateOutboundLinks(e.data.session);
          this.notify(e.data.session);
        }
      }
    };
    window.addEventListener('message', handler);

    sendToBroker({ type: 'TDV_SSO_GET', requestId: reqId });
  },

  /**
   * Tək Vahid Profil ilə Daxilolma
   */
  login(username, teamClass = '10A', pin = '', role = 'player') {
    const trimmed = (username || '').trim();
    if (!trimmed) throw new Error('Zəhmət olmasa adınızı və ya istifadəçi adınızı daxil edin.');

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
      ecosystem: {
        eschool: { active: true, grade: grade },
        sports: { team: cleanClass, role: role || 'player' },
        games: { nickname: trimmed },
        mafia: { tier: 'TIER_1', roleTitle: 'Klub Oyunçusu' }
      },
      token: 'tdv_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sendToBroker({ type: 'TDV_SSO_SET', session: session });
      this.updateOutboundLinks(session);
      this.notify(session);
    } catch (e) {}

    return session;
  },

  /**
   * Yeni Vahid Profil Qeydiyyatı (Bütün portallara 1 tək profil)
   */
  register({ fullName, username, teamClass = '10A', pin = '', avatar = '⚽', role = 'player' }) {
    const trimmedUser = (username || '').trim();
    const trimmedName = (fullName || '').trim() || trimmedUser;
    if (!trimmedUser) throw new Error('Zəhmət olmasa istifadəçi adı daxil edin.');

    const cleanClass = teamClass || '10A';
    const gradeMatch = cleanClass.match(/\d+/);
    const grade = gradeMatch ? Number(gradeMatch[0]) : 10;
    const finalAvatar = avatar || (role === 'coach' ? '👨‍🏫' : '⚽');

    const session = {
      userId: 'tdv-usr-' + Date.now().toString(36),
      username: trimmedUser,
      fullName: trimmedName,
      grade: grade,
      schoolClass: cleanClass,
      role: role || 'player',
      avatar: finalAvatar,
      ecosystem: {
        eschool: { active: true, grade: grade },
        sports: { team: cleanClass, role: role || 'player' },
        games: { nickname: trimmedUser },
        mafia: { tier: 'TIER_1', roleTitle: 'Klub Oyunçusu' }
      },
      token: 'tdv_token_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
    };

    try {
      const regUsersRaw = localStorage.getItem('tdv_registered_users_v1');
      const regUsers = regUsersRaw ? JSON.parse(regUsersRaw) : [];
      regUsers.push({ ...session, pin: pin || '' });
      localStorage.setItem('tdv_registered_users_v1', JSON.stringify(regUsers));
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      sendToBroker({ type: 'TDV_SSO_SET', session: session, users: regUsers });
      this.updateOutboundLinks(session);
      this.notify(session);
    } catch (e) {}

    return session;
  },

  loginWithDemo(type = 'player-10a') {
    if (type === 'player-11b') {
      return this.login('Murad Məmmədov', '11B', '1100', 'player');
    }
    if (type === 'coach') {
      return this.login('Elvin Müəllim', 'Məşqçi', 'coach2026', 'coach');
    }
    return this.login('Orxan Əliyev', '10A', '1000', 'player');
  },

  logout() {
    try {
      localStorage.removeItem(SESSION_KEY);
      sendToBroker({ type: 'TDV_SSO_LOGOUT' });
      this.updateOutboundLinks(null);
      this.notify(null);
    } catch (e) {}
  },

  createSsoTicket(session) {
    if (!session) return '';
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(session))));
    } catch (e) {
      return '';
    }
  },

  updateOutboundLinks(session) {
    if (typeof document === 'undefined') return;
    const ticket = session ? this.createSsoTicket(session) : '';
    const selector = 'a[href*="vercel.app"]';
    document.querySelectorAll(selector).forEach(link => {
      const base = link.getAttribute('data-base-href') || link.href.split('?')[0];
      link.setAttribute('data-base-href', base);
      if (ticket) {
        link.href = base + (base.endsWith('/') ? '' : '/') + '?sso_ticket=' + encodeURIComponent(ticket);
      } else {
        link.href = base;
      }
    });
  }
};
