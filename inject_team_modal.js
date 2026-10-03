const fs = require('fs');

let appCode = fs.readFileSync('app.js', 'utf8');

if (!appCode.includes('import TeamProfileModal from')) {
  appCode = appCode.replace(
    "import PlayerProfileModal from './components/PlayerProfileModal.js?v=20260912_0120';",
    "import PlayerProfileModal from './components/PlayerProfileModal.js?v=20260912_0120';\nimport TeamProfileModal from './components/TeamProfileModal.js';"
  );
}

if (!appCode.includes('selectedTeamProfile')) {
  appCode = appCode.replace(
    "const [selectedPlayer, setSelectedPlayer] = useState(null);",
    "const [selectedPlayer, setSelectedPlayer] = useState(null);\n    const [selectedTeamProfile, setSelectedTeamProfile] = useState(null);"
  );
}

if (!appCode.includes('openTeamProfile =')) {
  appCode = appCode.replace(
    "const openPlayerProfile = (name) => {",
    "const openTeamProfile = (teamName) => {\n      setSelectedTeamProfile(teamName);\n    };\n\n    const openPlayerProfile = (name) => {"
  );
}

if (!appCode.includes('<${TeamProfileModal}')) {
  appCode = appCode.replace(
    "<!-- Player Profile Modal -->",
    `<!-- Team Profile Modal -->
        \${selectedTeamProfile && html\`
          <\${TeamProfileModal} 
            teamName=\${selectedTeamProfile}
            activeYear=\${activeYear}
            onClose=\${() => setSelectedTeamProfile(null)}
            onOpenPlayerProfile=\${(name) => { setSelectedTeamProfile(null); openPlayerProfile(name); }}
          />
        \`}
        
        <!-- Player Profile Modal -->`
  );
}

// Pass openTeamProfile to Standings
appCode = appCode.replace(
  "<\${Standings} \n            activeDivision=\${activeDivision} \n            activeYear=\${activeYear} \n            lang=\${lang} \n            t=\${t}\n            onOpenPlayerProfile=\${openPlayerProfile}",
  "<\${Standings} \n            activeDivision=\${activeDivision} \n            activeYear=\${activeYear} \n            lang=\${lang} \n            t=\${t}\n            onOpenPlayerProfile=\${openPlayerProfile}\n            onOpenTeamProfile=\${openTeamProfile}"
);

fs.writeFileSync('app.js', appCode, 'utf8');
console.log('Injected TeamProfileModal into app.js');
