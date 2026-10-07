import "server-only";
import { prisma, isMariaDbConfigured } from "./prisma";
import type { User, PublicUser } from "./models/user";
import type { Ad } from "./models/ad";
import type { CitySeo, ContentBlock, FaqItem, SeoStatus } from "./models/city-seo";
import type { Prisma, Ad as PrismaAd } from "@prisma/client";
import type { ServiceRate } from "@/components/post-ad/types";

export { isMariaDbConfigured };

// Helper to convert Date/string
function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ============================================================================
// 1. USERS
// ============================================================================
export const MariaDbUsers = {
  async findByEmail(email: string): Promise<User | null> {
    if (!isMariaDbConfigured()) return null;
    const cleanEmail = email.trim().toLowerCase();
    const row = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!row) return null;
    return {
      _id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      service: row.service ?? undefined,
      coins: row.coins,
      passwordHash: row.passwordHash,
      sessionToken: row.sessionToken ?? undefined,
      emailVerified: row.emailVerified,
      otpHash: row.otpHash ?? undefined,
      otpHashes: Array.isArray(row.otpHashes) ? (row.otpHashes as string[]) : undefined,
      otpExpires: row.otpExpires ?? undefined,
      otpAttempts: row.otpAttempts,
      otpLastSentAt: row.otpLastSentAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async findById(id: string): Promise<User | null> {
    if (!isMariaDbConfigured()) return null;
    const row = await prisma.user.findUnique({ where: { id } });
    if (!row) return null;
    return {
      _id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      service: row.service ?? undefined,
      coins: row.coins,
      passwordHash: row.passwordHash,
      sessionToken: row.sessionToken ?? undefined,
      emailVerified: row.emailVerified,
      otpHash: row.otpHash ?? undefined,
      otpHashes: Array.isArray(row.otpHashes) ? (row.otpHashes as string[]) : undefined,
      otpExpires: row.otpExpires ?? undefined,
      otpAttempts: row.otpAttempts,
      otpLastSentAt: row.otpLastSentAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async findBySessionToken(token: string): Promise<User | null> {
    if (!isMariaDbConfigured() || !token) return null;
    const row = await prisma.user.findUnique({ where: { sessionToken: token } });
    if (!row) return null;
    return {
      _id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? undefined,
      service: row.service ?? undefined,
      coins: row.coins,
      passwordHash: row.passwordHash,
      sessionToken: row.sessionToken ?? undefined,
      emailVerified: row.emailVerified,
      otpHash: row.otpHash ?? undefined,
      otpHashes: Array.isArray(row.otpHashes) ? (row.otpHashes as string[]) : undefined,
      otpExpires: row.otpExpires ?? undefined,
      otpAttempts: row.otpAttempts,
      otpLastSentAt: row.otpLastSentAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async createUser(data: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<PublicUser> {
    const cleanEmail = data.email.trim().toLowerCase();
    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: cleanEmail,
        phone: data.phone,
        service: data.service,
        coins: Number(data.coins ?? 0),
        passwordHash: data.passwordHash,
        sessionToken: data.sessionToken,
        emailVerified: Boolean(data.emailVerified),
        otpHash: data.otpHash,
        otpHashes: data.otpHashes ? (data.otpHashes as Prisma.InputJsonValue) : undefined,
        otpExpires: data.otpExpires,
        otpAttempts: Number(data.otpAttempts ?? 0),
        otpLastSentAt: data.otpLastSentAt,
      },
    });
    return {
      _id: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone ?? undefined,
      service: created.service ?? undefined,
      coins: created.coins,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  async setSession(userId: string, token: string): Promise<boolean> {
    if (!isMariaDbConfigured()) return false;
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { sessionToken: token, updatedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  },

  async updateCoins(userId: string, delta: number): Promise<boolean> {
    if (!isMariaDbConfigured()) return false;
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { coins: { increment: delta }, updatedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  },

  async listUsers(): Promise<PublicUser[]> {
    if (!isMariaDbConfigured()) return [];
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map((u) => ({
      _id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ?? undefined,
      service: u.service ?? undefined,
      coins: u.coins,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  },
};

// ============================================================================
// 2. ADS
// ============================================================================
function rowToAd(row: PrismaAd): Ad {
  return {
    _id: row.id,
    userId: row.userId,
    name: row.name,
    title: row.title ?? undefined,
    age: row.age ?? undefined,
    category: row.category,
    toServe: Array.isArray(row.toServe) ? (row.toServe as string[]) : undefined,
    placeOfService: Array.isArray(row.placeOfService) ? (row.placeOfService as string[]) : undefined,
    state: row.state ?? undefined,
    city: row.city,
    localArea: row.localArea ?? undefined,
    pincode: row.pincode ?? undefined,
    phone: row.phone,
    whatsapp: row.whatsapp ?? undefined,
    telegram: row.telegram ?? undefined,
    about: row.about,
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    status: row.status,
    serviceRates: Array.isArray(row.serviceRates) ? (row.serviceRates as unknown as ServiceRate[]) : undefined,
    promoted: row.promoted,
    isPromoted: row.isPromoted,
    promotedFrom: row.promotedFrom ?? undefined,
    promotedUntil: row.promotedUntil ?? undefined,
    promoPackage: row.promoPackage ?? undefined,
    promoTier: row.promoTier ?? undefined,
    promoShift: row.promoShift ?? undefined,
    isFreeAd: row.isFreeAd ?? undefined,
    isVisibleOnCityPage: row.isVisibleOnCityPage ?? undefined,
    requiresPromotion: row.requiresPromotion ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const MariaDbAds = {
  async findById(id: string): Promise<Ad | null> {
    if (!isMariaDbConfigured()) return null;
    const row = await prisma.ad.findUnique({ where: { id } });
    return row ? rowToAd(row) : null;
  },

  async listByUser(userId: string): Promise<Ad[]> {
    if (!isMariaDbConfigured()) return [];
    const rows = await prisma.ad.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(rowToAd);
  },

  async listByCity(city: string): Promise<Ad[]> {
    if (!isMariaDbConfigured()) return [];
    const rows = await prisma.ad.findMany({
      where: {
        city: { equals: city.trim() },
        status: { notIn: ["deleted", "suspended", "inactive"] },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map(rowToAd);
  },

  async listAllAds(limit = 500): Promise<Ad[]> {
    if (!isMariaDbConfigured()) return [];
    const rows = await prisma.ad.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(rowToAd);
  },

  async createAd(ad: Omit<Ad, "_id" | "createdAt" | "updatedAt">): Promise<Ad> {
    const row = await prisma.ad.create({
      data: {
        userId: ad.userId,
        name: ad.name,
        title: ad.title,
        age: ad.age,
        category: ad.category,
        toServe: ad.toServe ? (ad.toServe as Prisma.InputJsonValue) : undefined,
        placeOfService: ad.placeOfService ? (ad.placeOfService as Prisma.InputJsonValue) : undefined,
        state: ad.state,
        city: ad.city,
        localArea: ad.localArea,
        pincode: ad.pincode,
        phone: ad.phone,
        whatsapp: ad.whatsapp,
        telegram: ad.telegram,
        about: ad.about,
        images: (ad.images || []) as Prisma.InputJsonValue,
        status: ad.status || "active",
        serviceRates: ad.serviceRates ? (ad.serviceRates as unknown as Prisma.InputJsonValue) : undefined,
        promoted: Boolean(ad.promoted),
        isPromoted: Boolean(ad.isPromoted),
        promotedFrom: toDate(ad.promotedFrom),
        promotedUntil: toDate(ad.promotedUntil),
        promoPackage: ad.promoPackage,
        promoTier: ad.promoTier,
        promoShift: ad.promoShift,
        isFreeAd: ad.isFreeAd,
        isVisibleOnCityPage: ad.isVisibleOnCityPage,
        requiresPromotion: ad.requiresPromotion,
      },
    });
    return rowToAd(row);
  },

  async updateAd(id: string, updates: Partial<Ad>): Promise<Ad | null> {
    if (!isMariaDbConfigured()) return null;
    try {
      const data: Prisma.AdUpdateInput = {};
      if (updates.name !== undefined) data.name = updates.name;
      if (updates.title !== undefined) data.title = updates.title;
      if (updates.age !== undefined) data.age = updates.age;
      if (updates.category !== undefined) data.category = updates.category;
      if (updates.city !== undefined) data.city = updates.city;
      if (updates.state !== undefined) data.state = updates.state;
      if (updates.phone !== undefined) data.phone = updates.phone;
      if (updates.whatsapp !== undefined) data.whatsapp = updates.whatsapp;
      if (updates.telegram !== undefined) data.telegram = updates.telegram;
      if (updates.about !== undefined) data.about = updates.about;
      if (updates.status !== undefined) data.status = updates.status;
      if (updates.images !== undefined) data.images = updates.images as Prisma.InputJsonValue;
      if (updates.toServe !== undefined) data.toServe = updates.toServe as Prisma.InputJsonValue;
      if (updates.placeOfService !== undefined) data.placeOfService = updates.placeOfService as Prisma.InputJsonValue;
      if (updates.serviceRates !== undefined) data.serviceRates = updates.serviceRates as unknown as Prisma.InputJsonValue;
      if (updates.promoted !== undefined) data.promoted = updates.promoted;
      if (updates.isPromoted !== undefined) data.isPromoted = updates.isPromoted;
      if (updates.promotedFrom !== undefined) data.promotedFrom = toDate(updates.promotedFrom);
      if (updates.promotedUntil !== undefined) data.promotedUntil = toDate(updates.promotedUntil);
      if (updates.promoPackage !== undefined) data.promoPackage = updates.promoPackage;
      if (updates.promoTier !== undefined) data.promoTier = updates.promoTier;
      if (updates.promoShift !== undefined) data.promoShift = updates.promoShift;

      const row = await prisma.ad.update({
        where: { id },
        data,
      });
      return rowToAd(row);
    } catch {
      return null;
    }
  },

  async deleteAd(id: string): Promise<boolean> {
    if (!isMariaDbConfigured()) return false;
    try {
      await prisma.ad.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};

// ============================================================================
// 3. CITY SEO
// ============================================================================
export const MariaDbCitySeo = {
  async findBySlug(slug: string): Promise<CitySeo | null> {
    if (!isMariaDbConfigured()) return null;
    const cleanSlug = slug.trim().toLowerCase();
    const row = await prisma.citySeo.findUnique({ where: { slug: cleanSlug } });
    if (!row) return null;
    return {
      slug: row.slug,
      urlSlug: row.urlSlug ?? undefined,
      name: row.name,
      title: row.title,
      description: row.description,
      canonicalUrl: row.canonicalUrl ?? undefined,
      primaryKeyword: row.primaryKeyword ?? undefined,
      secondaryKeywords: Array.isArray(row.secondaryKeywords) ? (row.secondaryKeywords as string[]) : undefined,
      keywords: row.keywords ?? "",
      longTailKeywords: Array.isArray(row.longTailKeywords) ? (row.longTailKeywords as string[]) : undefined,
      popularSearches: Array.isArray(row.popularSearches) ? (row.popularSearches as string[]) : undefined,
      featuredImage: row.featuredImage ?? undefined,
      imageAlt: row.imageAlt ?? undefined,
      content: Array.isArray(row.content) ? (row.content as unknown as ContentBlock[]) : [],
      faqs: Array.isArray(row.faqs) ? (row.faqs as unknown as FaqItem[]) : [],
      status: (row.status as SeoStatus) || "published",
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    };
  },

  async getAll(): Promise<CitySeo[]> {
    if (!isMariaDbConfigured()) return [];
    const rows = await prisma.citySeo.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => ({
      slug: row.slug,
      urlSlug: row.urlSlug ?? undefined,
      name: row.name,
      title: row.title,
      description: row.description,
      canonicalUrl: row.canonicalUrl ?? undefined,
      primaryKeyword: row.primaryKeyword ?? undefined,
      secondaryKeywords: Array.isArray(row.secondaryKeywords) ? (row.secondaryKeywords as string[]) : undefined,
      keywords: row.keywords ?? "",
      longTailKeywords: Array.isArray(row.longTailKeywords) ? (row.longTailKeywords as string[]) : undefined,
      popularSearches: Array.isArray(row.popularSearches) ? (row.popularSearches as string[]) : undefined,
      featuredImage: row.featuredImage ?? undefined,
      imageAlt: row.imageAlt ?? undefined,
      content: Array.isArray(row.content) ? (row.content as unknown as ContentBlock[]) : [],
      faqs: Array.isArray(row.faqs) ? (row.faqs as unknown as FaqItem[]) : [],
      status: (row.status as SeoStatus) || "published",
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    }));
  },

  async upsert(data: CitySeo): Promise<CitySeo> {
    const cleanSlug = data.slug.trim().toLowerCase();
    const payload = {
      slug: cleanSlug,
      urlSlug: data.urlSlug?.trim().toLowerCase() ?? cleanSlug,
      name: data.name,
      title: data.title,
      description: data.description,
      canonicalUrl: data.canonicalUrl,
      primaryKeyword: data.primaryKeyword,
      secondaryKeywords: data.secondaryKeywords ? (data.secondaryKeywords as Prisma.InputJsonValue) : undefined,
      keywords: data.keywords ?? "",
      longTailKeywords: data.longTailKeywords ? (data.longTailKeywords as Prisma.InputJsonValue) : undefined,
      popularSearches: data.popularSearches ? (data.popularSearches as Prisma.InputJsonValue) : undefined,
      featuredImage: data.featuredImage,
      imageAlt: data.imageAlt,
      content: (data.content || []) as unknown as Prisma.InputJsonValue,
      faqs: (data.faqs || []) as unknown as Prisma.InputJsonValue,
      status: data.status || "published",
    };

    const row = await prisma.citySeo.upsert({
      where: { slug: cleanSlug },
      create: {
        id: `cseo_${Date.now()}`,
        ...payload,
      },
      update: payload,
    });

    return {
      slug: row.slug,
      urlSlug: row.urlSlug ?? undefined,
      name: row.name,
      title: row.title,
      description: row.description,
      keywords: row.keywords ?? "",
      content: Array.isArray(row.content) ? (row.content as unknown as ContentBlock[]) : [],
      faqs: Array.isArray(row.faqs) ? (row.faqs as unknown as FaqItem[]) : [],
      status: (row.status as SeoStatus) || "published",
      updatedAt: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    };
  },
};
