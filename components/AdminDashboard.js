import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { db } from '../services/database.js';

const html = htm.bind(React.createElement);

export default function AdminDashboard({ activeDivision, activeYear, onYearsChanged, onLogout }) {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [yearsList, setYearsList] = useState([]);
  const [newYearInput, setNewYearInput] = useState('');
  const [adminTab, setAdminTab] = useState('matches'); // 'matches', 'players', 'classes', 'years', 'system'

  // Class Form State
  const [classForm, setClassForm] = useState({ id: null, name: '', division: '11' });

  // Player Form State
  const [playerForm, setPlayerForm] = useState({ id: null, name: '', class: '', position: 'Hücumçu' });
  const [editingPlayer, setEditingPlayer] = useState(false);

  // Match Form State
  const [matchForm, setMatchForm] = useState({
    id: null,
    stage: 'Qrup Mərhələsi',
    division: '11',
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

  useEffect(() => {
    loadAdminData();
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
        rating: existingStat ? existingStat.rating : 6.0,
        goals: existingStat ? existingStat.goals : 0,
        assists: existingStat ? existingStat.assists : 0,
        passes: existingStat ? existingStat.passes : 0
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
    
    const formattedStats = matchPlayerStats.map(stat => ({
      playerId: stat.playerId,
      rating: Number(stat.rating),
      goals: Number(stat.goals),
      assists: Number(stat.assists),
      passes: Number(stat.passes)
    }));

    const updatedMatch = {
      ...selectedMatchForRatings,
      playerStats: formattedStats
    };

    await db.updateMatch(updatedMatch);
    setSelectedMatchForRatings(null);
    loadAdminData();
    alert("Oyunçu reytinqləri uğurla yadda saxlanıldı!");
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

  // Dynamic lists based on form choices
  const classesForSelectedMatchDivision = classes.filter(c => c.division === matchForm.division).sort((a,b)=>a.name.localeCompare(b.name));
  
  const getDivisionLabel = (div) => {
    if (div === '6') return '6-cı Siniflər';
    if (div === '7-8') return '7-8-ci Siniflər';
    if (div === '9-10') return '9-10-cu Siniflər';
    return '11-ci Siniflər';
  };

  return html`
    <div className="space-y-6 animate-fadeIn">
      <!-- Title -->
      <div>
        <h2 className="text-2xl font-black text-purple-950 font-sans">Admin Panel</h2>
        <p className="text-sm text-gray-500">TDV BTL Futbol Turnirinin idarə edilməsi</p>
      </div>

      <!-- Navigation Tabs -->
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick=${() => setAdminTab('matches')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${
            adminTab === 'matches' 
              ? 'border-purple-900 text-purple-950' 
              : 'border-transparent text-gray-500 hover:text-purple-950'
          }`}
        >
          Oyunlar / Hesablar
        </button>
        <button
          onClick=${() => setAdminTab('players')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${
            adminTab === 'players' 
              ? 'border-purple-900 text-purple-950' 
              : 'border-transparent text-gray-500 hover:text-purple-950'
          }`}
        >
          Oyunçular
        </button>
        <button
          onClick=${() => setAdminTab('classes')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${
            adminTab === 'classes' 
              ? 'border-purple-900 text-purple-950' 
              : 'border-transparent text-gray-500 hover:text-purple-950'
          }`}
        >
          Siniflər
        </button>
        <button
          onClick=${() => setAdminTab('years')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${
            adminTab === 'years' 
              ? 'border-purple-900 text-purple-950' 
              : 'border-transparent text-gray-500 hover:text-purple-950'
          }`}
        >
          Tədris İlləri
        </button>
        <button
          onClick=${() => setAdminTab('system')}
          className=${`py-2.5 px-4 font-bold text-xs uppercase tracking-wide border-b-2 transition whitespace-nowrap ${
            adminTab === 'system' 
              ? 'border-purple-900 text-purple-950' 
              : 'border-transparent text-gray-500 hover:text-purple-950'
          }`}
        >
          Sistem
        </button>
      </div>

      <!-- TAB 1: MATCH MANAGEMENT -->
      ${adminTab === 'matches' && html`
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left: Add/Edit Match form -->
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">
              ${editingMatch ? 'Matçı Redaktə Et' : 'Yeni Matç Əlavə Et'}
            </h3>
            <form onSubmit=${handleSaveMatch} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Turnir Qrupu (Division)</label>
                <select
                  value=${matchForm.division}
                  onChange=${(e) => setMatchForm({ ...matchForm, division: e.target.value, teamA: '', teamB: '' })}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold"
                >
                  <option value="6">6-cı Siniflər</option>
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
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold text-purple-950"
                >
                  <option value="Qrup Mərhələsi">Qrup Mərhələsi</option>
                  <option value="16/1 Final">16/1 Final</option>
                  <option value="8/1 Final">8/1 Final</option>
                  <option value="4/1 Final">4/1 Final</option>
                  <option value="Yarımfinal">Yarımfinal</option>
                  <option value="Final">Final</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Ev Sahibi</label>
                  <select
                    required
                    value=${matchForm.teamA}
                    onChange=${(e) => setMatchForm({ ...matchForm, teamA: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold"
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
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold"
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
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
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
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
                  />
                </div>
              </div>

              ${matchForm.scoreA === matchForm.scoreB && html`
                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100/50 space-y-2 animate-fadeIn">
                  <p className="text-[9px] font-black text-purple-900 uppercase tracking-widest">Penaltilər (Heç-heçə)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        placeholder="Ev (Pen.)"
                        min="0"
                        value=${matchForm.penaltyScoreA}
                        onChange=${(e) => setMatchForm({ ...matchForm, penaltyScoreA: e.target.value })}
                        className="w-full bg-white border border-gray-200 text-xs rounded-xl p-2 text-center font-bold"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Qonaq (Pen.)"
                        min="0"
                        value=${matchForm.penaltyScoreB}
                        onChange=${(e) => setMatchForm({ ...matchForm, penaltyScoreB: e.target.value })}
                        className="w-full bg-white border border-gray-200 text-xs rounded-xl p-2 text-center font-bold"
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
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Video Link (YouTube Embed)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/embed/..."
                  value=${matchForm.videoUrl}
                  onChange=${(e) => setMatchForm({ ...matchForm, videoUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-900 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-800 transition"
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
                    className="bg-gray-150 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-gray-200 transition"
                  >
                    Ləğv Et
                  </button>
                `}
              </div>
            </form>
          </div>

          <!-- Right: Matches list -->
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
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
              <tbody className="divide-y divide-gray-100 text-xs">
                ${matches.map(m => html`
                  <tr key=${m.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 text-center font-bold text-green-700 bg-green-50 rounded px-1.5">${m.division}</td>
                    <td className="py-3 font-semibold text-gray-500">${m.stage}</td>
                    <td className="py-3 font-extrabold text-purple-950">${m.teamA} vs ${m.teamB}</td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="bg-purple-950 text-white font-bold px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
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
                        className="bg-green-100 text-green-800 font-bold px-2 py-1 rounded hover:bg-green-200 transition text-[10px]"
                      >
                        🏅 Reytinq
                      </button>
                      <button
                        onClick=${() => handleEditMatchClick(m)}
                        className="bg-purple-100 text-purple-900 font-bold px-2 py-1 rounded hover:bg-purple-200 transition text-[10px]"
                      >
                        Düzəliş
                      </button>
                      <button
                        onClick=${() => handleDeleteMatch(m.id)}
                        className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-200 transition text-[10px]"
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
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
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
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Sinif</label>
                <select
                  required
                  value=${playerForm.class}
                  onChange=${(e) => setPlayerForm({ ...playerForm, class: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold text-purple-950"
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
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold text-purple-950"
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
                  className="flex-1 bg-purple-900 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-800 transition"
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
                    className="bg-gray-150 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs hover:bg-gray-200 transition"
                  >
                    Ləğv Et
                  </button>
                `}
              </div>
            </form>
          </div>

          <!-- Right: Players list -->
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
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
              <tbody className="divide-y divide-gray-100 text-xs">
                ${players.map(p => html`
                  <tr key=${p.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 font-extrabold text-purple-950">${p.name}</td>
                    <td className="py-3 text-center text-purple-900 font-bold">${p.class}</td>
                    <td className="py-3 text-center text-gray-500 font-semibold">${p.division}</td>
                    <td className="py-3 text-center text-gray-500">${p.position}</td>
                    <td className="py-3 text-center font-bold">${p.matchesPlayed}</td>
                    <td className="py-3 text-center font-semibold text-gray-600">${p.goals} / ${p.assists}</td>
                    <td className="py-3 text-center font-black text-purple-900">${p.overallRating}</td>
                    <td className="py-3 text-right space-x-2">
                      <button
                        onClick=${() => handleEditPlayerClick(p)}
                        className="bg-purple-100 text-purple-900 font-bold px-2 py-1 rounded hover:bg-purple-200 transition text-[10px]"
                      >
                        Redaktə
                      </button>
                      <button
                        onClick=${() => handleDeletePlayer(p.id)}
                        className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-200 transition text-[10px]"
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
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
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
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Qrup (Division)</label>
                <select
                  value=${classForm.division}
                  onChange=${(e) => setClassForm({ ...classForm, division: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold text-purple-950"
                >
                  <option value="6">6-cı Siniflər</option>
                  <option value="7-8">7-8-ci Siniflər</option>
                  <option value="9-10">9-10-cu Siniflər</option>
                  <option value="11">11-ci Siniflər</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-purple-900 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-800 transition"
                >
                  Sinif Əlavə Et
                </button>
              </div>
            </form>
          </div>

          <!-- Right: Classes list -->
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <h3 className="text-base font-extrabold text-purple-950 mb-4">Sinif Siyahısı</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Sinif</th>
                  <th className="pb-3 text-center">Turnir Qrupu</th>
                  <th className="pb-3 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                ${classes.map(c => html`
                  <tr key=${c.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 font-extrabold text-purple-950 text-sm">${c.name}</td>
                    <td className="py-3 text-center">
                      <span className="bg-purple-100 text-purple-950 font-bold px-3 py-1 rounded-full text-[10px]">
                        ${getDivisionLabel(c.division)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick=${() => handleDeleteClass(c.id)}
                        className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-200 transition text-[10px]"
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
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
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
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold"
                />
                <p className="text-[10px] text-gray-400 mt-1">İl formatını "YYYY-YYYY" şəklində yazmağınız tövsiyə olunur.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-purple-900 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-purple-800 transition"
                >
                  Tədris İli Əlavə Et
                </button>
              </div>
            </form>
          </div>

          <!-- Right: Years list -->
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
            <h3 className="text-base font-extrabold text-purple-950 mb-4 font-sans">Mövcud Tədris İlləri</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="pb-3">Tədris İli</th>
                  <th className="pb-3 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                ${yearsList.map(y => html`
                  <tr key=${y} className="hover:bg-purple-50/20 transition">
                    <td className="py-3 font-extrabold text-purple-950 text-sm flex items-center">
                      <i className="fas fa-calendar-alt text-purple-900 mr-2 text-sm"></i>
                      <span>${y}</span>
                      ${y === activeYear && html`
                        <span className="ml-2 bg-green-100 text-green-800 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Aktiv</span>
                      `}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick=${() => handleDeleteYear(y)}
                        className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded hover:bg-red-200 transition text-[10px]"
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
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-lg">
          <h3 className="text-base font-extrabold text-purple-950 mb-4">Sistem Parametrləri</h3>
          <div className="space-y-4 text-xs font-semibold text-gray-600">
            <p>
              TDV BTL Futbol Turniri məlumatlarının idarə edilməsi üçün sistem alətləri:
            </p>
            <div className="bg-purple-50 text-purple-950 border border-purple-100 rounded-2xl p-4 space-y-2">
              <h4 className="font-extrabold text-sm text-purple-900">Məlumatların idarə olunması qaydası</h4>
              <p className="text-[11px] leading-relaxed">
                İstənilən matç əlavə edildikdə və ya silindikdə siniflər üzrə turnir cədvəli və oyunçu statistikaları avtomatik yenidən hesablanır. Yalnız 'Qrup Mərhələsi' matçlarının xalları turnir cədvəlinə yazılır.
              </p>
            </div>
            
            <div className="pt-4 flex flex-col space-y-3">
              <button
                onClick=${handleResetSystem}
                className="bg-red-600 text-white font-bold py-3 rounded-2xl text-xs hover:bg-red-700 transition shadow-sm"
              >
                <i className="fas fa-trash-alt mr-2"></i> Sistem Məlumatlarını Sıfırla (Default Seeding)
              </button>
              <p className="text-[10px] text-gray-400 text-center">
                Qeyd: Sıfırlanma nəticəsində əvvəlki mock turnir məlumatları (20+ oyunçu, 14+ sinif və 8 oyun) bərpa olunacaqdır.
              </p>
              
              <div className="border-t border-gray-200 my-2"></div>
              
              <button
                onClick=${handleLogout}
                className="bg-purple-950 text-white font-bold py-3 rounded-2xl text-xs hover:bg-purple-900 transition shadow-sm"
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

      <!-- MODAL FOR EDITING PLAYER RATINGS FOR A SELECTED MATCH -->
      ${selectedMatchForRatings && html`
        <div className="fixed inset-0 z-50 overflow-y-auto bg-purple-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fadeIn">
            
            <!-- Modal Header -->
            <div className="bg-purple-900 text-white p-5 rounded-t-3xl flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-green-400 uppercase">Matç Reytinqləri</span>
                <h4 className="text-lg font-black mt-1">
                  ${selectedMatchForRatings.teamA} vs ${selectedMatchForRatings.teamB} (${selectedMatchForRatings.stage})
                </h4>
              </div>
              <button
                onClick=${() => setSelectedMatchForRatings(null)}
                className="bg-purple-950 text-white hover:bg-red-600 transition w-8 h-8 rounded-full flex items-center justify-center font-bold"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <!-- Modal Content (Table input) -->
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-4 font-semibold">
                Matçda oynayan futbolçuların xallarını, qol/asist/ötürmə statistikalarını daxil edin.
              </p>
              
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-purple-50 text-[10px] font-black text-purple-950 uppercase tracking-wider border-b border-purple-100">
                      <th className="py-2.5 px-4">Oyunçu</th>
                      <th className="py-2.5 px-4 text-center">Sinif</th>
                      <th className="py-2.5 px-4 text-center w-24">Reytinq (0-10)</th>
                      <th className="py-2.5 px-4 text-center w-16">Qol</th>
                      <th className="py-2.5 px-4 text-center w-16">Asist</th>
                      <th className="py-2.5 px-4 text-center w-20">Ötürmə</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    ${matchPlayerStats.map(stat => html`
                      <tr key=${stat.playerId} className="hover:bg-purple-50/20 transition">
                        <td className="py-3 px-4 font-bold text-purple-950">${stat.name}</td>
                        <td className="py-3 px-4 text-center text-gray-500 font-bold">${stat.class}</td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value=${stat.rating}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'rating', e.target.value)}
                            className="w-16 bg-gray-50 border border-gray-200 text-center font-black rounded-lg p-1 text-purple-900"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value=${stat.goals}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'goals', e.target.value)}
                            className="w-12 bg-gray-50 border border-gray-200 text-center rounded-lg p-1"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value=${stat.assists}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'assists', e.target.value)}
                            className="w-12 bg-gray-50 border border-gray-200 text-center rounded-lg p-1"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            value=${stat.passes}
                            onChange=${(e) => handlePlayerStatChange(stat.playerId, 'passes', e.target.value)}
                            className="w-14 bg-gray-50 border border-gray-200 text-center rounded-lg p-1"
                          />
                        </td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Modal Footer -->
            <div className="p-4 bg-gray-50 rounded-b-3xl text-right space-x-2">
              <button
                onClick=${() => setSelectedMatchForRatings(null)}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300 font-bold px-6 py-2.5 rounded-xl text-xs transition"
              >
                Ləğv Et
              </button>
              <button
                onClick=${handleSaveRatings}
                className="bg-purple-900 hover:bg-purple-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
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
