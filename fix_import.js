const fs = require('fs');

let app = fs.readFileSync('app.js', 'utf8');

if (!app.includes('SiteLogo, TeamBadge')) {
  app = app.replace(
    "import { authService } from './services/authService.js?v=20260912_0120';",
    "import { authService } from './services/authService.js?v=20260912_0120';\nimport { SiteLogo, TeamBadge } from './components/ui.js';"
  );
  fs.writeFileSync('app.js', app, 'utf8');
  console.log('Fixed app.js imports');
}
