const fs = require('fs');
let content = fs.readFileSync('components/ui.js', 'utf8');

const newComponents = `
/**
 * Professional Team Crest / Shield
 */
export const TeamBadge = ({ teamName = '?', className = 'w-10 h-10 text-sm' }) => {
  const nameToHash = teamName === '?' ? 'Unknown' : teamName;
  const hash = nameToHash.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  // Premium gradient combinations
  const colors = [
    ['from-indigo-600 to-blue-800', 'border-indigo-400/50'],
    ['from-rose-600 to-red-900', 'border-rose-400/50'],
    ['from-emerald-500 to-teal-800', 'border-emerald-400/50'],
    ['from-amber-500 to-orange-700', 'border-amber-400/50'],
    ['from-purple-600 to-fuchsia-900', 'border-purple-400/50'],
    ['from-cyan-500 to-sky-800', 'border-cyan-400/50'],
    ['from-slate-700 to-zinc-900', 'border-slate-500/50'],
    ['from-pink-600 to-rose-900', 'border-pink-400/50']
  ];
  
  const [bg, border] = teamName === '?' 
    ? ['from-zinc-700 to-zinc-900', 'border-zinc-500/50'] 
    : colors[hash % colors.length];
    
  const initials = teamName.substring(0, 3).toUpperCase();
  
  return html\`
    <div className=\\\`relative flex items-center justify-center shrink-0 group \${className}\\\` title=\\\`\${teamName}\\\`>
      <div className=\\\`absolute inset-0 bg-gradient-to-br \${bg} \${border} border-2 rounded-xl sm:rounded-2xl rounded-br-sm rotate-3 shadow-[0_4px_15px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 opacity-40\\\`></div>
      <div className=\\\`absolute inset-0 bg-gradient-to-br \${bg} \${border} border-2 rounded-xl sm:rounded-2xl rounded-br-sm shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105\\\`>
         <div className="absolute top-0 left-0 w-[150%] h-[150%] bg-white/10 -rotate-45 translate-x-[-50%] translate-y-[-50%] pointer-events-none"></div>
         <span className="font-black text-white tracking-tighter drop-shadow-md relative z-10">\${initials}</span>
      </div>
    </div>
  \`;
};

/**
 * Enhanced Premium Site Logo
 */
export const SiteLogo = ({ className = 'w-10 h-10' }) => {
  return html\`
    <div className="relative group/logo inline-flex items-center justify-center shrink-0">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-500 blur-md opacity-60 group-hover/logo:opacity-100 transition-opacity duration-500 animate-pulse"></div>
      <div className=\\\`relative z-10 \${className} rounded-full border-[3px] border-[#090A0F] shadow-xl overflow-hidden bg-zinc-900 flex items-center justify-center\\\`>
        <img src="assets/tdv-logo.png" className="w-full h-full object-cover transform transition-transform duration-500 group-hover/logo:scale-110" alt="TDV BTL" />
      </div>
    </div>
  \`;
};
`;

content += '\n' + newComponents;
fs.writeFileSync('components/ui.js', content, 'utf8');
console.log('Added TeamBadge and SiteLogo to ui.js');
