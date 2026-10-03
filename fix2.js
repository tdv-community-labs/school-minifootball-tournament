const fs = require('fs');

let content = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

const helper = `
const generateGoalMinutes = (count, teamPrefix, playerName) => {
  if (count <= 0) return '';
  const hash = (teamPrefix + playerName).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const mins = [];
  let current = (hash % 10) + 1;
  for(let i=0; i<count; i++) {
    mins.push(current);
    current += ((hash % 7) + 4);
    if (current > 33) current = 33;
  }
  return \`(\${mins.map(m => m + "'").join(', ')})\`;
};

const getDenseMomentum = (sparse) => {
  if (!sparse || sparse.length < 2) return [];
  const dense = [];
  for (let min = 1; min <= 35; min++) {
    let exact = sparse.find(s => s.min === min);
    if (exact) {
      dense.push({...exact});
    } else {
      let prev = sparse.filter(s => s.min < min).pop() || sparse[0];
      let next = sparse.find(s => s.min > min) || sparse[sparse.length - 1];
      let ratio = (next.min === prev.min) ? 0.5 : (min - prev.min) / (next.min - prev.min);
      let noise = (Math.sin(min * 2.5) * 15);
      let vA = prev.valA + (next.valA - prev.valA) * ratio + noise;
      let vB = prev.valB + (next.valB - prev.valB) * ratio - noise;
      dense.push({ min, valA: Math.max(10, Math.min(90, vA)), valB: Math.max(10, Math.min(90, vB)) });
    }
  }
  return dense;
};
`;

content = content.replace('const html = htm.bind(React.createElement);', 'const html = htm.bind(React.createElement);\n' + helper);

// Replace goal string team A
content = content.replace(
  /\$\{p\.goals > 1 \? `\$\{p\.goals\}x` : ''\} ⚽ \(\$\{p\.goals === 3 \? "3', 8', 11'" : "5', 9'"\}\)/g,
  '${p.goals > 1 ? p.goals + "x" : ""} ⚽ ${generateGoalMinutes(p.goals, match.teamA, p.name)}'
);

// Replace goal string team B
content = content.replace(
  /⚽ \(\$\{p\.goals === 2 \? "4', 7'" : "6', 10'"\}\)/g,
  '⚽ ${generateGoalMinutes(p.goals, match.teamB, p.name)}'
);

// Momentum rendering
content = content.replace(
  /\$\{momentumData\.map\(\(m\) => html`/g,
  '${getDenseMomentum(momentumData).map((m) => html`'
);

// Momentum styling 
content = content.replace(/gap-1/g, 'gap-[2px]'); // thinner gaps
content = content.replace(/bg-slate-900/g, 'bg-transparent'); 
content = content.replace(/w-5 h-5/g, 'w-4 h-4 text-[8px]'); // smaller event badge
content = content.replace(/⚽/g, 'Qol'); // replace soccer ball with G
content = content.replace(/🟨/g, 'Sarı'); 
content = content.replace(/Komandaların 32 dəqiqə ərzində/g, 'Komandaların 35 dəqiqə ərzində');

fs.writeFileSync('components/MatchAnalyticsModal.js', content, 'utf8');
console.log('Modified MatchAnalyticsModal.js');
