const fs = require('fs');
let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// 1. Remove DIV A
const startTag = '<div className="bg-transparent/90 border border-white/10 rounded-2xl p-5 space-y-6 overflow-hidden relative">';
const endTag = '<!-- MERGED 3D POV COMPONENT -->';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag) + endTag.length;

if (startIndex !== -1 && endIndex !== -1) {
  const blockToRemove = code.substring(startIndex, endIndex);
  code = code.replace(blockToRemove, '');
  console.log('Fixed DIV A');
}

// 2. Remove illegal HTML comments
const badComments = `
                        <!-- ================================================================= -->
            <!-- TAB 1: ZƏRBƏLƏR & BİRLƏŞDİRİLMİŞ 3D QAPI POV STADİONU -->
          <!-- ================================================================= -->
          `;
if (code.includes('<!-- TAB 1: ZƏRBƏLƏR')) {
  code = code.replace(badComments, '');
  console.log('Fixed illegal comments');
}

// 3. Fix currentShot
if (code.includes('const currentShot = allShots[selectedShotIndex];')) {
  // Replace the old assignment
  code = code.replace(
    'const currentShot = allShots[selectedShotIndex];',
    'const currentShotIndex = selectedShotIndex;' // placeholder
  );
  
  // Find where filteredShots is defined
  const filteredDef = `const filteredShots = useMemo(() => {
    if (!match) return [];
    if (shotFilter === 'goal') return allShots.filter(s => s.outcome === 'goal');
    if (shotFilter === 'saved') return allShots.filter(s => s.outcome === 'saved');
    if (shotFilter === 'teamA') return allShots.filter(s => s.team === match.teamA);
    if (shotFilter === 'teamB') return allShots.filter(s => s.team === match.teamB);
    return allShots;
  }, [allShots, shotFilter, match]);`;
  
  if (code.includes(filteredDef)) {
    code = code.replace(
      filteredDef,
      filteredDef + '\n  const currentShot = filteredShots[currentShotIndex] || filteredShots[0];'
    );
    console.log('Fixed currentShot mapping');
  } else {
    console.log('Could not find filteredDef');
  }
}

fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
