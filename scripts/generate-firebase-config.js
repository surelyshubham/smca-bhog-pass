const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');

if (!fs.existsSync(configPath)) {
  console.log('Generating firebase-applet-config.json from environment variables...');
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    firestoreDatabaseId: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)"
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('Firebase config generated successfully.');
} else {
  console.log('firebase-applet-config.json already exists. Skipping generation.');
}
