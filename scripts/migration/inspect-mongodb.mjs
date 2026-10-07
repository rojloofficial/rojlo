import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const BACKUP_DIR = 'C:\\MongoDB-Backups\\rojlo-backup\\rojlo';
const SCRATCH_BACKUP = path.resolve(
  'C:/Users/Suraj/.gemini/antigravity/brain/edfa8143-6206-4334-8caa-ef9f3b501c3b/scratch/mongodb_full_backup.json'
);

console.log('='.repeat(70));
console.log('ROJLO MONGODB SOURCE AUDIT & INSPECTION');
console.log('='.repeat(70));

// 1. Inspect on-disk BSON backup
if (fs.existsSync(BACKUP_DIR)) {
  console.log(`\nFound official MongoDB dump at: ${BACKUP_DIR}`);
  const files = fs.readdirSync(BACKUP_DIR);
  const collections = files.filter(f => f.endsWith('.bson')).map(f => f.replace('.bson', ''));
  console.log(`Discovered ${collections.length} BSON collections:`);
  for (const col of collections) {
    const bsonStat = fs.statSync(path.join(BACKUP_DIR, `${col}.bson`));
    const metaPath = path.join(BACKUP_DIR, `${col}.metadata.json`);
    let indexCount = 0;
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        indexCount = meta.indexes ? meta.indexes.length : 0;
      } catch (e) {}
    }
    console.log(` - ${col.padEnd(22)} | Size: ${String(bsonStat.size).padStart(8)} bytes | Indexes: ${indexCount}`);
  }
} else {
  console.log(`Backup dir ${BACKUP_DIR} not found.`);
}

// 2. Inspect parsed JSON backup
if (fs.existsSync(SCRATCH_BACKUP)) {
  console.log(`\nFound JSON parsed backup at: ${SCRATCH_BACKUP}`);
  const data = JSON.parse(fs.readFileSync(SCRATCH_BACKUP, 'utf8'));
  console.log('Record counts:');
  for (const [col, docs] of Object.entries(data)) {
    console.log(` - ${col.padEnd(22)}: ${docs.length} documents`);
  }

  if (data._store && data._store[0]) {
    const store = data._store[0];
    console.log('\nEmbedded Store Entities (_store):');
    console.log(` - cities:                 ${store.cities?.length || 0}`);
    console.log(` - states:                 ${store.states?.length || 0}`);
    console.log(` - admins (sub-admins):    ${store.admins?.length || 0}`);
    console.log(` - vipUsers:               ${store.vipUsers?.length || 0}`);
    console.log(` - cityVipAssignments:     ${store.cityVipAssignments?.length || 0}`);
    console.log(` - upis:                   ${store.upis?.length || 0}`);
    console.log(` - deletedCities:          ${store.deletedCities?.length || 0}`);
    console.log(` - deletedStates:          ${store.deletedStates?.length || 0}`);
  }
}

console.log('\nAudit inspection complete.\n');
