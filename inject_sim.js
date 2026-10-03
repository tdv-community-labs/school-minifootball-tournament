const fs = require('fs');
let code = fs.readFileSync('components/Compare.js', 'utf8');

// Inject simulation state
code = code.replace(
  "const [search2, setSearch2] = useState('');",
  "const [search2, setSearch2] = useState('');\n  const [simulation, setSimulation] = useState(null);"
);

// Inject simulation function
const simFunc = `
  const simulateMatch = () => {
    setSimulation({ status: 'running', logs: [] });
    let min = 0;
    let score1 = 0;
    let score2 = 0;
    
    // Team ratings based on points and goal diff
    const t1Power = (item1.stats?.points || 1) + (item1.stats?.goalsFor || 1) * 0.5;
    const t2Power = (item2.stats?.points || 1) + (item2.stats?.goalsFor || 1) * 0.5;
    const totalPower = t1Power + t2Power;
    
    const interval = setInterval(() => {
      min += 5;
      if (min > 30) {
        clearInterval(interval);
        setSimulation(prev => ({ ...prev, status: 'finished', result: \`\${score1} - \${score2}\` }));
        return;
      }
      
      let logs = [];
      const chance = Math.random();
      if (chance < 0.3) {
         if (Math.random() < (t1Power / totalPower)) {
           score1++;
           logs.push(\`⚽ \${min}'. QOL! \${item1.name} gözəl hücumla fərqlənir! (\${score1} - \${score2})\`);
         } else {
           score2++;
           logs.push(\`⚽ \${min}'. QOL! \${item2.name} hesabı dəyişir! (\${score1} - \${score2})\`);
         }
      } else if (chance < 0.5) {
         if (Math.random() < 0.5) {
           logs.push(\`⚠️ \${min}'. Təhlükə! \${item1.name} direyi nişan aldı!\`);
         } else {
           logs.push(\`🧤 \${min}'. Möhtəşəm seyv! \${item2.name} qapıçısı topu çıxarır.\`);
         }
      } else {
         logs.push(\`⏱️ \${min}'. Meydanın mərkəzində taktiki mübarizə gedir.\`);
      }
      
      setSimulation(prev => ({ ...prev, status: 'running', logs: [...prev.logs, ...logs], score1, score2, min }));
    }, 1000);
  };
`;

code = code.replace(
  "// Helpers",
  simFunc + "\n  // Helpers"
);

const simUI = `
             \${mode === 'teams' && html\`
               <div className="mt-8 pt-8 border-t border-white/10 text-center">
                 <button onClick=\${simulateMatch} disabled=\${simulation?.status === 'running'} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed">
                   <i className=\${\`fas \${simulation?.status === 'running' ? 'fa-spinner fa-spin' : 'fa-robot'}\`}></i>
                   AI MATÇ SİMULYASİYASI (30 DƏQ)
                 </button>
                 
                 \${simulation && html\`
                   <div className="mt-6 bg-[#1e2333] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-left max-w-xl mx-auto">
                     <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-black text-purple-400 uppercase tracking-widest">\${simulation.status === 'finished' ? 'Maç Bitdi' : 'Canlı Yayım'}</span>
                        <span className="text-sm font-black text-white bg-purple-600/20 px-3 py-1 rounded-lg">\${simulation.status === 'finished' ? 'FT' : simulation.min + "'"}</span>
                     </div>
                     <div className="flex justify-between items-center mb-6 text-2xl sm:text-3xl font-black text-white px-4">
                        <span className="w-1/3 text-right truncate" title=\${item1.name}>\${item1.name.substring(0,8)}</span>
                        <span className="w-1/3 text-center text-4xl text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600">\${simulation.score1 || 0} - \${simulation.score2 || 0}</span>
                        <span className="w-1/3 text-left truncate" title=\${item2.name}>\${item2.name.substring(0,8)}</span>
                     </div>
                     <div className="space-y-3 h-40 overflow-y-auto pr-2 custom-scrollbar">
                        \${simulation.logs.map((log, i) => html\`
                          <div key=\${i} className="text-sm text-slate-300 bg-white/5 px-4 py-2 rounded-lg border-l-2 border-purple-500 animate-fadeIn">
                             \${log}
                          </div>
                        \`)}
                     </div>
                   </div>
                 \`}
               </div>
             \`}
`;

code = code.replace(
  "</p>\n                 </div>\n               </div>\n             ` : html`",
  "</p>\n                 </div>\n               </div>\n             ` : html`"
);

code = code.replace(
  /(\$\{renderComparisonBar\('Xal \(Xal Sistemi\)', item1\.stats\?\.points \|\| 0, item2\.stats\?\.points \|\| 0\)\})/,
  "$1\n" + simUI
);

fs.writeFileSync('components/Compare.js', code, 'utf8');
console.log("Injected AI Simulation");
