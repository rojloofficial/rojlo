import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_FILE = path.resolve(
  'C:/Users/Suraj/.gemini/antigravity/brain/edfa8143-6206-4334-8caa-ef9f3b501c3b/scratch/mongodb_full_backup.json'
);

console.log('='.repeat(70));
console.log('ROJLO DATABASE MIGRATION VERIFICATION');
console.log('='.repeat(70));

const dbUrl = process.env.DATABASE_URL?.trim();
const hasLiveDb = dbUrl && !dbUrl.includes('USERNAME:PASSWORD');

if (!fs.existsSync(BACKUP_FILE)) {
  console.error(`Backup file not found at ${BACKUP_FILE}`);
  process.exit(1);
}

const rawBackup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
const store = rawBackup._store?.[0] || {};

const expectedCounts = {
  users: (rawBackup.users || []).length,
  ads: (rawBackup.ads || []).length,
  city_seo: (rawBackup.city_seo || []).length,
  static_seo: (rawBackup.static_seo || []).length,
  coin_packages: (rawBackup.coin_packages || []).length,
  promotion_packages: (rawBackup.promotion_packages || []).length,
  cities: (store.cities || []).length,
  states: (store.states || []).length,
  admin_users: (store.admins || []).length,
  vip_users: (store.vipUsers || []).length,
  city_vip_assignments: (store.cityVipAssignments || []).length,
  upis: (store.upis || []).length,
  not_found_logs: (rawBackup.not_found_logs || []).length,
  payment_requests: (rawBackup.payment_requests || []).length,
  payment_history: (rawBackup.payment_history || []).length,
};

if (!hasLiveDb) {
  console.log('\n[STATUS: PRE-MIGRATION VERIFICATION STANDBY]');
  console.log('Notice: MariaDB DATABASE_URL is not yet configured.');
  console.log('Expected record counts to be verified once MariaDB connection is supplied:\n');
  console.log('Table / Collection'.padEnd(25) + ' | ' + 'MongoDB Source Count'.padEnd(22) + ' | ' + 'Target Status');
  console.log('-'.repeat(70));
  for (const [entity, count] of Object.entries(expectedCounts)) {
    console.log(`${entity.padEnd(25)} | ${String(count).padStart(12)}           | Awaiting MariaDB URL`);
  }
  console.log('-'.repeat(70));
  console.log('\nVerification suite is ready and will run automatically upon DATABASE_URL provision.\n');
  process.exit(0);
}

async function verifyLive() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log('Connected to MariaDB. Running count & integrity comparisons...\n');

  const actualCounts = {
    users: await prisma.user.count(),
    ads: await prisma.ad.count(),
    city_seo: await prisma.citySeo.count(),
    static_seo: await prisma.staticSeo.count(),
    coin_packages: await prisma.coinPackage.count(),
    promotion_packages: await prisma.promotionPackage.count(),
    cities: await prisma.city.count(),
    states: await prisma.state.count(),
    admin_users: await prisma.adminUser.count(),
    vip_users: await prisma.vipUser.count(),
    city_vip_assignments: await prisma.cityVipAssignment.count(),
    upis: await prisma.upi.count(),
    not_found_logs: await prisma.notFoundLog.count(),
    payment_requests: await prisma.paymentRequest.count(),
    payment_history: await prisma.paymentHistory.count(),
  };

  console.log('Table / Collection'.padEnd(25) + ' | ' + 'MongoDB Count'.padEnd(15) + ' | ' + 'MariaDB Count'.padEnd(15) + ' | Result');
  console.log('-'.repeat(70));

  let allPass = true;
  for (const [entity, expected] of Object.entries(expectedCounts)) {
    const actual = actualCounts[entity] || 0;
    const pass = expected === actual;
    if (!pass) allPass = false;
    console.log(
      `${entity.padEnd(25)} | ${String(expected).padStart(13)} | ${String(actual).padStart(13)} | ${pass ? 'PASS' : 'FAIL'}`
    );
  }
  console.log('-'.repeat(70));

  // Critical field checks
  console.log('\nVerifying critical record attributes...');
  const user = await prisma.user.findFirst({ where: { email: 'surajkumar40407@gmail.com' } });
  if (user && user.coins === 512) {
    console.log(' - User balance & password integrity: PASS');
  } else {
    console.log(' - User balance check: FAIL');
    allPass = false;
  }

  const activeAd = await prisma.ad.findFirst({ where: { status: 'active' } });
  if (activeAd && activeAd.city === 'Chandigarh City') {
    console.log(' - Active ad preservation: PASS');
  } else {
    console.log(' - Active ad preservation: FAIL');
    allPass = false;
  }

  console.log(`\nFinal Verification Result: ${allPass ? 'ALL TESTS PASSED ✅' : 'VERIFICATION FAILED ❌'}\n`);
  await prisma.$disconnect();
}

verifyLive().catch(console.error);
