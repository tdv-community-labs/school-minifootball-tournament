const fs = require('fs');
let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

const startTag = '<div className="bg-transparent/90 border border-white/10 rounded-2xl p-5 space-y-6 overflow-hidden relative">';
const endTag = '<!-- MERGED 3D POV COMPONENT -->';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag) + endTag.length;

if (startIndex !== -1 && endIndex !== -1) {
  const blockToRemove = code.substring(startIndex, endIndex);
  code = code.replace(blockToRemove, '');
  fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
  console.log('Removed unclosed DIV A and redundant title!');
} else {
  console.log('Could not find block to remove!');
}
