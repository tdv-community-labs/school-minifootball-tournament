const fs = require('fs');

// 1. Read old match analytics data
const oldDataStr = fs.readFileSync('old_matchAnalyticsData.js', 'utf8');

// We need to extract the heatmap and shots logic.
// The logic is inside getMatchAnalytics before return {...}
// It looks like:
// const heatmapData = { ... };
// lineupA.forEach(...)
// lineupB.forEach(...)
// const shots = []; ... for loops ...

const extractDataLogicRegex = /(const heatmapData = \{[\s\S]*?\}};\s*lineupA\.forEach[\s\S]*?lineupB\.forEach[\s\S]*?\}\);\s*const shots = \[\];[\s\S]*?\}\n)\s*return \{/m;
const matchDataMatch = oldDataStr.match(extractDataLogicRegex);

if (matchDataMatch) {
  const dataLogic = matchDataMatch[1];
  
  let currData = fs.readFileSync('services/matchAnalyticsData.js', 'utf8');
  
  // Inject into current
  currData = currData.replace(
    /return \{\s*matchId:/,
    dataLogic + '\n  return {\n    matchId:'
  );
  
  // Update the return object to include the populated variables
  currData = currData.replace(
    /heatmapData: \{ teamA: \[\], teamB: \[\], playerHeatmaps: \{\} \},\s*shots: \[\]/,
    'heatmapData,\n    shots'
  );
  
  fs.writeFileSync('services/matchAnalyticsData.js', currData, 'utf8');
  console.log('Injected heatmap and shots logic into matchAnalyticsData.js');
} else {
  console.log('Failed to extract data logic');
}
