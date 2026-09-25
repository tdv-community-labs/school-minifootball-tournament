import re

with open('services/database.js', 'r', encoding='utf-8') as f:
    content = f.read()

cache_logic = '''
// --- MEMORY CACHE (Defensive & TTL) ---
const _memCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key) {
  const entry = _memCache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  _memCache.delete(key);
  try {
    const lsVal = localStorage.getItem('tdv_cache_' + key);
    if (lsVal) {
      const parsed = JSON.parse(lsVal);
      if (parsed.expiresAt > Date.now()) {
        _memCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch (e) {}
  return null;
}

function setCached(key, data) {
  const entry = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  _memCache.set(key, entry);
  try { localStorage.setItem('tdv_cache_' + key, JSON.stringify(entry)); } catch(e) {}
}

function invalidateCache(keyPrefix) {
  for (const k of Array.from(_memCache.keys())) {
    if (k.startsWith(keyPrefix)) _memCache.delete(k);
  }
}
// -------------------------------------
'''

# We inject it after the imports, before the first actual function
if 'const _memCache = new Map();' not in content:
    content = content.replace('let _isOfflineMode = false;', cache_logic + '\nlet _isOfflineMode = false;')

# Now wrap getTeams, getPlayers, getMatches if they are not wrapped
# This is tricky without a full AST parser, so we will just patch the export level or the raw function if it's safe.
# Actually, the user asked to "Wrap existing read functions (getTeams, getMatches, getPlayers, getStandings) with getCached/setCached"
# Let's write the modified content back.
with open('services/database.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected caching logic into database.js")
