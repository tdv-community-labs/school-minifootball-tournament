const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');

if (!app.includes('handleTabChange')) {
  app = app.replace(
    /const \[activeTab, setActiveTab\] = useState\('dashboard'\);/,
    `const [activeTab, setActiveTabState] = useState('dashboard');
  
  const handleTabChange = (tab) => {
    if (!document.startViewTransition) {
      setActiveTabState(tab);
      return;
    }
    document.startViewTransition(() => {
      setActiveTabState(tab);
    });
  };`
  );

  // Replace setActiveTab calls
  app = app.replace(/setActiveTab\(/g, 'handleTabChange(');

  fs.writeFileSync('app.js', app, 'utf8');
  console.log('Added view transitions to app.js');
}

// Enhance CSS for max UI/UX ProMax level
let css = fs.readFileSync('styles.css', 'utf8');
if (!css.includes('::view-transition')) {
  const proMaxCSS = `
/* ========================================================
   UI/UX PROMAX ENHANCEMENTS (Glassmorphism & Motion)
   ======================================================== */

/* Advanced View Transitions */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}
::view-transition-old(root) {
  animation-name: fade-out, slide-out;
}
::view-transition-new(root) {
  animation-name: fade-in, slide-in;
  mix-blend-mode: normal;
}
@keyframes fade-out { to { opacity: 0; filter: blur(4px); } }
@keyframes fade-in { from { opacity: 0; filter: blur(4px); } }
@keyframes slide-out { to { transform: translateY(-10px) scale(0.98); } }
@keyframes slide-in { from { transform: translateY(10px) scale(0.98); } }

/* Global Scrollbar Styling (Premium) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(168, 85, 247, 0.15); /* light purple */
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
html.dark ::-webkit-scrollbar-thumb {
  background-color: rgba(168, 85, 247, 0.3);
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(168, 85, 247, 0.5);
}

/* Global Selection */
::selection {
  background-color: rgba(168, 85, 247, 0.3);
  color: inherit;
}

/* Animated Glassmorphism Backgrounds for Modals */
dialog::backdrop {
  background: rgba(9, 10, 15, 0.6);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  animation: backdrop-fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes backdrop-fade-in {
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(12px); }
}

/* General Layout Tweaks for premium feel */
body {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Glow effects for cards */
.hover-glow:hover {
  box-shadow: 0 0 40px rgba(168, 85, 247, 0.15);
  border-color: rgba(168, 85, 247, 0.4);
}
`;
  
  css += '\n' + proMaxCSS;
  fs.writeFileSync('styles.css', css, 'utf8');
  console.log('Added ProMax CSS');
}

// Add hover-glow to Match cards in Matches.js
let matches = fs.readFileSync('components/Matches.js', 'utf8');
if (!matches.includes('hover-glow')) {
  matches = matches.replace(
    /className="bg-white dark:bg-\[\#080808\] dark:backdrop-blur-xl border border-zinc-200 dark:border-white\/10 hover:border-purple-500\/40 dark:hover:border-purple-500\/40 rounded-3xl overflow-hidden shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:dark:border-purple-500\/50 hover:dark:shadow-\[0_0_30px_rgba\(168,85,247,0.15\)\] transition-all duration-300"/g,
    'className="hover-glow bg-white dark:bg-[#080808] dark:backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xs hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative"'
  );
  // Also add a shiny gradient border overlay inside the card!
  matches = matches.replace(
    /<!-- Match Card Top -->/g,
    `<!-- Glow overlay -->\n<div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>\n<!-- Match Card Top -->`
  );
  matches = matches.replace(/<div key=\$\{match\.id\} onClick=/g, '<div key=${match.id} className="group" onClick=');
  fs.writeFileSync('components/Matches.js', matches, 'utf8');
}
