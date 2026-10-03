const fs = require('fs');

let modal = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// 1. Add handleTabChange
if (!modal.includes('handleTabChange')) {
  modal = modal.replace(
    /const \[activeTab, setActiveTab\] = useState\('lineup'\);/,
    `const [activeTab, setActiveTabState] = useState('lineup');
  
  const handleTabChange = (tabId) => {
    if (!document.startViewTransition) {
      setActiveTabState(tabId);
      return;
    }
    document.startViewTransition(() => setActiveTabState(tabId));
  };`
  );
  
  modal = modal.replace(
    /onClick=\$\{.*?setActiveTab\(tab\.id\)\}/g,
    'onClick=${() => handleTabChange(tab.id)}'
  );
}

// 2. Upgrade Modal Container styling (Glassmorphism & Advanced borders)
modal = modal.replace(
  /className="w-full max-w-6xl mx-auto h-\[100dvh\] sm:h-\[92vh\] bg-\[\#0b0e14\] text-slate-100 rounded-none sm:rounded-3xl border-0 sm:border border-slate-800 shadow-2xl flex flex-col overflow-hidden"/,
  'className="w-full max-w-6xl mx-auto h-[100dvh] sm:h-[92vh] bg-[#090A0F]/90 backdrop-blur-2xl text-slate-100 rounded-none sm:rounded-3xl border-0 sm:border sm:border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden"'
);

// 3. Upgrade active tab styles for a futuristic look
modal = modal.replace(
  /activeTab === tab\.id\s*\?\s*'border-indigo-500 text-indigo-400 bg-slate-800\/40'\s*:\s*'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800\/20'/g,
  "activeTab === tab.id ? 'border-purple-500 text-purple-400 bg-purple-500/10 shadow-[inset_0_-2px_10px_rgba(168,85,247,0.2)]' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'"
);

// 4. Upgrade statistics to use a beautiful xG bar!
// Find the stats map array
const oldStatsRender = `                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  \${[
                    { label: 'Expected Goals (xG)', a: stats.xgA || 0, b: stats.xgB || 0 },
                    { label: 'TohAm vT TArAY (Shots on Target)', a: stats.shotsOnTargetA || 0, b: stats.shotsOnTargetB || 0 },
                    { label: 'TAhlAkTli HAcumlar', a: stats.dangerousAttacksA || 0, b: stats.dangerousAttacksB || 0 },
                    { label: 'TAhlAkTli ZTrbTlTr', a: stats.freeKicksA || 0, b: stats.freeKicksB || 0 },
                    { label: 'KAnA  ZTrbTlTri', a: stats.cornersA || 0, b: stats.cornersB || 0 },
                    { label: 'Offside', a: stats.offsidesA || 0, b: stats.offsidesB || 0 },
                    { label: 'Qayda Pozuntusu', a: stats.foulsA || 0, b: stats.foulsB || 0 },
                  ].map(st => {`;

const newStatsRender = `                <div className="flex flex-col space-y-4">
                  \${[
                    { label: 'Expected Goals (xG)', a: stats.xgA || 0, b: stats.xgB || 0 },
                    { label: 'Dəqiq Zərbələr (Shots on Target)', a: stats.shotsOnTargetA || 0, b: stats.shotsOnTargetB || 0 },
                    { label: 'Təhlükəli Hücumlar', a: stats.dangerousAttacksA || 0, b: stats.dangerousAttacksB || 0 },
                    { label: 'Cərimə Zərbələri', a: stats.freeKicksA || 0, b: stats.freeKicksB || 0 },
                    { label: 'Künc Zərbələri', a: stats.cornersA || 0, b: stats.cornersB || 0 },
                    { label: 'Offside', a: stats.offsidesA || 0, b: stats.offsidesB || 0 },
                    { label: 'Qayda Pozuntusu', a: stats.foulsA || 0, b: stats.foulsB || 0 },
                  ].map(st => {
                    const total = Number(st.a) + Number(st.b) || 1;
                    const pctA = (Number(st.a) / total) * 100;
                    const pctB = (Number(st.b) / total) * 100;
                    return html\`
                      <div key=\${st.label} className="bg-transparent/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between z-10">
                          <span className="font-black text-lg text-red-400 w-12 text-center">\${st.a}</span>
                          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-300">\${st.label}</span>
                          <span className="font-black text-lg text-sky-400 w-12 text-center">\${st.b}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-slate-800 gap-1 mx-2">
                          <div className="h-full bg-red-500 rounded-l-full transition-all duration-1000" style=\${{ width: \`\${pctA}%\` }}></div>
                          <div className="h-full bg-sky-500 rounded-r-full transition-all duration-1000" style=\${{ width: \`\${pctB}%\` }}></div>
                        </div>
                      </div>
                    \`;
                  })}`;

// We will use a regex to replace the old stats render map.
modal = modal.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">[\s\S]*?\]\.map\(st => \{[\s\S]*?return html`[\s\S]*?`;\s*\}\)\}/,
  newStatsRender + '}'
);

fs.writeFileSync('components/MatchAnalyticsModal.js', modal, 'utf8');
console.log('ProMax enhancements applied to Analytics Modal');
