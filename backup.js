// Backup all Firestore data to a local JSON file
// Run with: node --env-file=.env backup.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backupsDir = join(__dirname, 'backups');

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function backup() {
  const collections = ['profiles', 'elo', 'votes', 'activity'];
  const data = {};

  for (const name of collections) {
    try {
      const snap = await getDocs(collection(db, name));
      data[name] = {};
      snap.docs.forEach(doc => {
        data[name][doc.id] = doc.data();
      });
      console.log(`  ${name}: ${snap.docs.length} documents`);
    } catch (e) {
      console.log(`  ${name}: skipped (${e.code || e.message})`);
    }
  }

  mkdirSync(backupsDir, { recursive: true });
  const date = new Date().toISOString().split('T')[0];
  const time = new Date().toISOString().split('T')[1].slice(0, 5).replace(':', '');
  const filename = join(backupsDir, `backup-${date}-${time}.json`);
  writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`\nBackup saved to ${filename}`);
  process.exit(0);
}

backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
