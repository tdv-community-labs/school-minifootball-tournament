const fs = require('fs');

let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// 1. Add missing variables if they are not there
if (!code.includes('const goalCount =')) {
  code = code.replace(
    /const allShots = analytics\?\.shots \|\| \[\];/,
    `const allShots = analytics?.shots || [];
  const currentShot = allShots[selectedShotIndex];
  const goalCount = allShots.filter(s => s.outcome === 'goal').length;
  const saveCount = allShots.filter(s => s.outcome === 'saved').length;
  const shotsACount = allShots.filter(s => s.team === match.teamA).length;
  const shotsBCount = allShots.filter(s => s.team === match.teamB).length;`
  );
}

// 2. Remove the "pov" tab from navigation
code = code.replace(
  /\{\s*id:\s*'pov'[\s\S]*?\},\s*/,
  ""
);

// 3. Rename 'shotmap' tab to 'Zərbələr (2D & 3D)'
code = code.replace(
  /\{ id: 'shotmap', label: 'Zərbə Xəritəsi \(2D\)'([^}]*)\}/,
  "{ id: 'shotmap', label: 'Zərbələr (2D & 3D)'$1}"
);

// 4. Merge 'pov' rendering block into 'shotmap' block
// We need to extract the 'pov' block, delete it, and append its inner content to 'shotmap' block
const povStartStr = "${activeTab === 'pov' && html`";
const povStartIndex = code.indexOf(povStartStr);

if (povStartIndex !== -1) {
  // Find the end of the pov block. It ends with: `}
  let povEndIndex = code.indexOf('`}', povStartIndex);
  if (povEndIndex !== -1) {
    // Extract everything between the start and end (excluding the template literal markers)
    let povInnerCode = code.substring(povStartIndex + povStartStr.length, povEndIndex);
    
    // Remove the pov block from code
    code = code.substring(0, povStartIndex) + code.substring(povEndIndex + 2);
    
    // Now insert povInnerCode at the end of the shotmap block
    const shotmapStartStr = "${activeTab === 'shotmap' && html`";
    const shotmapStartIndex = code.indexOf(shotmapStartStr);
    
    if (shotmapStartIndex !== -1) {
      // Find the end of the shotmap block
      // The shotmap block might contain inner template literals, but since we know it ends right before the next tab or end of tabs, we can find it.
      // Or we can just find the matching `} that closes the shotmap block.
      // Since html`...` doesn't have nested `} unless it's in a JS expression, we can search for `} followed by \n or whitespace and ${activeTab
      let shotmapEndIndex = code.indexOf('`}\n', shotmapStartIndex);
      if (shotmapEndIndex === -1) shotmapEndIndex = code.indexOf('`}\r\n', shotmapStartIndex);
      if (shotmapEndIndex === -1) shotmapEndIndex = code.indexOf('`}', shotmapStartIndex + 500); // fallback
      
      if (shotmapEndIndex !== -1) {
        // Insert a divider and the pov code
        const divider = '\n\n                <!-- ================================================================= -->\n                <!-- MERGED 3D POV COMPONENT -->\n                <!-- ================================================================= -->\n';
        code = code.substring(0, shotmapEndIndex) + divider + povInnerCode + code.substring(shotmapEndIndex);
      }
    }
  }
}

fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
console.log('Fixed variables and merged POV into shotmap');
