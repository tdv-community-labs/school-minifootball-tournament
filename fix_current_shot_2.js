const fs = require('fs');
let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

const toReplace = `
    const allShots = analytics?.shots || [];
    const currentShot = allShots[selectedShotIndex];
    const goalCount = allShots.filter(s => s.outcome === 'goal').length;
    const saveCount = allShots.filter(s => s.outcome === 'saved').length;
    const shotsACount = allShots.filter(s => s.team === match.teamA).length;
    const shotsBCount = allShots.filter(s => s.team === match.teamB).length;
    const filteredShots = useMemo(() => {
      if (!match) return [];
      if (shotFilter === 'goal') return allShots.filter(s => s.outcome === 'goal');
      if (shotFilter === 'saved') return allShots.filter(s => s.outcome === 'saved');
      if (shotFilter === 'teamA') return allShots.filter(s => s.team === match.teamA);
      if (shotFilter === 'teamB') return allShots.filter(s => s.team === match.teamB);
      return allShots;
    }, [allShots, shotFilter, match]);
`;

const replacement = `
    const allShots = analytics?.shots || [];
    const goalCount = allShots.filter(s => s.outcome === 'goal').length;
    const saveCount = allShots.filter(s => s.outcome === 'saved').length;
    const shotsACount = allShots.filter(s => s.team === match.teamA).length;
    const shotsBCount = allShots.filter(s => s.team === match.teamB).length;
    const filteredShots = useMemo(() => {
      if (!match) return [];
      if (shotFilter === 'goal') return allShots.filter(s => s.outcome === 'goal');
      if (shotFilter === 'saved') return allShots.filter(s => s.outcome === 'saved');
      if (shotFilter === 'teamA') return allShots.filter(s => s.team === match.teamA);
      if (shotFilter === 'teamB') return allShots.filter(s => s.team === match.teamB);
      return allShots;
    }, [allShots, shotFilter, match]);
    const currentShot = filteredShots[selectedShotIndex] || filteredShots[0];
`;

if (code.includes(toReplace.trim())) {
    console.log("Found");
} else {
    console.log("Not found, replacing piece by piece");
    
    // Manual piece by piece
    const start = code.indexOf('const allShots = analytics?.shots || [];');
    const end = code.indexOf('}, [allShots, shotFilter, match]);') + '}, [allShots, shotFilter, match]);'.length;
    
    const block = code.substring(start, end);
    const newBlock = block.replace('const currentShot = allShots[selectedShotIndex];\n', '') + '\n    const currentShot = filteredShots[selectedShotIndex] || filteredShots[0];';
    
    code = code.substring(0, start) + newBlock + code.substring(end);
    fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
}
