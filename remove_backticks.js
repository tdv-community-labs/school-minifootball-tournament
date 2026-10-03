const fs = require('fs');

function fixMatchAnalyticsModal() {
  let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');
  // className=\$\{\`absolute w-3.5 h-3.5 rounded-full border border-white/80 transition-all hover:scale-150 cursor-crosshair \${typeClass}\`\}
  code = code.replace(
    /className=\\\$\\\{\\`absolute w-3\.5 h-3\.5 rounded-full border border-white\/80 transition-all hover:scale-150 cursor-crosshair \\\$\{typeClass\}\\`\\\}/g,
    "className=${'absolute w-3.5 h-3.5 rounded-full border border-white/80 transition-all hover:scale-150 cursor-crosshair ' + typeClass}"
  );
  fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
}

function fixMatchPlayerProfileModal() {
  let code = fs.readFileSync('components/MatchPlayerProfileModal.js', 'utf8');
  // className=${\`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full \${p.success ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'}\`}
  code = code.replace(
    /className=\$\{\\`w-2 h-2 sm:w-2\.5 sm:h-2\.5 rounded-full \\\$\{(p\.success \? 'bg-emerald-500 shadow-\[0_0_8px_#10b981\]' : 'bg-rose-500')\}\\`\}/g,
    "className=${'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ' + ($1)}"
  );
  // className=${\`absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[1.5px] border-slate-900 shadow-md -translate-x-1/2 -translate-y-1/2 z-20 \${i % 2 === 0 ? 'bg-orange-500' : 'bg-pink-500'}\`}
  code = code.replace(
    /className=\$\{\\`absolute w-3 h-3 sm:w-3\.5 sm:h-3\.5 rounded-full border-\[1\.5px\] border-slate-900 shadow-md -translate-x-1\/2 -translate-y-1\/2 z-20 \\\$\{(i % 2 === 0 \? 'bg-orange-500' : 'bg-pink-500')\}\\`\}/g,
    "className=${'absolute w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[1.5px] border-slate-900 shadow-md -translate-x-1/2 -translate-y-1/2 z-20 ' + ($1)}"
  );
  fs.writeFileSync('components/MatchPlayerProfileModal.js', code, 'utf8');
}

function fixUi() {
  let code = fs.readFileSync('components/ui.js', 'utf8');
  // <div className=\`relative flex items-center justify-center shrink-0 group ${className}\` title=\`${safeName}\`>
  code = code.replace(
    /className=\\`relative flex items-center justify-center shrink-0 group \$\{className\}\\`/g,
    "className=${'relative flex items-center justify-center shrink-0 group ' + className}"
  );
  code = code.replace(
    /title=\\`\$\{safeName\}\\`/g,
    "title=${safeName}"
  );
  code = code.replace(
    /className=\\`absolute inset-0 bg-gradient-to-br \$\{bg\} \$\{border\} border-2 rounded-xl sm:rounded-2xl rounded-br-sm rotate-3 shadow-\[0_4px_15px_rgba\(0,0,0,0\.3\)\] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 opacity-40\\`/g,
    "className=${'absolute inset-0 bg-gradient-to-br border-2 rounded-xl sm:rounded-2xl rounded-br-sm rotate-3 shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 opacity-40 ' + bg + ' ' + border}"
  );
  code = code.replace(
    /className=\\`absolute inset-0 bg-gradient-to-br \$\{bg\} \$\{border\} border-2 rounded-xl sm:rounded-2xl rounded-br-sm shadow-\[0_4px_15px_rgba\(0,0,0,0\.5\)\] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105\\`/g,
    "className=${'absolute inset-0 bg-gradient-to-br border-2 rounded-xl sm:rounded-2xl rounded-br-sm shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 ' + bg + ' ' + border}"
  );
  code = code.replace(
    /className=\\`relative z-10 \$\{className\} rounded-full border-\[3px\] border-\[#090A0F\] shadow-xl overflow-hidden bg-zinc-900 flex items-center justify-center\\`/g,
    "className=${'relative z-10 rounded-full border-[3px] border-[#090A0F] shadow-xl overflow-hidden bg-zinc-900 flex items-center justify-center ' + className}"
  );
  fs.writeFileSync('components/ui.js', code, 'utf8');
}

function fixPlayers() {
  let code = fs.readFileSync('components/Players.js', 'utf8');
  code = code.replace(
    /className=\\\$\\\{\\`group bg-white dark:bg-\[#080808\]\/90 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white\/10 rounded-3xl p-4 sm:p-6 shadow-xs \\\$\{borderGlow\} \\\$\{shadowGlow\} hover:-translate-y-1\.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden cursor-pointer\\`\\\}/g,
    "className=${'group bg-white dark:bg-[#080808]/90 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xs hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between relative overflow-hidden cursor-pointer ' + borderGlow + ' ' + shadowGlow}"
  );
  fs.writeFileSync('components/Players.js', code, 'utf8');
}

fixMatchAnalyticsModal();
fixMatchPlayerProfileModal();
fixUi();
fixPlayers();
console.log('Fixed backticks');
