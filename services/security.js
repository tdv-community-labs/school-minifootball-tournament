/**
 * TDV BTL Mini-Football Tournament - Cybersecurity & Hardening Service
 * Features:
 * - Web Crypto API SHA-256 Salted Password Verification
 * - Brute-Force Rate Limiting & Lockout Defense
 * - Secure Session Token Management (with auto-expiry)
 * - Safe YouTube Embed URL Sanitization (Anti-XSS / Iframe injection)
 * - JSON Import Validation & Anti-Prototype-Pollution
 */

const DEFAULT_SALT = 'tdv_btl_salt_2026_';
// SHA-256 of (DEFAULT_SALT + 'btl2026')
const DEFAULT_HASH = '495e08190021c4ddf92eaad9a65cfa81c17a4105bac71571776578c67731f5cd';

const SESSION_KEY = 'btl_admin_session_token';
const ATTEMPTS_KEY = 'btl_admin_failed_attempts';
const LOCKOUT_KEY = 'btl_admin_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Native SHA-256 Hashing using Web Crypto API
 */
export async function sha256(message) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Node fallback for testing environments
  try {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(message).digest('hex');
  } catch (e) {
    throw new Error('Kriptoqrafik modul tapılmadı.');
  }
}

/**
 * Check if admin login is currently locked due to too many failed attempts
 */
export function checkBruteForceLockout() {
  try {
    const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    const now = Date.now();
    if (lockoutUntil && lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds };
    }
    return { isLocked: false, remainingSeconds: 0 };
  } catch (e) {
    return { isLocked: false, remainingSeconds: 0 };
  }
}

/**
 * Record a failed admin password attempt
 */
export function recordFailedAttempt() {
  try {
    const current = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(current));

    if (current >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
      return { lockedNow: true, remainingSeconds: 60 };
    }
    return { lockedNow: false, remainingAttempts: MAX_ATTEMPTS - current };
  } catch (e) {
    return { lockedNow: false, remainingAttempts: 3 };
  }
}

/**
 * Reset failed attempts after successful login
 */
export function resetFailedAttempts() {
  try {
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  } catch (e) {}
}

/**
 * Verify Admin Password against salted SHA-256 hash
 */
export async function verifyAdminPassword(inputPassword) {
  if (!inputPassword || typeof inputPassword !== 'string') {
    return { success: false, reason: 'Şifrə boş ola bilməz.' };
  }

  // Check lockout
  const lockout = checkBruteForceLockout();
  if (lockout.isLocked) {
    return {
      success: false,
      isLocked: true,
      reason: 'Həddindən artıq uğursuz cəhd! Zəhmət olmasa ' + lockout.remainingSeconds + ' saniyə gözləyin.'
    };
  }

  const salt = localStorage.getItem('btl_admin_pwd_salt') || DEFAULT_SALT;
  const targetHash = localStorage.getItem('btl_admin_pwd_hash') || DEFAULT_HASH;

  const inputHash = await sha256(salt + inputPassword.trim());

  if (inputHash === targetHash) {
    resetFailedAttempts();
    createAdminSession();
    return { success: true };
  } else {
    const result = recordFailedAttempt();
    if (result.lockedNow) {
      return {
        success: false,
        isLocked: true,
        reason: '5 dəfə yanlış şifrə daxil edildi. Giriş 60 saniyə müddətinə bloklandı!'
      };
    }
    return {
      success: false,
      isLocked: false,
      reason: 'Yanlış şifrə! Qalan cəhd sayı: ' + result.remainingAttempts
    };
  }
}

/**
 * Update Admin Password (Stored as Salted SHA-256)
 */
export async function updateAdminPassword(newPassword) {
  if (!newPassword || newPassword.trim().length < 6) {
    throw new Error('Yeni şifrə ən azı 6 simvoldan ibarət olmalıdır.');
  }
  const randomSalt = 'salt_' + Math.random().toString(36).substring(2) + '_' + Date.now();
  const hash = await sha256(randomSalt + newPassword.trim());
  localStorage.setItem('btl_admin_pwd_salt', randomSalt);
  localStorage.setItem('btl_admin_pwd_hash', hash);
  return true;
}

/**
 * Create a secure time-limited session
 */
export function createAdminSession() {
  try {
    const payload = {
      role: 'admin',
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
      nonce: Math.random().toString(36).substring(2)
    };
    const token = btoa(JSON.stringify(payload));
    sessionStorage.setItem(SESSION_KEY, token);
    // Legacy support for offline refresh in current tab
    localStorage.setItem('minifootball_admin_authorized', 'true');
  } catch (e) {
    console.error('Session creation failed:', e);
  }
}

/**
 * Verify whether active admin session is valid and not expired
 */
export function isSessionValid() {
  try {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) {
      // Fallback check: if legacy localStorage exists, hydrate into sessionStorage
      if (localStorage.getItem('minifootball_admin_authorized') === 'true') {
        createAdminSession();
        return true;
      }
      return false;
    }
    const payload = JSON.parse(atob(token));
    if (Date.now() > payload.expiresAt) {
      logoutAdmin();
      return false;
    }
    return true;
  } catch (e) {
    logoutAdmin();
    return false;
  }
}

/**
 * Destroy admin session
 */
export function logoutAdmin() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('minifootball_admin_authorized');
  } catch (e) {}
}

/**
 * Strict YouTube Embed URL Sanitizer (Anti-XSS & Anti-Iframe-Injection)
 * Allows ONLY valid YouTube / YouTube-nocookie embed links.
 */
export function sanitizeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  
  // Valid patterns:
  // https://www.youtube.com/embed/dQw4w9WgXcQ
  // https://youtube.com/embed/dQw4w9WgXcQ
  // https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ
  const ytRegex = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/[a-zA-Z0-9_-]{6,15}(\?[\w=&-]*)?$/;
  
  if (ytRegex.test(clean)) {
    return clean;
  }
  return null;
}

/**
 * Validate imported JSON against Prototype Pollution and structure tampering
 */
export function validateImportJSON(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Fayl etibarlı JSON obyekti deyil.');
  }

  // Anti-prototype pollution check
  const jsonStr = JSON.stringify(data);
  if (jsonStr.includes('__proto__') || jsonStr.includes('prototype') || jsonStr.includes('constructor')) {
    throw new Error('Təhlükəsizlik xətası: Zərərli prototip inyeksiyası aşkar edildi.');
  }

  // Check structure
  const hasClasses = Array.isArray(data.classes);
  const hasPlayers = Array.isArray(data.players);
  const hasMatches = Array.isArray(data.matches);

  if (!hasClasses && !hasPlayers && !hasMatches) {
    throw new Error('JSON faylında turnir məlumatları (siniflər, oyunçular və ya matçlar) tapılmadı.');
  }

  return true;
}
