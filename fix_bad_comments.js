const fs = require('fs');
let code = fs.readFileSync('components/MatchAnalyticsModal.js', 'utf8');

const badComments = `
                        <!-- ================================================================= -->
            <!-- TAB 1: ZƏRBƏLƏR & BİRLƏŞDİRİLMİŞ 3D QAPI POV STADİONU -->
          <!-- ================================================================= -->
          `;

if (code.includes('<!-- TAB 1: ZƏRBƏLƏR')) {
  code = code.replace(badComments, '');
  fs.writeFileSync('components/MatchAnalyticsModal.js', code, 'utf8');
  console.log('Removed illegal HTML comments inside button tag!');
} else {
  console.log('Could not find bad comments');
}
