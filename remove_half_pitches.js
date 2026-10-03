const fs = require('fs');

let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

// The block to remove starts at <div className="flex flex-col md:flex-row gap-6 relative z-10">
// And ends right before <!-- ================================================================= -->
//                 <!-- MERGED 3D POV COMPONENT -->

const startStr = '<div className="flex flex-col md:flex-row gap-6 relative z-10">';
const endStr = '<!-- MERGED 3D POV COMPONENT -->';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const blockToRemove = code.substring(startIndex, endIndex);
  code = code.replace(blockToRemove, '');
  fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
  console.log('Removed the 2 half-pitches successfully.');
} else {
  console.log('Could not find the block to remove.');
}
