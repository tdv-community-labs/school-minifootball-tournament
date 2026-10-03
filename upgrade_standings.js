const fs = require('fs');

let standings = fs.readFileSync('components/Standings.js', 'utf8');

const getTeamFormOld = `const getTeamForm = (teamName) => {
    // Demo məqsədilə saxta data. Əslində matches array-indən hesablanmalıdır.
    return ['W', 'W', 'D', 'L', 'W'];
  };`;

const getTeamFormNew = `const getTeamForm = (teamName) => {
    if (!matches || matches.length === 0) return ['-','-','-','-','-'];
    // Filter matches for this team that have been played
    const teamMatches = matches
      .filter(m => (m.teamA === teamName || m.teamB === teamName) && m.scoreA !== null && m.scoreA !== '' && m.isPlayed !== false)
      .sort((a, b) => {
        // If no date, use id as fallback chronological sorting
        if (a.date && b.date) {
           // Basic string compare for dates, assuming format DD.MM.YYYY
           // This is just a fallback, usually ID works fine
        }
        return b.id.localeCompare(a.id); // descending, latest first
      })
      .slice(0, 5); // get last 5 matches

    if (teamMatches.length === 0) return ['-','-','-','-','-'];

    const form = teamMatches.map(m => {
      const isTeamA = m.teamA === teamName;
      const scoreTeam = isTeamA ? parseInt(m.scoreA) : parseInt(m.scoreB);
      const scoreOpp = isTeamA ? parseInt(m.scoreB) : parseInt(m.scoreA);
      
      if (scoreTeam > scoreOpp) return 'W';
      if (scoreTeam < scoreOpp) return 'L';
      return 'D';
    });
    
    // Pad to 5 if less than 5 matches played
    while (form.length < 5) form.push('-');
    return form.reverse(); // Display oldest to newest from left to right (standard)
  };`;

// Replace dummy form with real procedural form
if (standings.includes(getTeamFormOld)) {
  standings = standings.replace(getTeamFormOld, getTeamFormNew);
} else {
  // Try regex if spacing differs
  standings = standings.replace(/const getTeamForm = \(teamName\) => \{[\s\S]*?return \['W', 'W', 'D', 'L', 'W'\];\s*\};/, getTeamFormNew);
}

// Ensure row styles are upgraded
standings = standings.replace(
  /'srow-first'/,
  "'srow-first bg-gradient-to-r from-emerald-500/10 to-transparent border-l-4 border-emerald-500 shadow-[inset_0_1px_0_rgba(16,185,129,0.2)]'"
);
standings = standings.replace(
  /'srow-second'/,
  "'srow-second bg-gradient-to-r from-blue-500/10 to-transparent border-l-4 border-blue-500 shadow-[inset_0_1px_0_rgba(59,130,246,0.2)]'"
);

fs.writeFileSync('components/Standings.js', standings, 'utf8');
console.log('Real Form Guide and Standings rows upgraded');
