const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

if (!css.includes('@keyframes drawArrow')) {
  css += `
/* ProMax Match Player Profile Animations */
@keyframes drawArrow {
  from { stroke-dasharray: 0 100; opacity: 0; }
  to { stroke-dasharray: 100 0; opacity: 1; }
}

@keyframes popIn {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  80% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

/* Match Player Profile SVG Utilities */
.origin-left { transform-origin: left center; }
`;
  fs.writeFileSync('styles.css', css, 'utf8');
  console.log('Added keyframes');
}
