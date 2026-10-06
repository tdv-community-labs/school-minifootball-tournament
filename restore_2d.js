const fs = require('fs');

const oldCode = fs.readFileSync('match_old.js', 'utf8');
let currentCode = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// Find the block in oldCode
const startTag = '<div className="flex flex-col md:flex-row gap-6 relative z-10">';
const endTag = '<!-- MERGED 3D POV COMPONENT -->';

const startIndex = oldCode.indexOf(startTag);
const endIndex = oldCode.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  let blockToInject = oldCode.substring(startIndex, endIndex);
  
  const injectionPoint = '<!-- TAB 3: İSTİLİK XƏRİTƏSİ (HEATMAP) -->';
  
  if (currentCode.includes(injectionPoint)) {
    // Add the 2D Pitch Header
    const pitchHeader = `
              <!-- ============================================================= -->
              <!-- 2D SHOTMAP COMPONENT (Yuxarıdan görünüş) -->
              <!-- ============================================================= -->
              <div className="mt-8 bg-transparent/90 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between z-10 relative mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                      <i className="fas fa-crosshairs text-sky-400"></i> Zərbə Xəritəsi (2D)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Komandaların qapıya vurduğu zərbələrin yuxarıdan vizualizasiyası</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold bg-[#0b0e14]/50 p-2 rounded-xl border border-white/5 backdrop-blur-md">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Qol</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span> Seyv / Dəqiq</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span> Xaric</span>
                  </div>
                </div>
                
    `;
    
    currentCode = currentCode.replace(injectionPoint, pitchHeader + blockToInject + '\n              </div>\n\n          ' + injectionPoint);
    fs.writeFileSync('components/MatchAnalyticsModal.js', currentCode, 'utf8');
    console.log('Injected 2D Pitch below 3D POV!');
  } else {
    console.log('Could not find injection point');
  }

} else {
  console.log('Could not extract block from old code');
}
