const fs = require('fs');

let oldDataStr = fs.readFileSync('old_matchAnalyticsData.js', 'utf8');

const startIndex = oldDataStr.indexOf('const heatmapData = {');
const endIndex = oldDataStr.indexOf('  return {');

if (startIndex !== -1 && endIndex !== -1) {
  const dataLogic = oldDataStr.substring(startIndex, endIndex);
  
  let currData = fs.readFileSync('services/matchAnalyticsData.js', 'utf8');
  currData = currData.replace(
    /  return \{/,
    dataLogic + '\n  return {'
  );
  
  currData = currData.replace(
    /heatmapData: \{ teamA: \[\], teamB: \[\], playerHeatmaps: \{\} \},\s*shots: \[\]/,
    'heatmapData,\n    shots'
  );
  
  fs.writeFileSync('services/matchAnalyticsData.js', currData, 'utf8');
  console.log('Injected properly via substring');
} else {
  console.log('Indexes not found. start: ' + startIndex + ' end: ' + endIndex);
}
