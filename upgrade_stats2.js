const fs = require('fs');

let modal = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

const anchor = "activeTab === 'stats' && html`";
let start = modal.indexOf(anchor);

if (start !== -1) {
  let end = modal.indexOf('`}', start + anchor.length);
  
  if (end !== -1) {
    let block = modal.substring(start, end);
    let newBlock = block.replace(
      /<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">[\s\S]*?\}\)/,
      `<div className="flex flex-col space-y-4">
                  \${[
                    { label: 'Expected Goals (xG)', a: stats.xgA || 0, b: stats.xgB || 0 },
                    { label: 'Ümumi Zərbələr', a: stats.totalShotsA || 0, b: stats.totalShotsB || 0 },
                    { label: 'Qapıya Dəqiq Zərbələr', a: stats.shotsOnTargetA || 0, b: stats.shotsOnTargetB || 0 },
                    { label: 'Topa Sahib Olma', a: stats.possessionA || 50, b: stats.possessionB || 50, isPct: true },
                    { label: 'Ötürmələr', a: stats.passesA || 215, b: stats.passesB || 168 },
                    { label: 'Künc Zərbələri', a: stats.cornersA || 5, b: stats.cornersB || 4 }
                  ].map(item => {
                    const valA = item.isPct ? parseInt(item.a) : item.a;
                    const valB = item.isPct ? parseInt(item.b) : item.b;
                    const total = (valA + valB) || 1;
                    const pctA = item.isPct ? valA : Math.round((valA / total) * 100);
                    const pctB = item.isPct ? valB : 100 - pctA;
                    
                    return html\`
                      <div key=\${item.label} className="bg-transparent/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden group hover:border-slate-700 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center justify-between z-10">
                          <span className="font-black text-lg text-red-400 w-12 text-center">\${item.isPct ? item.a + '%' : item.a}</span>
                          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-300 drop-shadow-sm">\${item.label}</span>
                          <span className="font-black text-lg text-sky-400 w-12 text-center">\${item.isPct ? item.b + '%' : item.b}</span>
                        </div>
                        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-800/80 gap-[2px] mx-1">
                          <div className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-l-full transition-all duration-1000 shadow-[0_0_10px_rgba(225,29,72,0.5)]" style=\${{ width: \\\`\${pctA}%\\\` }}></div>
                          <div className="h-full bg-gradient-to-l from-sky-600 to-blue-400 rounded-r-full transition-all duration-1000 shadow-[0_0_10px_rgba(14,165,233,0.5)]" style=\${{ width: \\\`\${pctB}%\\\` }}></div>
                        </div>
                      </div>
                    \`;
                  })`
    );
    modal = modal.substring(0, start) + newBlock + modal.substring(end);
    fs.writeFileSync('components/MatchAnalyticsModal.js', modal, 'utf8');
    console.log('Stats replaced via substring.');
  }
}
