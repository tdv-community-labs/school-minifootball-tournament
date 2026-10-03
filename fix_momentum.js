const fs = require('fs');
let content = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// 1. Replace the referee default name
content = content.replace(/\|\| 'Mohammad Al-Emara'/g, "|| 'N/A'");

// 2. We need to extract the exact old helper block and replace it.
// Let's use precise index slicing.
let startStr = 'const generateGoalMinutes = ';
let endStr = 'return dense;\n};';

let startIndex = content.indexOf(startStr);
let endIndex = content.indexOf(endStr) + endStr.length;

if (startIndex === -1 || content.indexOf(endStr) === -1) {
  console.log("Could not find exact old helper block. Here is the block it found:");
  console.log(content.substring(startIndex, startIndex + 500));
} else {

const newHelper = `
const getGoalMinutesArray = (count, teamPrefix, playerName) => {
  if (count <= 0) return [];
  const hash = (teamPrefix + playerName).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const mins = [];
  let current = (hash % 14) + 2;
  for(let i=0; i<count; i++) {
    mins.push(current);
    current += ((hash % 10) + 7);
    if (current > 35) current = 35 - (hash % 3);
  }
  return mins.sort((a,b) => a-b);
};

const generateGoalMinutes = (count, teamPrefix, playerName) => {
  if (count <= 0) return '';
  const mins = getGoalMinutesArray(count, teamPrefix, playerName);
  return \`(\${mins.map(m => m + "'").join(', ')})\`;
};

const getAllGoalEvents = (analytics, match) => {
  const events = [];
  if (!analytics) return events;
  (analytics.lineupA || []).forEach(p => {
    if (p.goals > 0) {
      getGoalMinutesArray(p.goals, match.teamA, p.name).forEach(m => events.push({ min: m, team: 'A', type: 'goal' }));
    }
  });
  (analytics.lineupB || []).forEach(p => {
    if (p.goals > 0) {
      getGoalMinutesArray(p.goals, match.teamB, p.name).forEach(m => events.push({ min: m, team: 'B', type: 'goal' }));
    }
  });
  return events;
};

const getDenseMomentum = (sparse, analytics, match) => {
  if (!sparse || sparse.length < 2) return [];
  const dense = [];
  const STEPS = 105; 
  const goalEvents = getAllGoalEvents(analytics, match);
  
  for (let i = 1; i <= STEPS; i++) {
    let min = i / 3;
    let prev = sparse.filter(s => s.min <= min).pop() || sparse[0];
    let next = sparse.find(s => s.min > min) || sparse[sparse.length - 1];
    let ratio = (next.min === prev.min) ? 0.5 : (min - prev.min) / (next.min - prev.min);
    let noise = (Math.sin(i * 0.4) * 10) + (Math.cos(i * 0.15) * 15);
    
    let vA = prev.valA + (next.valA - prev.valA) * ratio + noise;
    let vB = prev.valB + (next.valB - prev.valB) * ratio - noise;
    
    let eventObj = null;
    let matchingEvent = goalEvents.find(e => e.min === Math.ceil(min));
    if (matchingEvent && i % 3 === 1) { 
      eventObj = matchingEvent;
    }

    dense.push({ 
      step: i, 
      min: min, 
      valA: Math.max(5, Math.min(95, vA)), 
      valB: Math.max(5, Math.min(95, vB)),
      event: eventObj
    });
  }
  return dense;
};`;

  content = content.substring(0, startIndex) + newHelper.trim() + content.substring(endIndex);
  
  // Also we want to ensure the event marker looks clean without emoji
  // The user said they still want 105 bars and NO weird emoji.
  content = content.replace(
    /\$\{m\.event \? html`[\s\S]*?` : null\}/g,
    `\${m.event ? html\`
      <div className="absolute top-1/2 -translate-y-1/2 z-20 \${m.event.team === 'A' ? 'bg-red-500' : 'bg-sky-500'} w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.8)] border border-white/50"></div>
    \` : null}`
  );
  
  fs.writeFileSync('components/MatchAnalyticsModal.js', content, 'utf8');
  console.log("Success");
}
