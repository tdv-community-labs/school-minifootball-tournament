/**
 * ============================================================================
 * FAYL ADI: components/AdminDashboard.js
 * MƏQSƏDİ: Turnir Rəhbərliyi və Baş İdarəetmə Paneli (Administration Hub)
 * 
 * BU KOMPONENTİN VƏZİFƏLƏRİ:
 *   1. Siniflərin idarə edilməsi (əlavə etmə, dəyişmə, silmə).
 *   2. Oyunçuların idarə edilməsi (profil redaktəsi, mövqelər).
 *   3. Matçların idarə edilməsi və Sofascore oyunçu xalları konstruktoru.
 *   4. Toplu JSON Məlumat Yüklənməsi / Arxiv Bərpası.
 *   5. Sistem Sağlamlığı və Avtomatik Bərpa (Self-Healing Engine).
 *   6. Gemini AI Təhlükəsizlik və Model Tənzimləyicisi (AI Tuner).
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db } from '../services/database.js?v=20260910_0080';
import { 
  auditTournamentWithAI, 
  askGeminiTuner, 
  DEFAULT_MODEL, 
  FALLBACK_MODEL,
  DEFAULT_PUBLIC_KEY,
  DEFAULT_GUARDIAN_POOL,
  getGuardianKeyPool,
  getPublicChatKey 
} from '../services/geminiAssistant.js?v=20260910_0080';
import { auditTournamentData, repairTournamentData } from '../services/selfHealing.js?v=20260910_0080';
import { validateImportJSON, sanitizeEmbedUrl } from '../services/security.js?v=20260910_0080';

const html = htm.bind(React.createElement);

export default function AdminDashboard({ activeDivision, activeYear, onYearsChanged, onLogout }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [yearsList, setYearsList] = useState([]);
  const [newYearInput, setNewYearInput] = useState('');
  const [adminTab, setAdminTab] = useState('matches'); // 'matches', 'players', 'classes', 'years', 'system', 'ai-doctor'

  // AI & Self-Healing & Security State
  const [publicChatKey, setPublicChatKey] = useState(() => getPublicChatKey());
  const [guardianKeys, setGuardianKeys] = useState(() => getGuardianKeyPool());
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedAiModel, setSelectedAiModel] = useState(() => localStorage.getItem('btl_gemini_model') || DEFAULT_MODEL);
  const [keyStorageMode, setKeyStorageMode] = useState(() => localStorage.getItem('btl_gemini_storage_mode') || 'session');
  const [aiProxyUrl, setAiProxyUrl] = useState(() => localStorage.getItem('btl_gemini_proxy_url') || '');
  const [healthReport, setHealthReport] = useState(null);
  const [isHealing, setIsHealing] = useState(false);
  const [healMessage, setHealMessage] = useState(null);
  const [isAiAuditing, setIsAiAuditing] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState('');
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [isAiChatLoading, setIsAiChatLoading] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState([]);

  // Class Form State
  const [classForm, setClassForm] = useState({ id: null, name: '', division: '10-11' });

  // Player Form State
  const [playerForm, setPlayerForm] = useState({ id: null, name: '', class: '', position: 'Hücumçu' });
  const [editingPlayer, setEditingPlayer] = useState(false);

  // Match Form State
  const [matchForm, setMatchForm] = useState({
    id: null,
    stage: 'Qrup Mərhələsi',
    division: '10-11',
    teamA: '',
    teamB: '',
    scoreA: 0,
    scoreB: 0,
    penaltyScoreA: '',
    penaltyScoreB: '',
    date: '',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  });
  const [editingMatch, setEditingMatch] = useState(false);

  // Rating Management State
  const [selectedMatchForRatings, setSelectedMatchForRatings] = useState(null);
  const [matchPlayerStats, setMatchPlayerStats] = useState([]); 
  
  // Load data helper
  const loadAdminData = async () => {
    const allPlayers = await db.getPlayers(activeYear);
    const allMatches = await db.getMatches(activeYear);
    const allClasses = await db.getClasses(activeYear);
    const allYears = await db.getYears();
    setPlayers(allPlayers);
    setMatches(allMatches);
    setClasses(allClasses);
    setYearsList(allYears);

    // Set initial class in form if list is populated
    if (allClasses.length > 0 && !playerForm.class) {
      setPlayerForm(prev => ({ ...prev, class: allClasses[0].name }));
    }
  };

  // AI & Self-Healing Handlers
  const handleRunHealthAudit = async () => {
    try {
      const report = await auditTournamentData(activeYear);
      setHealthReport(report);
    } catch (err) {
      console.error("Health audit failed:", err);
    }
  };

  const handleAutoRepair = async () => {
    if (!confirm("Bütün kateqoriyalar, turnir cədvəlləri və oyunçu statistikaları avtomatik yoxlanılıb bərpa edilsin?")) {
      return;
    }
    setIsHealing(true);
    setHealMessage(null);
    try {
      const result = await repairTournamentData(activeYear);
      setHealMessage({
        type: 'success',
        text: `Bərpa tamamlandı: ${result.repairedCount} məsələ tənzimləndi.`
      });
      await loadAdminData();
      await handleRunHealthAudit();
      if (onYearsChanged) onYearsChanged();
    } catch (err) {
      console.error("Auto repair error:", err);
      setHealMessage({
        type: 'error',
        text: `Bərpa zamanı xəta baş verdi: ${err.message}`
      });
    } finally {
      setIsHealing(false);
    }
  };

  const handleSaveApiKey = (e) => {
    if (e) e.preventDefault();
    localStorage.setItem('btl_gemini_storage_mode', keyStorageMode);
    localStorage.setItem('btl_gemini_model', selectedAiModel);
    localStorage.setItem('btl_gemini_proxy_url', aiProxyUrl.trim());
    localStorage.setItem('btl_public_chat_key', publicChatKey.trim());
    localStorage.setItem('btl_guardian_key_pool', JSON.stringify(guardianKeys));

    alert("Bütün AI açarları (İctimai Çatbot + 3 Qoruyucu Açar) və parametrlər yadda saxlanıldı!");
  };

  const handlePurgeApiKey = () => {
    if (confirm("Bütün saxlanılan AI açarlarını və konfiqurasiyanı sıfırlamaq istəyirsiniz?")) {
      localStorage.removeItem('btl_public_chat_key');
      localStorage.removeItem('btl_guardian_key_pool');
      localStorage.removeItem('btl_gemini_proxy_url');
      setPublicChatKey(DEFAULT_PUBLIC_KEY);
      setGuardianKeys([...DEFAULT_GUARDIAN_POOL]);
      alert("Açarlar ilkin vəziyyətinə qaytarıldı.");
    }
  };

  const handleGuardianKeyChange = (index, value) => {
    const updated = [...guardianKeys];
    updated[index] = value.trim();
    setGuardianKeys(updated);
  };

  const handleRunAiAudit = async () => {
    setIsAiAuditing(true);
    setAiAuditResult('');
    try {
      const result = await auditTournamentWithAI(
        { activeYear, activeDivision },
        {
          keyPool: guardianKeys,
          proxyUrl: aiProxyUrl.trim(),
          model: selectedAiModel
        }
      );
      setAiAuditResult(result);
    } catch (err) {
      setAiAuditResult(`AI Təhlili xətası: ${err.message}`);
    } finally {
      setIsAiAuditing(false);
    }
  };

  const handleSendAiChat = async (e, directQuery = null) => {
    if (e) e.preventDefault();
    const query = (directQuery || aiChatQuery).trim();
    if (!query || isAiChatLoading) return;
    setAiChatQuery('');
    const newHistory = [...aiChatHistory, { role: 'user', text: query }];
    setAiChatHistory(newHistory);
    setIsAiChatLoading(true);

    try {
      const reply = await askGeminiTuner(
        query,
        {
          activeYear,
          activeDivision,
          totalClasses: classes.length,
          totalMatches: matches.length
        },
        {
          keyPool: guardianKeys,
          proxyUrl: aiProxyUrl.trim(),
          model: selectedAiModel
        }
      );
      setAiChatHistory([...newHistory, { role: 'model', text: reply }]);
    } catch (err) {
      setAiChatHistory([...newHistory, { role: 'model', text: `Xəta baş verdi: ${err.message}` }]);
    } finally {
      setIsAiChatLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    handleRunHealthAudit();
  }, [activeDivision, activeYear]);

  // Year Handlers
  const handleAddYear = async (e) => {
    e.preventDefault();
    if (!newYearInput.trim()) return;
    const year = newYearInput.trim();
    if (yearsList.includes(year)) {
      alert("Bu tədris ili artıq mövcuddur.");
      return;
    }
    await db.addYear(year);
    setNewYearInput('');
    await loadAdminData();
    if (onYearsChanged) onYearsChanged();
  };

  const handleDeleteYear = async (year) => {
    if (confirm(`"${year}" tədris ilini silmək istədiyinizdən əminsiniz? Bu əməliyyat həmin ilə aid BÜTÜN sinifləri, oyunçuları və oyunları tamamilə siləcək!`)) {
      await db.deleteYear(year);
      await loadAdminData();
      if (onYearsChanged) onYearsChanged();
    }
  };

  // Class Handlers
  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!classForm.name || !classForm.division) {
      alert("Zəhmət olmasa sinif adını yazın və qrupunu seçin.");
      return;
    }
    // Check duplicates
    if (classes.some(c => c.name.toUpperCase() === classForm.name.toUpperCase())) {
      alert("Bu adda sinif artıq mövcuddur.");
      return;
    }
    await db.addClass({
      name: classForm.name.toUpperCase(),
      division: classForm.division,
      year: activeYear
    });
    setClassForm({ id: null, name: '', division: '11' });
    loadAdminData();
  };

  const handleDeleteClass = async (id) => {
    if (confirm("Bu sinfi silmək istədiyinizdən əminsiniz? (Sinfi sildikdə həmin sinfə aid bütün oyunçular da silinəcək!)")) {
      await db.deleteClass(id);
      loadAdminData();
    }
  };

  // Player handlers
  const handleSavePlayer = async (e) => {
    e.preventDefault();
    // Validate that we have classes registered
    if (classes.length === 0) {
      alert("İlk öncə 'Siniflər' bölməsindən sinif əlavə etməlisiniz.");
      return;
    }
    
    const selectedClassName = playerForm.class || classes[0].name;
    const playerClass = classes.find(c => c.name === selectedClassName);
    const division = playerClass ? playerClass.division : '11';

    if (!playerForm.name) {
      alert("Zəhmət olmasa oyunçu adını doldurun.");
      return;
    }

    const payload = {
      ...playerForm,
      class: selectedClassName,
      division,
      year: activeYear
    };

    if (editingPlayer) {
      await db.updatePlayer(payload);
      setEditingPlayer(false);
    } else {
      await db.addPlayer(payload);
    }
    setPlayerForm({ id: null, name: '', class: classes[0]?.name || '', position: 'Hücumçu' });
    loadAdminData();
  };

  const handleEditPlayerClick = (player) => {
    setPlayerForm(player);
    setEditingPlayer(true);
    setAdminTab('players');
  };

  const handleDeletePlayer = async (id) => {
    if (confirm("Bu oyunçunu silmək istədiyinizdən əminsiniz? (Fərdi statistikaları da silinəcək)")) {
      await db.deletePlayer(id);
      loadAdminData();
    }
  };

  // Match handlers
  const handleSaveMatch = async (e) => {
    e.preventDefault();
    if (!matchForm.teamA || !matchForm.teamB) {
      alert("Zəhmət olmasa komandaları seçin.");
      return;
    }
    if (matchForm.teamA === matchForm.teamB) {
      alert("Eyni komandalar birbiri ilə oynaya bilməz.");
      return;
    }

    const payload = {
      ...matchForm,
      scoreA: Number(matchForm.scoreA),
      scoreB: Number(matchForm.scoreB),
      penaltyScoreA: (matchForm.penaltyScoreA !== '' && matchForm.penaltyScoreA !== null && matchForm.penaltyScoreA !== undefined) ? Number(matchForm.penaltyScoreA) : null,
      penaltyScoreB: (matchForm.penaltyScoreB !== '' && matchForm.penaltyScoreB !== null && matchForm.penaltyScoreB !== undefined) ? Number(matchForm.penaltyScoreB) : null,
      year: activeYear
    };

    if (editingMatch) {
      await db.updateMatch(payload);
      setEditingMatch(false);
    } else {
      await db.addMatch(payload);
    }
    
    // Reset match form
    setMatchForm({
      id: null,
      stage: 'Qrup Mərhələsi',
      division: activeDivision || '11',
      teamA: '',
      teamB: '',
      scoreA: 0,
      scoreB: 0,
      penaltyScoreA: '',
      penaltyScoreB: '',
      date: '',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    });
    loadAdminData();
  };

  const handleEditMatchClick = (match) => {
    setMatchForm({
      ...match,
      penaltyScoreA: (match.penaltyScoreA !== undefined && match.penaltyScoreA !== null) ? match.penaltyScoreA : '',
      penaltyScoreB: (match.penaltyScoreB !== undefined && match.penaltyScoreB !== null) ? match.penaltyScoreB : '',
      date: match.date || ''
    });
    setEditingMatch(true);
  };

  const handleDeleteMatch = async (id) => {
    if (confirm("Bu matçı silmək istədiyinizdən əminsiniz?")) {
      await db.deleteMatch(id);
      loadAdminData();
    }
  };

  // Rating editing handlers
  const handleOpenRatingsModal = (match) => {
    setSelectedMatchForRatings(match);
    
    const matchTeamsPlayers = players.filter(p => p.class === match.teamA || p.class === match.teamB);
    
    const initialStats = matchTeamsPlayers.map(p => {
      const existingStat = (match.playerStats || []).find(s => s.playerId === p.id);
      return {
        playerId: p.id,
        name: p.name,
        class: p.class,
        position: p.position || '',
        // null = auto-calculate via Sofascore engine; a number = manual override
        rating:      existingStat?.rating      ?? null,
        goals:       existingStat?.goals        ?? 0,
        assists:     existingStat?.assists      ?? 0,
        yellowCards: existingStat?.yellowCards  ?? 0,
        redCards:    existingStat?.redCards     ?? 0,
        saves:       existingStat?.saves        ?? 0,
        passes:      existingStat?.passes       ?? 0
      };
    });
    setMatchPlayerStats(initialStats);
  };

  const handlePlayerStatChange = (playerId, field, value) => {
    setMatchPlayerStats(prev => 
      prev.map(stat => stat.playerId === playerId ? { ...stat, [field]: Number(value) } : stat)
    );
  };

  const handleSaveRatings = async () => {
    if (!selectedMatchForRatings) return;
    
    const formattedStats = matchPlayerStats.map(stat => {
      const obj = {
        playerId:    stat.playerId,
        goals:       Number(stat.goals       || 0),
        assists:     Number(stat.assists     || 0),
        passes:      Number(stat.passes      || 0),
        yellowCards: Number(stat.yellowCards || 0),
        redCards:    Number(stat.redCards    || 0),
        saves:       Number(stat.saves       || 0)
      };
      // Only persist rating if admin explicitly set it (non-null, non-empty)
      // Leaving it out lets calculateSofascoreRating auto-run on next load
      if (stat.rating !== null && stat.rating !== '' && stat.rating !== undefined) {
        obj.rating = Number(stat.rating);
      }
      return obj;
    });

    const updatedMatch = {
      ...selectedMatchForRatings,
      playerStats: formattedStats
    };

    await db.updateMatch(updatedMatch);
    setSelectedMatchForRatings(null);
    loadAdminData();
    alert("Oyunçu statistikası uğurla yadda saxlanıldı!");
  };

  const handleResetSystem = async () => {
    if (confirm("Bütün verilənlər bazasını ilkin vəziyyətinə qaytarmaq istədiyinizdən əminsiniz?")) {
      await db.resetDatabase();
      loadAdminData();
      alert("Verilənlər bazası sıfırlandı!");
    }
  };

  const handleLogout = () => {
    if (confirm("Admin panelindən çıxış etmək istədiyinizdən əminsiniz?")) {
      if (onLogout) onLogout();
    }
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        validateImportJSON(data);
        if (confirm("Bu fayldakı bütün sinif, oyunçu və matç məlumatlarını bazaya yükləmək istəyirsiniz?")) {
          await db.importData(data);
          loadAdminData();
          alert("Məlumatlar uğurla idxal olundu!");
          if (onYearsChanged) onYearsChanged();
        }
      } catch (err) {
        alert("Təhlükəsizlik / Format xətası: " + err.message);
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Dynamic lists based on form choices
  const classesForSelectedMatchDivision = classes.filter(c => c.division === matchForm.division).sort((a,b)=>a.name.localeCompare(b.name));
  
  const getDivisionLabel = (div) => {
    if (div === '6') return '6-cı Siniflər';
    if (div === '7') return '7-ci Siniflər';
    if (div === '8') return '8-ci Siniflər';
    if (div === '9') return '9-cu Siniflər';
    if (div === '10-11') return '10-11-ci Siniflər';
    if (div === '7-8') return '7-8-ci Siniflər';
    if (div === '9-10') return '9-10-cu Siniflər';
    return '11-ci Siniflər';
  };

  return html`
    <div className="space-y-6 animate-fadeIn">
      <!-- Title -->
      <div>
        <h2 className="text-2xl font-black text-purple-950 font-sans">Admin Panel</h2>
        <p className="text-sm text-gray-500 tabular-nums tracking-tight">TDV BTL Futbol Turnirinin idarə edilməsi</p>
      </div>

      <!-- Navigation Tabs -->
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <button
          onClick=${() => setAdminTab('matches')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${ adminTab === 'matches' ? 'border-purple-900 text-purple-950' : 'border-transparent text-gray-500 hover:text-purple-950 tabular-nums tracking-tight'
          }`}
        >
          Oyunlar / Hesablar
        </button>
        <button
          onClick=${() => setAdminTab('players')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${ adminTab === 'players' ? 'border-purple-900 text-purple-950' : 'border-transparent text-gray-500 hover:text-purple-950 tabular-nums tracking-tight'
          }`}
        >
          Oyunçular
        </button>
        <button
          onClick=${() => setAdminTab('classes')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${ adminTab === 'classes' ? 'border-purple-900 text-purple-950' : 'border-transparent text-gray-500 hover:text-purple-950 tabular-nums tracking-tight'
          }`}
        >
          Siniflər
        </button>
        <button
          onClick=${() => setAdminTab('years')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${ adminTab === 'years' ? 'border-purple-900 text-purple-950' : 'border-transparent text-gray-500 hover:text-purple-950 tabular-nums tracking-tight'
          }`}
        >
          Tədris İlləri
        </button>
        <button
          onClick=${() => setAdminTab('system')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${ adminTab === 'system' ? 'border-purple-900 text-purple-950' : 'border-transparent text-gray-500 hover:text-purple-950 tabular-nums tracking-tight'
          }`}
        >
          Sistem
        </button>
        <button
          onClick=${() => setAdminTab('ai-doctor')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${ adminTab === 'ai-doctor' ? 'border-purple-900 text-purple-950 bg-purple-50/50' : 'border-transparent text-gray-500 hover:text-purple-950 tabular-nums tracking-tight'
          }`}
        >
          <i className="fas fa-robot text-purple-600"></i>
          <span>AI & Avto-Tənzimləmə</span>
          ${healthReport && healthReport.issues.length > 0 && html`
            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded-full leading-none">
              ${healthReport.issues.length}
            </span>
          `}
        </button>
      </div>

      <!-- TAB 1: MATCH MANAGEMENT -->
      ${adminTab === 'matches' && html`
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Add/Edit Match form -->
          <div className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">
              ${editingMatch ? 'Matçı Redaktə Et' : 'Yeni Matç Əlavə Et'}
            </h3>
            <form onSubmit=${handleSaveMatch} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Turnir Qrupu (Division)</label>
                <select
                  value=${matchForm.division}
                  onChange=${(e) => setMatchForm({ ...matchForm, division: e.target.value, teamA: '', teamB: '' })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold min-h-[44px] tabular-nums tracking-tight"
                >
                  <option value="6">6-cı Siniflər</option>
                  <option value="7">7-ci Siniflər</option>
                  <option value="8">8-ci Siniflər</option>
                  <option value="9">9-cu Siniflər</option>
                  <option value="10-11">10-11-ci Siniflər</option>
                  <option value="7-8">7-8-ci Siniflər</option>
                  <option value="9-10">9-10-cu Siniflər</option>
                  <option value="11">11-ci Siniflər</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Mərhələ</label>
                <select
                  value=${matchForm.stage}
                  onChange=${(e) => setMatchForm({ ...matchForm, stage: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold text-purple-950 min-h-[44px] tabular-nums tracking-tight"
                >
                  <option value="Qrup Mərhələsi">Qrup Mərhələsi</option>
                  <option value="16/1 Final">16/1 Final</option>
                  <option value="8/1 Final">8/1 Final</option>
                  <option value="4/1 Final">4/1 Final</option>
                  <option value="Yarımfinal">Yarımfinal</option>
                  <option value="Final">Final</option>
                  <option value="3-cü Yer">3-cü Yer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Ev Sahibi</label>
                  <select
                    required
                    value=${matchForm.teamA}
                    onChange=${(e) => setMatchForm({ ...matchForm, teamA: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold min-h-[44px] tabular-nums tracking-tight"
                  >
                    <option value="">Seçin</option>
                    ${classesForSelectedMatchDivision.map(c => html`<option key=${c.id} value=${c.name}>${c.name}</option>`)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Qonaq</label>
                  <select
                    required
                    value=${matchForm.teamB}
                    onChange=${(e) => setMatchForm({ ...matchForm, teamB: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold min-h-[44px] tabular-nums tracking-tight"
                  >
                    <option value="">Seçin</option>
                    ${classesForSelectedMatchDivision.map(c => html`<option key=${c.id} value=${c.name}>${c.name}</option>`)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Ev Sahibi Qol</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value=${matchForm.scoreA}
                    onChange=${(e) => setMatchForm({ ...matchForm, scoreA: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 min-h-[44px] tabular-nums tracking-tight"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Qonaq Qol</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value=${matchForm.scoreB}
                    onChange=${(e) => setMatchForm({ ...matchForm, scoreB: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 min-h-[44px] tabular-nums tracking-tight"
                  />
                </div>
              </div>

              ${matchForm.scoreA === matchForm.scoreB && html`
                <div className="bg-purple-50 p-2.5 rounded-2xl border border-purple-100/50 space-y-2 animate-fadeIn">
                  <p className="text-[9px] font-black text-purple-900 uppercase tracking-widest">Penaltilər (Heç-heçə)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="Ev (Pen.)"
                        min="0"
                        value=${matchForm.penaltyScoreA}
                        onChange=${(e) => setMatchForm({ ...matchForm, penaltyScoreA: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5 text-center font-bold min-h-[44px] tabular-nums tracking-tight"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Qonaq (Pen.)"
                        min="0"
                        value=${matchForm.penaltyScoreB}
                        onChange=${(e) => setMatchForm({ ...matchForm, penaltyScoreB: e.target.value })}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5 text-center font-bold min-h-[44px] tabular-nums tracking-tight"
                      />
                    </div>
                  </div>
                </div>
              `}

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Oyun Tarixi (İstəyə bağlı)</label>
                <input
                  type="date"
                  value=${matchForm.date}
                  onChange=${(e) => setMatchForm({ ...matchForm, date: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 min-h-[44px] tabular-nums tracking-tight"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Video Link (YouTube Embed)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/embed/..."
                  value=${matchForm.videoUrl}
                  onChange=${(e) => setMatchForm({ ...matchForm, videoUrl: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 min-h-[44px] tabular-nums tracking-tight"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] flex-1 bg-purple-900 text-white font-bold py-2.5 text-xs hover:bg-purple-800 transition tabular-nums tracking-tight"
                >
                  ${editingMatch ? 'Yadda Saxla' : 'Matç Əlavə Et'}
                </button>
                ${editingMatch && html`
                  <button
                    type="button"
                    onClick=${() => {
                      setEditingMatch(false);
                      setMatchForm({ id: null, stage: 'Qrup Mərhələsi', division: '11', teamA: '', teamB: '', scoreA: 0, scoreB: 0, penaltyScoreA: '', penaltyScoreB: '', date: '', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' });
                    }}
                    className="bg-gray-150 text-gray-700 font-bold py-2.5 px-4 rounded-[8px] text-xs hover:bg-gray-200 transition min-h-[44px] tabular-nums tracking-tight"
                  >
                    Ləğv Et
                  </button>
                `}
              </div>
            </form>
          </div>

          <!-- Right: Matches list -->
          <div className="lg:col-span-8 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">Matç Siyahısı</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 text-center">Qrup</th>
                  <th className="pb-3">Mərhələ</th>
                  <th className="pb-3">Matç</th>
                  <th className="pb-3 text-center">Hesab</th>
                  <th className="pb-3 text-center">Tarix</th>
                  <th className="pb-3 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs tabular-nums tracking-tight">
                ${matches.map(m => html`
                  <tr key=${m.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 text-center font-bold text-green-700 bg-green-50 rounded px-1.5 tabular-nums tracking-tight">${m.division}</td>
                    <td className="py-3 font-semibold text-gray-500">${m.stage}</td>
                    <td className="py-3 font-extrabold text-purple-950">${m.teamA} vs ${m.teamB}</td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="bg-purple-950 text-white font-bold px-2 py-0.5 rounded text-[11px] whitespace-nowrap tabular-nums tracking-tight">
                          ${m.scoreA} - ${m.scoreB}
                        </span>
                        ${(m.penaltyScoreA !== null && m.penaltyScoreA !== undefined && m.penaltyScoreA !== '') && html`
                          <span className="text-[9px] text-green-600 font-extrabold mt-0.5 whitespace-nowrap">pen. ${m.penaltyScoreA} - ${m.penaltyScoreB}</span>
                        `}
                      </div>
                    </td>
                    <td className="py-3 text-center text-gray-500 font-medium whitespace-nowrap">${m.date || 'Təyin edilməyib'}</td>
                    <td className="py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick=${() => handleOpenRatingsModal(m)}
                        className="bg-green-100 text-green-800 font-bold p-2.5 rounded hover:bg-green-200 transition text-[10px] tabular-nums tracking-tight"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg> Reytinq
                      </button>
                      <button
                        onClick=${() => handleEditMatchClick(m)}
                        className="bg-purple-100 text-purple-900 font-bold p-2.5 rounded hover:bg-purple-200 transition text-[10px] tabular-nums tracking-tight"
                      >
                        Düzəliş
                      </button>
                      <button
                        onClick=${() => handleDeleteMatch(m.id)}
                        className="bg-red-100 text-red-700 font-bold p-2.5 rounded hover:bg-red-200 transition text-[10px] tabular-nums tracking-tight"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      `}

      <!-- TAB 2: PLAYER MANAGEMENT -->
      ${adminTab === 'players' && html`
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Add/Edit Player form -->
          <div className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">
              ${editingPlayer ? 'Oyunçunu Redaktə Et' : 'Yeni Oyunçu Əlavə Et'}
            </h3>
            <form onSubmit=${handleSavePlayer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  placeholder="Məs: Rəşad Nağıyev"
                  value=${playerForm.name}
                  onChange=${(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 min-h-[44px] tabular-nums tracking-tight"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Sinif</label>
                <select
                  required
                  value=${playerForm.class}
                  onChange=${(e) => setPlayerForm({ ...playerForm, class: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold text-purple-950 min-h-[44px] tabular-nums tracking-tight"
                >
                  ${classes.length === 0 
                    ? html`<option value="">Sinif tapılmadı! Öncə sinif yaradın.</option>` 
                    : classes.map(c => html`
                        <option key=${c.id} value=${c.name}>
                          ${c.name} (${getDivisionLabel(c.division)})
                        </option>
                      `)
                  }
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Mövqe (Pozisiya)</label>
                <select
                  value=${playerForm.position}
                  onChange=${(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold text-purple-950 min-h-[44px] tabular-nums tracking-tight"
                >
                  <option value="Hücumçu">Hücumçu</option>
                  <option value="Yarımmüdafiəçi">Yarımmüdafiəçi</option>
                  <option value="Müdafiəçi">Müdafiəçi</option>
                  <option value="Qapıçı">Qapıçı</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] flex-1 bg-purple-900 text-white font-bold py-2.5 text-xs hover:bg-purple-800 transition tabular-nums tracking-tight"
                >
                  ${editingPlayer ? 'Yadda Saxla' : 'Oyunçu Əlavə Et'}
                </button>
                ${editingPlayer && html`
                  <button
                    type="button"
                    onClick=${() => {
                      setEditingPlayer(false);
                      setPlayerForm({ id: null, name: '', class: classes[0]?.name || '', position: 'Hücumçu' });
                    }}
                    className="bg-gray-150 text-gray-700 font-bold py-2.5 px-4 rounded-[8px] text-xs hover:bg-gray-200 transition min-h-[44px] tabular-nums tracking-tight"
                  >
                    Ləğv Et
                  </button>
                `}
              </div>
            </form>
          </div>

          <!-- Right: Players list -->
          <div className="lg:col-span-8 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">Oyunçu Siyahısı</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Ad Soyad</th>
                  <th className="pb-3 text-center">Sinif</th>
                  <th className="pb-3 text-center">Qrup</th>
                  <th className="pb-3 text-center">Mövqe</th>
                  <th className="pb-3 text-center">Oyun</th>
                  <th className="pb-3 text-center">Qol/Asist</th>
                  <th className="pb-3 text-center">Reytinq</th>
                  <th className="pb-3 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs tabular-nums tracking-tight">
                ${players.map(p => html`
                  <tr key=${p.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 font-extrabold text-purple-950">${p.name}</td>
                    <td className="py-3 text-center text-purple-900 font-bold tabular-nums tracking-tight">${p.class}</td>
                    <td className="py-3 text-center text-gray-500 font-semibold">${p.division}</td>
                    <td className="py-3 text-center text-gray-500">${p.position}</td>
                    <td className="py-3 text-center font-bold tabular-nums tracking-tight">${p.matchesPlayed}</td>
                    <td className="py-3 text-center font-semibold text-gray-600">${p.goals} / ${p.assists}</td>
                    <td className="py-3 text-center font-black text-purple-900">${p.overallRating}</td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick=${() => handleEditPlayerClick(p)}
                        className="bg-purple-100 text-purple-900 font-bold p-2.5 rounded hover:bg-purple-200 transition text-[10px] tabular-nums tracking-tight"
                      >
                        Redaktə
                      </button>
                      <button
                        onClick=${() => handleDeletePlayer(p.id)}
                        className="bg-red-100 text-red-700 font-bold p-2.5 rounded hover:bg-red-200 transition text-[10px] tabular-nums tracking-tight"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      `}

      <!-- TAB 3: CLASS MANAGEMENT -->
      ${adminTab === 'classes' && html`
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Add Class Form -->
          <div className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">Yeni Sinif Əlavə Et</h3>
            <form onSubmit=${handleSaveClass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Sinif Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Məs: 10-A, 8-B"
                  value=${classForm.name}
                  onChange=${(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 uppercase font-bold min-h-[44px] tabular-nums tracking-tight"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Qrup (Division)</label>
                <select
                  value=${classForm.division}
                  onChange=${(e) => setClassForm({ ...classForm, division: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold text-purple-950 min-h-[44px] tabular-nums tracking-tight"
                >
                  <option value="6">6-cı Siniflər</option>
                  <option value="7">7-ci Siniflər</option>
                  <option value="8">8-ci Siniflər</option>
                  <option value="9">9-cu Siniflər</option>
                  <option value="10-11">10-11-ci Siniflər</option>
                  <option value="7-8">7-8-ci Siniflər</option>
                  <option value="9-10">9-10-cu Siniflər</option>
                  <option value="11">11-ci Siniflər</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] w-full bg-purple-900 text-white font-bold py-2.5 text-xs hover:bg-purple-800 transition tabular-nums tracking-tight"
                >
                  Sinif Əlavə Et
                </button>
              </div>
            </form>
          </div>

          <!-- Right: Classes list -->
          <div className="lg:col-span-8 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">Sinif Siyahısı</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Sinif</th>
                  <th className="pb-3 text-center">Turnir Qrupu</th>
                  <th className="pb-3 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs tabular-nums tracking-tight">
                ${classes.map(c => html`
                  <tr key=${c.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 font-extrabold text-purple-950 text-sm tabular-nums tracking-tight">${c.name}</td>
                    <td className="py-3 text-center">
                      <span className="bg-purple-100 text-purple-950 font-bold p-2.5 rounded-full text-[10px] tabular-nums tracking-tight">
                        ${getDivisionLabel(c.division)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick=${() => handleDeleteClass(c.id)}
                        className="bg-red-100 text-red-700 font-bold p-2.5 rounded hover:bg-red-200 transition text-[10px] tabular-nums tracking-tight"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      `}

      <!-- TAB 4: YEARS MANAGEMENT -->
      ${adminTab === 'years' && html`
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Add Year Form -->
          <div className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">Yeni Tədris İli Əlavə Et</h3>
            <form onSubmit=${handleAddYear} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tədris İli / Mövsüm</label>
                <input
                  type="text"
                  required
                  placeholder="Məs: 2026-2027"
                  value=${newYearInput}
                  onChange=${(e) => setNewYearInput(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold min-h-[44px] tabular-nums tracking-tight"
                />
                <p className="text-[10px] text-gray-400 mt-1">İl formatını "YYYY-YYYY" şəklində yazmağınız tövsiyə olunur.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] w-full bg-purple-900 text-white font-bold py-2.5 text-xs hover:bg-purple-800 transition tabular-nums tracking-tight"
                >
                  Tədris İli Əlavə Et
                </button>
              </div>
            </form>
          </div>

          <!-- Right: Years list -->
          <div className="lg:col-span-8 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <h3 className="text-base font-extrabold text-purple-950 mb-4 font-sans">Mövcud Tədris İlləri</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Tədris İli</th>
                  <th className="pb-3 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs tabular-nums tracking-tight">
                ${yearsList.map(y => html`
                  <tr key=${y} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 font-extrabold text-purple-950 text-sm flex items-center tabular-nums tracking-tight">
                      <i className="fas fa-calendar-alt text-purple-900 mr-2 text-sm tabular-nums tracking-tight"></i>
                      <span>${y}</span>
                      ${y === activeYear && html`
                        <span className="ml-2 bg-green-100 text-green-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Aktiv</span>
                      `}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick=${() => handleDeleteYear(y)}
                        className="bg-red-100 text-red-700 font-bold p-2.5 rounded hover:bg-red-200 transition text-[10px] tabular-nums tracking-tight"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      `}

      <!-- TAB 5: SYSTEM PARAMETERS -->
      ${adminTab === 'system' && html`
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-gray-100 shadow-sm max-w-lg">
          <h3 className="text-base font-extrabold text-purple-950 mb-4">Sistem Parametrləri</h3>
          <div className="space-y-4 text-xs font-semibold text-gray-600 tabular-nums tracking-tight">
            <p>
              TDV BTL Futbol Turniri məlumatlarının idarə edilməsi üçün sistem alətləri:
            </p>
            <div className="bg-purple-50 text-purple-950 border border-purple-100 rounded-2xl p-2.5 space-y-2">
              <h4 className="font-extrabold text-sm text-purple-900 tabular-nums tracking-tight">Məlumatların idarə olunması qaydası</h4>
              <p className="text-[11px] leading-relaxed">
                İstənilən matç əlavə edildikdə və ya silindikdə siniflər üzrə turnir cədvəli və oyunçu statistikaları avtomatik yenidən hesablanır. Yalnız 'Qrup Mərhələsi' matçlarının xalları turnir cədvəlinə yazılır.
              </p>
            </div>
            
            <div className="pt-4 flex flex-col space-y-3">
              <button
                onClick=${handleResetSystem}
                className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] bg-red-600 text-white font-bold py-3 -2xl text-xs hover:bg-red-700 transition shadow-sm tabular-nums tracking-tight"
              >
                <i className="fas fa-trash-alt mr-2"></i> Sistem Məlumatlarını Sıfırla (Default Seeding)
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                Qeyd: Sıfırlanma nəticəsində əvvəlki mock turnir məlumatları (20+ oyunçu, 14+ sinif və 8 oyun) bərpa olunacaqdır.
              </p>
              
              
              <div className="border-t border-zinc-200 dark:border-zinc-800 my-2"></div>
              
              <div className="bg-green-50 text-green-950 border border-green-100 rounded-2xl p-2.5 space-y-2">
                <h4 className="font-extrabold text-sm text-green-900 flex items-center tabular-nums tracking-tight">
                  <i className="fas fa-file-import mr-2 text-base"></i> Arxiv / JSON Məlumat Yüklə
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Hazırladığımız 'archive_2022_2023.json' və ya hər hansı digər arxiv JSON faylını bura yükləyərək toplu şəkildə bazaya (və ya aktivləşdirdikdə Firebase-ə) ötürə bilərsiniz.
                </p>
                <input
                  type="file"
                  accept=".json"
                  onChange=${handleImportJSON}
                  className="rounded-[8px] p-2.5.5 min-h-[44px] focus:ring-1 focus:ring-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50/50 -[8px] min-h-[44px] block w-full text-xs text-slate-500 file:mr-4 file: file: file: file:border-0 file:text-xs file:font-black file:bg-green-100 file:text-green-800 hover:file:bg-green-200 cursor-pointer pt-1 tabular-nums tracking-tight"
                />
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 my-2"></div>
              
              <button
                onClick=${handleLogout}
                className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] bg-purple-950 text-white font-bold py-3 -2xl text-xs hover:bg-purple-900 transition shadow-sm tabular-nums tracking-tight"
              >
                <i className="fas fa-sign-out-alt mr-2"></i> Admin Panelindən Çıxış (Sessiyanı Bağla)
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                Qeyd: Çıxış etdikdə admin paneli gizlənəcəkdir. Yenidən daxil olmaq üçün gizli keçid linkindən istifadə etməlisiniz.
              </p>
            </div>
          </div>
        </div>
      `}

      <!-- TAB 6: AI DOCTOR & SELF-HEALING -->
      ${adminTab === 'ai-doctor' && html`
        <div className="space-y-6">
          <!-- Top Info Banner -->
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 p-2.5 bg-white dark:bg-zinc-950/10 rounded-full text-[11px] font-bold tracking-wider uppercase mb-2 backdrop-blur-sm tabular-nums tracking-tight">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Ağıllı Avto-Tənzimləmə & Diaqnostika
                </div>
                <h3 className="text-xl font-black">Turnir İntellekt Mərkəzi (AI Tuner)</h3>
                <p className="text-xs text-purple-200 mt-1 max-w-xl leading-relaxed tabular-nums tracking-tight">
                  Turnir bazasındakı xallar, qollar, dublikat oyunçular, qrup uyğunsuzluqları və sinif kateqoriyaları avtomatik təhlil edilir və 1 kliklə bərpa olunur. Əlavə olaraq Google Gemini 3.8 / 3.7 AI ilə dərin audit apara bilərsiniz.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick=${handleRunHealthAudit}
                  className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] bg-white dark:bg-zinc-950/10 hover:bg-white dark:bg-zinc-950/20 text-white text-xs font-bold p-2.5.5 -2xl transition border border-white/20 flex items-center gap-2 tabular-nums tracking-tight"
                >
                  <i className="fas fa-rotate"></i>
                  <span>Yenidən Yoxla</span>
                </button>
                <button
                  onClick=${handleAutoRepair}
                  disabled=${isHealing}
                  className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] bg-emerald-500 hover:bg-emerald-400 text-purple-950 text-xs font-black px-5 py-2.5 -2xl transition shadow-md flex items-center gap-2 disabled:opacity-50 tabular-nums tracking-tight"
                >
                  <i className=${`fas ${isHealing ? 'fa-spinner fa-spin' : 'fa-wrench'}`}></i>
                  <span>${isHealing ? 'Bərpa edilir...' : 'İndi Avto-Bərpa Et'}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Heal Status Toast/Banner -->
          ${healMessage && html`
            <div className=${`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn ${ healMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200 tabular-nums tracking-tight'
            }`}>
              <i className=${`fas ${healMessage.type === 'success' ? 'fa-check-circle text-emerald-600' : 'fa-exclamation-circle text-red-600'} text-base`}></i>
              <span className="flex-1">${healMessage.text}</span>
              <button onClick=${() => setHealMessage(null)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
              </button>
            </div>
          `}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left Column (7 cols): Diagnostic Health Score & Issue List -->
            <div className="lg:col-span-7 space-y-6">
              
              <!-- Health Score Card -->
              <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-2 tabular-nums tracking-tight">
                      <i className="fas fa-heart-pulse text-rose-500"></i>
                      Baza Sağlamlıq Vəziyyəti (${activeYear})
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Turnir məlumatlarının bütövlük indeksi</p>
                  </div>

                  ${healthReport && html`
                    <div className="flex items-center gap-2">
                      <div className=${`text-xl font-black px-3.5 py-1 rounded-2xl ${ healthReport.healthScore >= 95 ? 'bg-emerald-100 text-emerald-800' : healthReport.healthScore >= 80 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        ${healthReport.healthScore}%
                      </div>
                    </div>
                  `}
                </div>

                <!-- Stats summary badges -->
                ${healthReport && html`
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-purple-50 rounded-2xl p-2.5 text-center">
                      <div className="text-[10px] uppercase font-bold text-purple-600 tabular-nums tracking-tight">Xətalar</div>
                      <div className="text-lg font-black text-purple-950">${healthReport.summary?.errors ?? healthReport.stats?.errorCount ?? 0}</div>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-2.5 text-center">
                      <div className="text-[10px] uppercase font-bold text-amber-600 tabular-nums tracking-tight">Xəbərdarlıqlar</div>
                      <div className="text-lg font-black text-amber-950">${healthReport.summary?.warnings ?? healthReport.stats?.warningCount ?? 0}</div>
                    </div>
                    <div className="bg-sky-50 rounded-2xl p-2.5 text-center">
                      <div className="text-[10px] uppercase font-bold text-sky-600 tabular-nums tracking-tight">Tövsiyələr</div>
                      <div className="text-lg font-black text-sky-950">${healthReport.summary?.info ?? healthReport.stats?.infoCount ?? 0}</div>
                    </div>
                  </div>
                `}

                <!-- Issue List -->
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-gray-700 tabular-nums tracking-tight">Aşkar Edilən Məsələlər:</div>
                  ${!healthReport ? html`
                    <div className="py-6 text-center text-xs text-gray-400 tabular-nums tracking-tight">
                      <i className="fas fa-spinner fa-spin mr-2"></i> Diaqnostika aparılır...
                    </div>
                  ` : healthReport.issues.length === 0 ? html`
                    <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-emerald-500 text-white flex items-center justify-center font-bold flex-shrink-0 min-h-[44px] tabular-nums tracking-tight">
                        <i className="fas fa-check"></i>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-900 tabular-nums tracking-tight">Bütün məlumatlar tam qaydasındadır!</div>
                        <div className="text-[11px] text-emerald-700">Qrup cədvəlləri, matç hesabları, xallar və oyunçu profilləri bütövdür.</div>
                      </div>
                    </div>
                  ` : html`
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      ${healthReport.issues.map((issue, idx) => html`
                        <div key=${idx} className=${`p-2.5 rounded-2xl border text-xs flex items-start gap-2.5 ${ issue.severity === 'error' ? 'bg-rose-50/70 border-rose-200 text-rose-950' : issue.severity === 'warning' ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-sky-50/70 border-sky-200 text-sky-950 tabular-nums tracking-tight'
                        }`}>
                          <i className=${`fas ${ issue.severity === 'error' ? 'fa-circle-xmark text-rose-500' : issue.severity === 'warning' ? 'fa-triangle-exclamation text-amber-500' : 'fa-circle-info text-sky-500'
                          } mt-0.5`}></i>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold flex items-center gap-2 tabular-nums tracking-tight">
                              <span>${issue.description}</span>
                              ${issue.autoFixable && html`
                                <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-[8px] font-black uppercase min-h-[44px]">Avto-bərpa</span>
                              `}
                            </div>
                            ${issue.details && html`
                              <div className="text-[10px] text-gray-500 mt-0.5 truncate">${JSON.stringify(issue.details)}</div>
                            `}
                          </div>
                        </div>
                      `)}
                    </div>
                  `}
                </div>
              </div>

              <!-- Gemini AI Deep Audit -->
              <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-2 tabular-nums tracking-tight">
                      <i className="fas fa-brain text-purple-600"></i>
                      Google Gemini 3.8 / 3.7 Dərin Turnir Auditi
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Turnir strukturunu, liderləri və anomaliyaları süni intellektlə analiz edin</p>
                  </div>
                  <button
                    onClick=${handleRunAiAudit}
                    disabled=${isAiAuditing}
                    className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs p-2.5 transition flex items-center gap-2 disabled:opacity-50 tabular-nums tracking-tight"
                  >
                    <i className=${`fas ${isAiAuditing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                    <span>${isAiAuditing ? 'Analiz Edilir...' : 'AI Analizi Başlat'}</span>
                  </button>
                </div>

                ${aiAuditResult && html`
                  <div className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs space-y-2 animate-fadeIn max-h-80 overflow-y-auto tabular-nums tracking-tight">
                    <div className="flex items-center justify-between text-purple-900 font-bold border-b border-purple-100 pb-2 tabular-nums tracking-tight">
                      <span><i className="fas fa-sparkles text-amber-500 mr-1.5"></i> AI Nəticəsi:</span>
                      <button onClick=${() => setAiAuditResult('')} className="text-gray-400 hover:text-gray-600 text-xs tabular-nums tracking-tight">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="text-gray-700 whitespace-pre-line leading-relaxed text-[11px] font-mono tabular-nums tracking-tight">
                      ${aiAuditResult}
                    </div>
                  </div>
                `}
              </div>

            </div>

            <!-- Right Column (5 cols): API Configuration & Interactive AI Tuner Assistant -->
            <div className="lg:col-span-5 space-y-6">
              
              <!-- Gemini API Key & Security Config Card -->
              <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-2 tabular-nums tracking-tight">
                    <i className="fas fa-shield-halved text-purple-600"></i>
                    AI & Kibertəhlükəsizlik Konfiqurasiyası
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Qorunur
                  </span>
                </div>

                <form onSubmit=${handleSaveApiKey} className="space-y-3.5">
                  <!-- AI Model Selection -->
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">
                      Gemini Modeli
                    </label>
                    <select
                      value=${selectedAiModel}
                      onChange=${(e) => setSelectedAiModel(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold text-purple-950 min-h-[44px] tabular-nums tracking-tight"
                    >
                      <option value="gemini-3.8-flash">Gemini 3.8 Flash — Ən Yeni & Sürətli (Tövsiyə olunur)</option>
                      <option value="gemini-3.7-flash">Gemini 3.7 Flash — Sürətli & Sabit (Ehtiyat)</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash — Standart Hibrid</option>
                    </select>
                  </div>

                  <!-- Storage Mode Selection -->
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">
                      API Açarının Saxlanma Təhlükəsizliyi
                    </label>
                    <select
                      value=${keyStorageMode}
                      onChange=${(e) => setKeyStorageMode(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-bold text-gray-700 min-h-[44px] tabular-nums tracking-tight"
                    >
                      <option value="session"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Müvəqqəti Sessiya (Tövsiyə olunur — Tab bağlananda silinir)</option>
                      <option value="local"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Brauzerdə Saxla (Yalnız şəxsi kompüterdə)</option>
                    </select>
                  </div>

                  <!-- Public Chatbot Key (1 Key for visitors) -->
                  <div className="bg-purple-50/50 p-2.5 rounded-2xl border border-purple-100 space-y-2">
                    <label className="block text-[10px] font-black text-purple-950 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-comments text-purple-600"></i>
                        1. İctimai Ziyarətçi Çatbot Açarı
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold tabular-nums tracking-tight">
                        Bütün Qonaqlar
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type=${showApiKey ? 'text' : 'password'}
                        value=${publicChatKey}
                        onChange=${(e) => setPublicChatKey(e.target.value)}
                        placeholder="Gemini API AÃ§arÄ±nÄ± daxil edin..."
                        className="w-full bg-white dark:bg-zinc-950 border border-purple-200 text-xs rounded-[8px] p-2.5.5 pr-10 font-mono min-h-[44px] tabular-nums tracking-tight"
                      />
                      <button
                        type="button"
                        onClick=${() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs tabular-nums tracking-tight"
                        title=${showApiKey ? 'Gizlət' : 'Göstər'}
                      >
                        <i className=${`fas ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Sayta daxil olan bütün şagird və azarkeşlərin sağ aşağıdakı çatbotla danışması üçün ayrılmış açar.
                    </p>
                  </div>

                  <!-- Guardian / Diagnostic Key Pool (3 Keys for site protection) -->
                  <div className="bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100 space-y-2.5">
                    <label className="block text-[10px] font-black text-indigo-950 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-shield-heart text-indigo-600"></i>
                        2. Saytı Yoxlamaq və Qorumaq üçün Açar Hovuzu (3 Açar)
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold tabular-nums tracking-tight">
                        Avto-Rotasiya Aktiv
                      </span>
                    </label>
                    
                    <div className="space-y-2">
                      ${guardianKeys.map((key, i) => html`
                        <div key=${i} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-indigo-900 w-14 shrink-0 tabular-nums tracking-tight">Açar ${i + 1}:</span>
                          <input
                            type=${showApiKey ? 'text' : 'password'}
                            value=${key}
                            onChange=${(e) => handleGuardianKeyChange(i, e.target.value)}
                            placeholder=${`Qoruyucu AÃ§ar (Qoruyucu Açar ${i + 1})`}
                            className="flex-1 bg-white dark:bg-zinc-950 border border-indigo-200 text-xs rounded-[8px] p-2.5 font-mono min-h-[44px] tabular-nums tracking-tight"
                          />
                        </div>
                      `)}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Turnir diaqnostikası, xətaların bərpası və admin AI analizləri bu 3 açarla növbəli (failover) işləyir. Biri limitə düşərsə, dərhal növbəti açar aktivləşir.
                    </p>
                  </div>

                  <!-- Serverless Proxy (100% Secret) -->
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1 flex items-center justify-between">
                      <span>Serverless Proxy URL (100% Gizli Açar)</span>
                      <span className="text-[9px] text-purple-600 font-normal">İxtiyari</span>
                    </label>
                    <input
                      type="url"
                      value=${aiProxyUrl}
                      onChange=${(e) => setAiProxyUrl(e.target.value)}
                      placeholder="https://tdv-gemini-proxy.workers.dev"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-mono placeholder-gray-300 min-h-[44px] tabular-nums tracking-tight"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Cloudflare Worker proxy istifadə etdikdə brauzerdə açar heç vaxt görünmür.
                    </p>
                  </div>

                  <!-- Buttons -->
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      type="button"
                      onClick=${handlePurgeApiKey}
                      className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] text-[11px] text-rose-600 hover:text-rose-800 font-bold p-2.5 transition hover:bg-rose-50 border border-transparent hover:border-rose-200 tabular-nums tracking-tight"
                    >
                      <i className="fas fa-trash-can mr-1"></i> Açarı Təmizlə
                    </button>
                    <button
                      type="submit"
                      className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] bg-purple-950 hover:bg-purple-900 text-white font-bold text-xs px-5 py-2.5 transition shadow-sm tabular-nums tracking-tight"
                    >
                      Yadda Saxla
                    </button>
                  </div>
                </form>

                <!-- Security Best Practices Guide Accordion -->
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5.5 space-y-2 text-[11px]">
                  <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <i className="fas fa-shield-virus text-purple-600"></i>
                    Kibertəhlükəsizlik: Açarı Necə Qorumalı?
                  </div>
                  <ul className="space-y-1.5 text-slate-600 pl-1 list-disc list-inside">
                    <li>
                      <strong>HTTP Referrer Məhdudiyyəti:</strong> Google Cloud / AI Studio-da açarı yalnız domeninizə bağlayın (məs: <code className="bg-white dark:bg-zinc-950 px-1 py-0.5 rounded text-[10px] font-mono tabular-nums tracking-tight">https://orxan.github.io/*</code>). Beləliklə, kimsə açarı kopyalasa belə işlədə bilməz.
                    </li>
                    <li>
                      <strong>API İcazəsi:</strong> Açarı yalnız "Gemini API" üçün aktiv edin.
                    </li>
                    <li>
                      <strong>Serverless Worker:</strong> Layihənin <code className="bg-white dark:bg-zinc-950 px-1 py-0.5 rounded text-[10px] font-mono tabular-nums tracking-tight">serverless/gemini-proxy-worker.js</code> şablonunu Cloudflare Worker-ə ataraq açarı 100% gizli saxlaya bilərsiniz.
                    </li>
                  </ul>
                  <div className="pt-1">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline font-bold inline-flex items-center gap-1 tabular-nums tracking-tight"
                    >
                      <i className="fas fa-external-link-alt text-[10px]"></i> Google AI Studio Konsolu
                    </a>
                  </div>
                </div>

              </div>

              <!-- Interactive AI Chat / Tuner Console -->
              <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col h-[520px]">
                <div className="border-b border-gray-100 pb-3">
                  <h4 className="font-extrabold text-sm text-purple-950 flex items-center gap-2 tabular-nums tracking-tight">
                    <i className="fas fa-comments text-purple-600"></i>
                    AI Tənzimləyici Konsol
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Turnir haqqında suallar verin və ya anomaliyaları sorğulayın</p>
                </div>

                <!-- Quick Query Pills -->
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick=${() => handleSendAiChat(null, "Turnir cədvəlini və lider komandaları analiz et")}
                    className="text-[10px] bg-purple-50 text-purple-900 hover:bg-purple-100 px-2.5 py-1 rounded-[8px] font-semibold transition min-h-[44px]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg> Liderləri analiz et
                  </button>
                  <button
                    type="button"
                    onClick=${() => handleSendAiChat(null, "Bombardirlər və asist liderləri kimlərdir?")}
                    className="text-[10px] bg-purple-50 text-purple-900 hover:bg-purple-100 px-2.5 py-1 rounded-[8px] font-semibold transition min-h-[44px]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg> Bombardirlər
                  </button>
                  <button
                    type="button"
                    onClick=${() => handleSendAiChat(null, "Turnirdə hansı matçlar oynanılmayıb və ya çatışmır?")}
                    className="text-[10px] bg-purple-50 text-purple-900 hover:bg-purple-100 px-2.5 py-1 rounded-[8px] font-semibold transition min-h-[44px]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg> Çatışmayan matçlar
                  </button>
                </div>

                <!-- Chat Messages Scroll Area -->
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs tabular-nums tracking-tight">
                  ${aiChatHistory.length === 0 ? html`
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-2.5">
                      <i className="fas fa-robot text-3xl mb-2 text-purple-300"></i>
                      <p className="font-bold text-gray-600 text-xs tabular-nums tracking-tight">Turnir AI Köməkçisi Hazırdır</p>
                      <p className="text-[10px] text-gray-400 mt-1 max-w-xs">
                        Turnir gedişatı, xallar, matçlar və statistikalar barədə istənilən sualı yaza bilərsiniz.
                      </p>
                    </div>
                  ` : aiChatHistory.map((msg, i) => html`
                    <div key=${i} className=${`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className=${`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed ${ msg.role === 'user' ? 'bg-purple-950 text-white rounded-br-none' : 'bg-zinc-100 dark:bg-zinc-800 text-gray-800 rounded-bl-none whitespace-pre-line tabular-nums tracking-tight'
                      }`}>
                        ${msg.role === 'model' && html`
                          <div className="text-[9px] font-black uppercase text-purple-700 mb-1 flex items-center gap-1">
                            <i className="fas fa-robot"></i> Gemini AI
                          </div>
                        `}
                        ${msg.text}
                      </div>
                    </div>
                  `)}

                  ${isAiChatLoading && html`
                    <div className="flex justify-start">
                      <div className="bg-purple-50 text-purple-900 rounded-2xl p-2.5 text-xs rounded-bl-none flex items-center gap-2 tabular-nums tracking-tight">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>AI cavab hazırlayır...</span>
                      </div>
                    </div>
                  `}
                </div>

                <!-- Chat Input Form -->
                <form onSubmit=${(e) => handleSendAiChat(e)} className="pt-2 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    value=${aiChatQuery}
                    onChange=${(e) => setAiChatQuery(e.target.value)}
                    placeholder="Turnir haqqında sual yazın..."
                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs rounded-[8px] p-2.5.5 font-medium min-h-[44px] tabular-nums tracking-tight"
                    disabled=${isAiChatLoading}
                  />
                  <button
                    type="submit"
                    disabled=${isAiChatLoading || !aiChatQuery.trim()}
                    className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] bg-purple-950 hover:bg-purple-900 text-white font-bold px-4 text-xs transition disabled:opacity-50 tabular-nums tracking-tight"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>

              </div>

            </div>
          </div>
        </div>
      `}

      <!-- MODAL FOR EDITING PLAYER RATINGS FOR A SELECTED MATCH -->
      ${selectedMatchForRatings && html`
        <div className="fixed inset-0 z-50 overflow-y-auto bg-purple-950/40 backdrop-blur-sm flex items-center justify-center p-2.5">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fadeIn">
            
            <!-- Modal Header -->
            <div className="bg-purple-900 text-white p-5 rounded-t-3xl flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-green-400 uppercase tabular-nums tracking-tight">Matç Reytinqləri</span>
                <h4 className="text-lg font-black mt-1">
                  ${selectedMatchForRatings.teamA} vs ${selectedMatchForRatings.teamB} (${selectedMatchForRatings.stage})
                </h4>
              </div>
              <button
                onClick=${() => setSelectedMatchForRatings(null)}
                className="bg-purple-950 text-white hover:bg-red-600 transition w-8 h-8 rounded-full flex items-center justify-center font-bold tabular-nums tracking-tight"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <!-- Modal Content (Table input) -->
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-4 font-semibold tabular-nums tracking-tight">
                Matçda oynayan futbolçuların xallarını, qol/asist/ötürmə statistikalarını daxil edin.
              </p>
              
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-purple-50 text-[10px] font-black text-purple-950 uppercase tracking-wider border-b border-purple-100">
                      <th className="py-2.5 px-3">Oyunçu / Mövqe</th>
                      <th className="py-2.5 px-2 text-center">Sinif</th>
                      <th className="py-2.5 px-2 text-center w-24">Reytinq (boş=avtomatik)</th>
                      <th className="py-2.5 px-2 text-center w-14"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg>Qol</th>
                      <th className="py-2.5 px-2 text-center w-14"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg>Asist</th>
                      <th className="py-2.5 px-2 text-center w-14"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg>Qurt.</th>
                      <th className="py-2.5 px-2 text-center w-14"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg>Sarı</th>
                      <th className="py-2.5 px-2 text-center w-14"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block opacity-80 mr-1.5 align-middle"><circle cx="12" cy="12" r="10"/></svg>Qırm.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs tabular-nums tracking-tight">
                    ${matchPlayerStats.map(stat => html`
                      <tr key=${stat.playerId} className="hover:bg-purple-50/20 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-purple-950 tabular-nums tracking-tight">${stat.name}</div>
                          <div className="text-[10px] text-gray-400">${stat.position || '—'}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-500 font-bold tabular-nums tracking-tight">${stat.class}</td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="0.1"
                            placeholder="Auto"
                            value=${stat.rating ?? ''}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'rating', e.target.value === '' ? null : e.target.value)}
                            className="w-16 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center font-black rounded-[8px] p-2.5 text-purple-900 placeholder-gray-300 min-h-[44px]"
                          />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input type="number" min="0" value=${stat.goals}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'goals', e.target.value)}
                            className="w-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center rounded-[8px] p-2.5 min-h-[44px]" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input type="number" min="0" value=${stat.assists}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'assists', e.target.value)}
                            className="w-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center rounded-[8px] p-2.5 min-h-[44px]" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input type="number" min="0" value=${stat.saves}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'saves', e.target.value)}
                            className="w-12 bg-sky-50 border border-sky-200 text-center rounded-[8px] p-2.5 min-h-[44px]" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input type="number" min="0" value=${stat.yellowCards}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'yellowCards', e.target.value)}
                            className="w-12 bg-yellow-50 border border-yellow-200 text-center rounded-[8px] p-2.5 min-h-[44px]" />
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input type="number" min="0" value=${stat.redCards}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'redCards', e.target.value)}
                            className="w-12 bg-red-50 border border-red-200 text-center rounded-[8px] p-2.5 min-h-[44px]" />
                        </td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Modal Footer -->
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-b-3xl text-right space-x-2">
              <button
                onClick=${() => setSelectedMatchForRatings(null)}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold px-6 py-2.5 rounded-[8px] text-xs transition min-h-[44px] tabular-nums tracking-tight"
              >
                Ləğv Et
              </button>
              <button
                onClick=${handleSaveRatings}
                className="btn-spring active:scale-[0.98] min-h-[44px] -[8px] bg-purple-900 hover:bg-purple-800 text-white font-bold px-6 py-2.5 text-xs transition tabular-nums tracking-tight"
              >
                Yadda Saxla
              </button>
            </div>

          </div>
        </div>
      `}
    </div>
  `;
}
