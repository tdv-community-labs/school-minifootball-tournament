const fs = require('fs');

let code = fs.readFileSync('components/MatchPlayerProfileModal.js', 'utf8');

// Replace style=${{ width: \`\${(50 - b.val) * 2}%\`, transformOrigin: 'right', transform: \`scaleX(\${animTrigger ? 1 : 0})\` }}
code = code.replace(
  /style=\$\{\{ width: \\`\\\$([^`]+)\\`([^`]+)\\`\\\$([^`]+)\\` \}\}/g,
  "style=${{ width: $1 + '%', $2 + 'scaleX(' + $3 + ')' }}" // this is too complex and flaky. Let's just do manual string replace.
);

code = code.replace(
  /style=\$\{\{ width: \\`\\\$([^{]+)\}\}%\\`, transformOrigin: 'right', transform: \\`scaleX\(\\\$\{(animTrigger \? 1 : 0)\}\)\\` \}\}/g,
  "style=${{ width: (($1)) + '%', transformOrigin: 'right', transform: (animTrigger ? 'scaleX(1)' : 'scaleX(0)') }}"
);

code = code.replace(
  /style=\$\{\{ width: \\`\\\$([^{]+)\}\}%\\`, transformOrigin: 'left', transform: \\`scaleX\(\\\$\{(animTrigger \? 1 : 0)\}\)\\` \}\}/g,
  "style=${{ width: (($1)) + '%', transformOrigin: 'left', transform: (animTrigger ? 'scaleX(1)' : 'scaleX(0)') }}"
);


// Replace Heatmap glow blobs styles
code = code.replace(
  /style=\$\{\{ left: \\`\\\$\{(player\.x - 10)\}%\\`, top: \\`\\\$\{(player\.y - 10)\}%\\` \}\}/g,
  "style=${{ left: (player.x - 10) + '%', top: (player.y - 10) + '%' }}"
);
code = code.replace(
  /style=\$\{\{ left: \\`\\\$\{(player\.x - 5)\}%\\`, top: \\`\\\$\{(player\.y - 5)\}%\\` \}\}/g,
  "style=${{ left: (player.x - 5) + '%', top: (player.y - 5) + '%' }}"
);

// Replace x1, y1 etc in lines
code = code.replace(
  /x1=\$\{\\`\\\$\{p\.px\}%\\`\} y1=\$\{\\`\\\$\{p\.py\}%\\`\} x2=\$\{\\`\\\$\{p\.tx\}%\\`\} y2=\$\{\\`\\\$\{p\.ty\}%\\`\}/g,
  "x1=${p.px + '%'} y1=${p.py + '%'} x2=${p.tx + '%'} y2=${p.ty + '%'}"
);

// Replace line animation
code = code.replace(
  /style=\$\{\{ animation: \\`drawArrow 0\.5s ease-out \\\$\{i \* 0\.05\}s both\\` \}\}/g,
  "style=${{ animation: 'drawArrow 0.5s ease-out ' + (i * 0.05) + 's both' }}"
);

// Replace dot animation
code = code.replace(
  /style=\$\{\{ left: \\`\\\$\{p\.px\}%\\`, top: \\`\\\$\{p\.py\}%\\`, animation: \\`popIn 0\.3s cubic-bezier\(0\.175, 0\.885, 0\.32, 1\.275\) \\\$\{i \* 0\.1\}s both\\` \}\}/g,
  "style=${{ left: p.px + '%', top: p.py + '%', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ' + (i * 0.1) + 's both' }}"
);

code = code.replace(
  /style=\$\{\{ left: \\`\\\$\{p\.px\}%\\`, top: \\`\\\$\{p\.py\}%\\`, animation: \\`popIn 0\.3s cubic-bezier\(0\.175, 0\.885, 0\.32, 1\.275\) \\\$\{i \* 0\.05\}s both\\` \}\}/g,
  "style=${{ left: p.px + '%', top: p.py + '%', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) ' + (i * 0.05) + 's both' }}"
);


fs.writeFileSync('components/MatchPlayerProfileModal.js', code, 'utf8');
console.log('Fixed syntax backticks in MatchPlayerProfileModal');
