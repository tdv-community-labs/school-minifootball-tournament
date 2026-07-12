const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'services', 'firebase-config.js');

if (process.env.NEXT_PUBLIC_FIREBASE_CONFIG) {
  try {
    // Parse to validate JSON
    const configData = JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
    const content = `// Generated at build time from NEXT_PUBLIC_FIREBASE_CONFIG
export const firebaseConfig = ${JSON.stringify(configData, null, 2)};
export const useRealFirebase = true;
`;
    fs.writeFileSync(configPath, content, 'utf8');
    console.log("SUCCESS: firebase-config.js has been successfully written from NEXT_PUBLIC_FIREBASE_CONFIG!");
  } catch (err) {
    console.error("ERROR: Failed to parse or write NEXT_PUBLIC_FIREBASE_CONFIG:", err);
  }
} else {
  console.log("NOTICE: NEXT_PUBLIC_FIREBASE_CONFIG environment variable not detected. Using default config.");
}
