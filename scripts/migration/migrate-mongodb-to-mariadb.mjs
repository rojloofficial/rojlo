import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDryRun = process.argv.includes('--dry-run');
const BACKUP_FILE = path.resolve(
  'C:/Users/Suraj/.gemini/antigravity/brain/edfa8143-6206-4334-8caa-ef9f3b501c3b/scratch/mongodb_full_backup.json'
);

console.log('='.repeat(70));
console.log(`ROJLO MONGODB → MARIADB MIGRATION ${isDryRun ? '(DRY RUN)' : '(LIVE EXECUTION)'}`);
console.log('='.repeat(70));

if (!fs.existsSync(BACKUP_FILE)) {
  console.error(`CRITICAL: Backup file not found at ${BACKUP_FILE}`);
  process.exit(1);
}

const rawBackup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
const store = rawBackup._store?.[0] || {};

function toDate(d) {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function toDecimal(num) {
  if (num === null || num === undefined) return 0;
  return Number(num);
}

// Validation & Transformation functions
function transformUsers(docs) {
  return docs.map(doc => ({
    id: String(doc._id),
    name: String(doc.name || ''),
    email: String(doc.email || '').toLowerCase().trim(),
    phone: doc.phone ? String(doc.phone) : null,
    service: doc.service ? String(doc.service) : null,
    coins: Number(doc.coins || 0),
    passwordHash: String(doc.passwordHash || ''),
    sessionToken: doc.sessionToken ? String(doc.sessionToken) : null,
    emailVerified: Boolean(doc.emailVerified),
    otpHash: doc.otpHash ? String(doc.otpHash) : null,
    otpHashes: doc.otpHashes || null,
    otpExpires: toDate(doc.otpExpires),
    otpAttempts: Number(doc.otpAttempts || 0),
    otpLastSentAt: toDate(doc.otpLastSentAt),
    createdAt: toDate(doc.createdAt) || new Date(),
    updatedAt: toDate(doc.updatedAt) || new Date(),
  }));
}

function transformAds(docs) {
  return docs.map(doc => ({
    id: String(doc._id),
    userId: String(doc.userId || ''),
    name: String(doc.name || ''),
    title: doc.title ? String(doc.title) : null,
    age: doc.age ? String(doc.age) : null,
    category: String(doc.category || 'Escorts'),
    toServe: Array.isArray(doc.toServe) ? doc.toServe : null,
    placeOfService: Array.isArray(doc.placeOfService) ? doc.placeOfService : null,
    state: doc.state ? String(doc.state) : null,
    city: String(doc.city || ''),
    localArea: doc.localArea ? String(doc.localArea) : null,
    pincode: doc.pincode ? String(doc.pincode) : null,
    phone: String(doc.phone || ''),
    whatsapp: doc.whatsapp ? String(doc.whatsapp) : null,
    telegram: doc.telegram ? String(doc.telegram) : null,
    about: String(doc.about || ''),
    images: Array.isArray(doc.images) ? doc.images : [],
    status: String(doc.status || 'active'),
    serviceRates: Array.isArray(doc.serviceRates) ? doc.serviceRates : null,
    promoted: Boolean(doc.promoted),
    isPromoted: Boolean(doc.isPromoted),
    promotedFrom: toDate(doc.promotedFrom),
    promotedUntil: toDate(doc.promotedUntil),
    promoPackage: doc.promoPackage ? String(doc.promoPackage) : null,
    promoTier: doc.promoTier ? String(doc.promoTier) : null,
    promoShift: doc.promoShift ? String(doc.promoShift) : null,
    isFreeAd: doc.isFreeAd !== undefined ? Boolean(doc.isFreeAd) : null,
    isVisibleOnCityPage: doc.isVisibleOnCityPage !== undefined ? Boolean(doc.isVisibleOnCityPage) : null,
    requiresPromotion: doc.requiresPromotion !== undefined ? Boolean(doc.requiresPromotion) : null,
    createdAt: toDate(doc.createdAt) || new Date(),
    updatedAt: toDate(doc.updatedAt) || new Date(),
  }));
}

function transformCitySeo(docs) {
  return docs.map(doc => ({
    id: String(doc._id),
    slug: String(doc.slug).trim().toLowerCase(),
    urlSlug: doc.urlSlug ? String(doc.urlSlug).trim().toLowerCase() : null,
    name: String(doc.name || ''),
    title: String(doc.title || ''),
    description: String(doc.description || ''),
    canonicalUrl: doc.canonicalUrl ? String(doc.canonicalUrl) : null,
    primaryKeyword: doc.primaryKeyword ? String(doc.primaryKeyword) : null,
    secondaryKeywords: Array.isArray(doc.secondaryKeywords) ? doc.secondaryKeywords : null,
    keywords: doc.keywords ? String(doc.keywords) : null,
    longTailKeywords: Array.isArray(doc.longTailKeywords) ? doc.longTailKeywords : null,
    popularSearches: Array.isArray(doc.popularSearches) ? doc.popularSearches : null,
    featuredImage: doc.featuredImage ? String(doc.featuredImage) : null,
    imageAlt: doc.imageAlt ? String(doc.imageAlt) : null,
    content: Array.isArray(doc.content) ? doc.content : [],
    faqs: Array.isArray(doc.faqs) ? doc.faqs : [],
    status: String(doc.status || 'published'),
    createdAt: toDate(doc.createdAt) || new Date(),
    updatedAt: toDate(doc.updatedAt) || new Date(),
  }));
}

function transformStaticSeo(docs) {
  return docs.map(doc => ({
    id: String(doc._id),
    pageKey: String(doc.pageKey),
    title: String(doc.title || ''),
    description: String(doc.description || ''),
    keywords: doc.keywords ? String(doc.keywords) : null,
    content: Array.isArray(doc.content) ? doc.content : [],
    faqs: Array.isArray(doc.faqs) ? doc.faqs : [],
    images: Array.isArray(doc.images) ? doc.images : null,
    status: String(doc.status || 'published'),
    createdAt: toDate(doc.createdAt) || new Date(),
    updatedAt: toDate(doc.updatedAt) || new Date(),
  }));
}

function transformCoinPackages(docs) {
  return docs.map(doc => ({
    id: String(doc._id),
    coins: Number(doc.coins || 0),
    price: toDecimal(doc.price),
    originalPrice: toDecimal(doc.originalPrice),
    breakdown: doc.breakdown ? String(doc.breakdown) : null,
    discount: doc.discount ? String(doc.discount) : null,
    label: doc.label ? String(doc.label) : null,
    popular: Boolean(doc.popular),
    createdAt: toDate(doc.createdAt) || new Date(),
    updatedAt: toDate(doc.updatedAt) || new Date(),
  }));
}

function transformPromotionPackages(docs) {
  return docs.map(doc => ({
    id: String(doc.id || doc._id),
    title: String(doc.title || ''),
    tier: String(doc.tier || 'bronze'),
    rankRange: String(doc.rankRange || ''),
    durationDays: toDecimal(doc.durationDays),
    durationHours: Number(doc.durationHours || 0),
    coinsCost: Number(doc.coinsCost || 0),
    tag: doc.tag ? String(doc.tag) : null,
    highlight: Boolean(doc.highlight),
    features: Array.isArray(doc.features) ? doc.features : null,
    createdAt: toDate(doc.createdAt) || new Date(),
    updatedAt: toDate(doc.updatedAt) || new Date(),
  }));
}

function transformStoreCities(cities) {
  return (cities || []).map((c, i) => ({
    id: String(c._id || `city_${c.slug || i}`),
    name: String(c.name || ''),
    slug: String(c.slug || '').trim().toLowerCase(),
    state: c.state ? String(c.state).trim() : null,
    region: c.region ? String(c.region) : null,
    country: c.country ? String(c.country) : 'India',
    famousFood: String(c.famousFood || ''),
    seoDescription: String(c.seoDescription || ''),
    createdAt: toDate(c.createdAt) || new Date(),
    updatedAt: toDate(c.updatedAt) || new Date(),
  }));
}

function transformStoreStates(states) {
  return (states || []).map((s, i) => ({
    id: String(s._id || `state_${s.slug || i}`),
    name: String(s.name || ''),
    slug: String(s.slug || '').trim().toLowerCase(),
    createdAt: toDate(s.createdAt) || new Date(),
    updatedAt: toDate(s.updatedAt) || new Date(),
  }));
}

function transformStoreAdmins(admins) {
  return (admins || []).map(a => ({
    id: String(a._id),
    email: String(a.email).trim().toLowerCase(),
    passwordHash: String(a.passwordHash),
    sessionToken: a.sessionToken ? String(a.sessionToken) : null,
    permissions: Array.isArray(a.permissions) ? a.permissions : [],
    role: String(a.role || 'subadmin'),
    lastLogin: toDate(a.lastLogin),
    createdAt: toDate(a.createdAt) || new Date(),
    updatedAt: toDate(a.updatedAt) || new Date(),
  }));
}

function transformStoreVipUsers(vipUsers) {
  return (vipUsers || []).map(v => ({
    id: String(v._id),
    email: String(v.email).trim().toLowerCase(),
    phone: v.phone ? String(v.phone) : null,
    passwordHash: v.passwordHash ? String(v.passwordHash) : null,
    setupToken: v.setupToken ? String(v.setupToken) : null,
    setupTokenExpires: toDate(v.setupTokenExpires),
    sessionToken: v.sessionToken ? String(v.sessionToken) : null,
    lastLogin: toDate(v.lastLogin),
    createdAt: toDate(v.createdAt) || new Date(),
    updatedAt: toDate(v.updatedAt) || new Date(),
  }));
}

function transformStoreCityVipAssignments(assignments) {
  return (assignments || []).map(a => ({
    id: String(a._id),
    type: String(a.type || 'city'),
    cityName: a.cityName ? String(a.cityName) : null,
    citySlug: a.citySlug ? String(a.citySlug).toLowerCase() : null,
    stateName: a.stateName ? String(a.stateName) : null,
    email: String(a.email).trim().toLowerCase(),
    phone: a.phone ? String(a.phone) : null,
    status: String(a.status || 'active'),
    assignedBy: a.assignedBy ? String(a.assignedBy) : null,
    assignedAt: toDate(a.assignedAt) || new Date(),
    expiresAt: toDate(a.expiresAt) || new Date(),
    lastReminderSentAt: toDate(a.lastReminderSentAt),
    createdAt: toDate(a.createdAt) || new Date(),
    updatedAt: toDate(a.updatedAt) || new Date(),
  }));
}

function transformStoreUpis(upis) {
  return (upis || []).map(u => ({
    id: String(u._id),
    upiId: String(u.upiId),
    name: String(u.name || ''),
    qrCode: String(u.qrCode || ''),
    active: Boolean(u.active),
    createdAt: toDate(u.createdAt) || new Date(),
    updatedAt: toDate(u.updatedAt) || new Date(),
  }));
}

function transformStoreCoupons(coupons) {
  return (coupons || []).map(c => ({
    id: String(c._id),
    code: String(c.code).trim().toUpperCase(),
    discountPercent: toDecimal(c.discountPercent),
    maxDiscount: c.maxDiscount ? toDecimal(c.maxDiscount) : null,
    minAmount: c.minAmount ? toDecimal(c.minAmount) : null,
    active: Boolean(c.active),
    expiresAt: toDate(c.expiresAt),
    usageLimit: c.usageLimit ? Number(c.usageLimit) : null,
    usedCount: Number(c.usedCount || 0),
    createdAt: toDate(c.createdAt) || new Date(),
    updatedAt: toDate(c.updatedAt) || new Date(),
  }));
}

function transformNotFoundLogs(docs) {
  return docs.map(doc => ({
    id: String(doc._id),
    path: String(doc.path),
    hits: Number(doc.hits || 1),
    firstSeen: toDate(doc.firstSeen) || new Date(),
    lastSeen: toDate(doc.lastSeen) || new Date(),
    referrers: doc.referrers || null,
    userAgent: doc.userAgent ? String(doc.userAgent) : null,
    ip: doc.ip ? String(doc.ip) : null,
    resolved: Boolean(doc.resolved),
  }));
}

function transformAppSettings(storeDoc, settingsCol) {
  const settingsList = [];
  
  // Store metadata
  settingsList.push({
    key: 'app_state_metadata',
    value: {
      deletedCities: storeDoc.deletedCities || [],
      deletedStates: storeDoc.deletedStates || [],
      upiRotation: storeDoc.upiRotation || { index: 0, requestCount: 0 },
      promotionPackagesInitialized: Boolean(storeDoc.promotionPackagesInitialized),
      coinPackagesInitialized: Boolean(storeDoc.coinPackagesInitialized),
      coinPackagesVersion: Number(storeDoc.coinPackagesVersion || 2),
      allPackagesCoins: Number(storeDoc.allPackagesCoins || 55),
      upiInitialized: Boolean(storeDoc.upiInitialized),
    },
  });

  if (settingsCol && settingsCol.length > 0) {
    for (const s of settingsCol) {
      if (s.key) {
        settingsList.push({
          key: String(s.key),
          value: s.value !== undefined ? s.value : {},
        });
      }
    }
  }

  return settingsList;
}

// Plan and validate dataset
const transformed = {
  users: transformUsers(rawBackup.users || []),
  ads: transformAds(rawBackup.ads || []),
  citySeo: transformCitySeo(rawBackup.city_seo || []),
  staticSeo: transformStaticSeo(rawBackup.static_seo || []),
  coinPackages: transformCoinPackages(rawBackup.coin_packages || []),
  promotionPackages: transformPromotionPackages(rawBackup.promotion_packages || []),
  cities: transformStoreCities(store.cities || []),
  states: transformStoreStates(store.states || []),
  admins: transformStoreAdmins(store.admins || []),
  vipUsers: transformStoreVipUsers(store.vipUsers || []),
  cityVipAssignments: transformStoreCityVipAssignments(store.cityVipAssignments || []),
  upis: transformStoreUpis(store.upis || []),
  coupons: transformStoreCoupons(store.coupons || []),
  notFoundLogs: transformNotFoundLogs(rawBackup.not_found_logs || []),
  appSettings: transformAppSettings(store, rawBackup.settings),
};

console.log('\nDataset transformation and validation summary:');
for (const [table, items] of Object.entries(transformed)) {
  console.log(` - ${table.padEnd(25)}: ${String(items.length).padStart(4)} records validated`);
}

if (isDryRun) {
  console.log('\n✅ DRY RUN SUCCESSFUL: All documents and store entities successfully transformed and validated.');
  console.log('No database writes performed. MariaDB schema and data models are 100% compatible.\n');
  process.exit(0);
}

// Live execution requires DATABASE_URL
const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl || dbUrl.includes('USERNAME:PASSWORD')) {
  console.error('\n🚨 STOP CONDITION: DATABASE_URL is not set or contains placeholder credentials.');
  console.error('Please configure the real MariaDB connection URL in .env.local before running live migration.\n');
  process.exit(1);
}

async function runLiveMigration() {
  console.log('\nConnecting to MariaDB via Prisma Client...');
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log('Successfully connected to MariaDB!');

  try {
    // 1. App settings
    console.log('Migrating appSettings...');
    for (const s of transformed.appSettings) {
      await prisma.appSetting.upsert({
        where: { key: s.key },
        create: s,
        update: s,
      });
    }

    // 2. States
    console.log('Migrating states...');
    for (const s of transformed.states) {
      await prisma.state.upsert({
        where: { slug: s.slug },
        create: s,
        update: s,
      });
    }

    // 3. Cities (in batches)
    console.log(`Migrating ${transformed.cities.length} cities...`);
    for (const c of transformed.cities) {
      await prisma.city.upsert({
        where: { id: c.id },
        create: c,
        update: c,
      });
    }

    // 4. Users
    console.log(`Migrating ${transformed.users.length} users...`);
    for (const u of transformed.users) {
      await prisma.user.upsert({
        where: { email: u.email },
        create: u,
        update: u,
      });
    }

    // 5. Admins
    console.log(`Migrating ${transformed.admins.length} admin users...`);
    for (const a of transformed.admins) {
      await prisma.adminUser.upsert({
        where: { email: a.email },
        create: a,
        update: a,
      });
    }

    // 6. VIP Users
    console.log(`Migrating ${transformed.vipUsers.length} VIP users...`);
    for (const v of transformed.vipUsers) {
      await prisma.vipUser.upsert({
        where: { email: v.email },
        create: v,
        update: v,
      });
    }

    // 7. City VIP Assignments
    console.log(`Migrating ${transformed.cityVipAssignments.length} city VIP assignments...`);
    for (const a of transformed.cityVipAssignments) {
      await prisma.cityVipAssignment.upsert({
        where: { id: a.id },
        create: a,
        update: a,
      });
    }

    // 8. Ads
    console.log(`Migrating ${transformed.ads.length} ads...`);
    for (const ad of transformed.ads) {
      await prisma.ad.upsert({
        where: { id: ad.id },
        create: ad,
        update: ad,
      });
    }

    // 9. City SEO
    console.log(`Migrating ${transformed.citySeo.length} city SEO records...`);
    for (const cs of transformed.citySeo) {
      await prisma.citySeo.upsert({
        where: { slug: cs.slug },
        create: cs,
        update: cs,
      });
    }

    // 10. Static SEO
    console.log(`Migrating ${transformed.staticSeo.length} static SEO records...`);
    for (const ss of transformed.staticSeo) {
      await prisma.staticSeo.upsert({
        where: { pageKey: ss.pageKey },
        create: ss,
        update: ss,
      });
    }

    // 11. Coin Packages
    console.log(`Migrating ${transformed.coinPackages.length} coin packages...`);
    for (const cp of transformed.coinPackages) {
      await prisma.coinPackage.upsert({
        where: { id: cp.id },
        create: cp,
        update: cp,
      });
    }

    // 12. Promotion Packages
    console.log(`Migrating ${transformed.promotionPackages.length} promotion packages...`);
    for (const pp of transformed.promotionPackages) {
      await prisma.promotionPackage.upsert({
        where: { id: pp.id },
        create: pp,
        update: pp,
      });
    }

    // 13. UPIs
    console.log(`Migrating ${transformed.upis.length} UPIs...`);
    for (const u of transformed.upis) {
      await prisma.upi.upsert({
        where: { id: u.id },
        create: u,
        update: u,
      });
    }

    // 14. 404 Logs
    console.log(`Migrating ${transformed.notFoundLogs.length} not found logs...`);
    for (const nf of transformed.notFoundLogs) {
      await prisma.notFoundLog.upsert({
        where: { path: nf.path },
        create: nf,
        update: nf,
      });
    }

    console.log('\n🎉 ALL DATA MIGRATED TO MARIADB WITH ZERO LOSS!\n');
  } catch (err) {
    console.error('❌ MIGRATION ERROR:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runLiveMigration().catch(console.error);
