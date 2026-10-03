const fs = require('fs');

let oldModal = fs.readFileSync('old_MatchAnalyticsModal.js', 'utf16le');

const povStart = oldModal.indexOf('<!-- TAB 1: ZƏRBƏLƏR & BİRLƏŞDİRİLMİŞ 3D QAPI POV STADİONU -->');
const povEnd = oldModal.indexOf('<!-- TAB 2: MEYDANÇA HEYƏTİ (LINEUP) -->');

const heatStart = oldModal.indexOf('<!-- TAB 3: İSTİLİK XƏRİTƏSİ (HEATMAP) -->');
const heatEnd = oldModal.indexOf('<!-- TAB 4: KOMANDA STATİSTİKALARI -->');

if (povStart !== -1 && povEnd !== -1 && heatStart !== -1 && heatEnd !== -1) {
  let povCode = oldModal.substring(povStart, povEnd).trim();
  let heatCode = oldModal.substring(heatStart, heatEnd).trim();
  
  // My current MatchAnalyticsModal.js
  let currModal = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');
  
  // Change old 'shotmap' id to 'pov'
  povCode = povCode.replace(/activeTab === 'shotmap'/g, "activeTab === 'pov'");
  
  // Inject into the nav tabs in current MatchAnalyticsModal.js
  currModal = currModal.replace(
    /\{ id: 'shotmap', label: 'Zərbə Xəritəsi \(Shotmap\)', icon: 'fa-crosshairs', badge: 'PRO' \},/,
    "{ id: 'shotmap', label: 'Zərbə Xəritəsi (2D)', icon: 'fa-crosshairs' },\n              { id: 'pov', label: '3D Qapı POV', icon: 'fa-bullseye', badge: 'PRO' },\n              { id: 'heatmap', label: 'İstilik Xəritəsi', icon: 'fa-fire-flame-curved' },"
  );
  
  // Inject the povCode and heatCode into the body
  currModal = currModal.replace(
    /<!--  TAB 5: VIDEO & YOUTUBE INTEGRATION  -->/,
    '            ' + povCode + '\n\n            ' + heatCode + '\n\n            <!--  TAB 5: VIDEO & YOUTUBE INTEGRATION  -->'
  );
  
  // Add state variables to the component if not exist
  if (!currModal.includes('const [heatmapFilter')) {
    currModal = currModal.replace(
      /const \[shotFilter, setShotFilter\] = useState\('all'\);/,
      "const [shotFilter, setShotFilter] = useState('all');\n  const [heatmapFilter, setHeatmapFilter] = useState('all');\n  const [selectedHeatmapPlayer, setSelectedHeatmapPlayer] = useState('');\n  const [copyFeedback, setCopyFeedback] = useState(false);"
    );
  }
  
  // Add derived variables needed by POV and Heatmap
  if (!currModal.includes('const allShots = analytics?.shots')) {
    currModal = currModal.replace(
      /const \[selectedShotIndex, setSelectedShotIndex\] = useState\(0\);/,
      `const [selectedShotIndex, setSelectedShotIndex] = useState(0);\n  const allShots = analytics?.shots || [];\n  const filteredShots = useMemo(() => { if (!match) return []; if (shotFilter === 'goal') return allShots.filter(s => s.outcome === 'goal'); if (shotFilter === 'saved') return allShots.filter(s => s.outcome === 'saved'); if (shotFilter === 'teamA') return allShots.filter(s => s.team === match.teamA); if (shotFilter === 'teamB') return allShots.filter(s => s.team === match.teamB); return allShots; }, [allShots, match, shotFilter]);\n  const currentShot = filteredShots[selectedShotIndex];\n  const goalCount = allShots.filter(s => s.outcome === 'goal').length;\n  const saveCount = allShots.filter(s => s.outcome === 'saved').length;\n  const shotsACount = allShots.filter(s => s.team === match.teamA).length;\n  const shotsBCount = allShots.filter(s => s.team === match.teamB).length;`
    );
  }
  
  fs.writeFileSync('components/MatchAnalyticsModal.js', currModal, 'utf8');
  console.log('Injected 3D POV and Heatmap successfully');
} else {
  console.log('Failed to find tabs in old modal');
}
