const fs = require('fs');
let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

if (code.includes('const currentShot = allShots[selectedShotIndex];')) {
  code = code.replace(
    'const currentShot = allShots[selectedShotIndex];',
    '// currentShot is calculated after filteredShots'
  );
  code = code.replace(
    "const shotsBCount = allShots.filter(s => s.team === match.teamB).length;",
    "const shotsBCount = allShots.filter(s => s.team === match.teamB).length;\n  const filteredShots = useMemo(() => {\n    if (!match) return [];\n    if (shotFilter === 'goal') return allShots.filter(s => s.outcome === 'goal');\n    if (shotFilter === 'saved') return allShots.filter(s => s.outcome === 'saved');\n    if (shotFilter === 'teamA') return allShots.filter(s => s.team === match.teamA);\n    if (shotFilter === 'teamB') return allShots.filter(s => s.team === match.teamB);\n    return allShots;\n  }, [match, allShots, shotFilter]);\n  const currentShot = filteredShots[selectedShotIndex] || filteredShots[0];"
  );
  
  // Remove the old filteredShots definition
  const oldFilteredShotsStart = code.indexOf('const filteredShots = useMemo(() => {', code.indexOf('const currentShot = filteredShots'));
  if (oldFilteredShotsStart !== -1) {
    const oldFilteredShotsEnd = code.indexOf('}, [match, allShots, shotFilter]);', oldFilteredShotsStart) + '}, [match, allShots, shotFilter]);'.length;
    code = code.substring(0, oldFilteredShotsStart) + code.substring(oldFilteredShotsEnd);
  }

  fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
  console.log('Fixed currentShot mapping!');
} else {
  console.log('Could not find currentShot string.');
}
