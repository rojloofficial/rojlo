import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config/site";
import { listAllCities } from "@/lib/models/city";
import { listLocalAreas } from "@/lib/models/localArea";
import { getAllLocalAreaSeo, type LocalAreaSeo } from "@/lib/models/local-area-seo";
import { listAllAds, isAdVisiblePublicly, type Ad } from "@/lib/models/ad";

// Revalidate every hour instead of force-dynamic — avoids hitting the DB
// on every single sitemap request while still staying reasonably fresh.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/+$/, "");

  // ── 1. Static public pages ──────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, priority: 1 },
    { url: `${base}/places`, priority: 0.9 },
    { url: `${base}/services`, priority: 0.8 },
    { url: `${base}/about`, priority: 0.7 },
    { url: `${base}/contact`, priority: 0.7 },
    { url: `${base}/login`, priority: 0.6 },
    { url: `${base}/terms`, priority: 0.5 },
    { url: `${base}/privacy-policy`, priority: 0.5 },
    { url: `${base}/refund-policy`, priority: 0.5 },
    { url: `${base}/return-policy`, priority: 0.5 },
    { url: `${base}/disclaimer`, priority: 0.5 },
  ];

  // ── 2. City pages (/places/[slug]) ─────────────────────────────────────
  // citySlugMap is used below by local-area URL construction.
  // Key: lowercase city name OR slug → value: canonical slug string.
  const citySlugMap = new Map<string, string>();
  const cityRoutes: MetadataRoute.Sitemap = [];
  const seenCitySlugs = new Set<string>();

  try {
    const cities = await listAllCities();

    for (const city of cities) {
      if (!city) continue;

      // Normalise slug: lowercase, trim, convert non-alphanumeric to hyphens,
      // strip leading/trailing hyphens. This mirrors the slugify() in city.ts.
      const rawSlug = String(city.slug ?? "").trim().toLowerCase();
      const slug = rawSlug
        .replace(/[^a-z0-9]+/g, "-") // convert special chars to hyphens
        .replace(/^-+|-+$/g, "");    // strip leading/trailing hyphens

      if (!slug || seenCitySlugs.has(slug)) continue;
      seenCitySlugs.add(slug);

      // Register both the slug and the city name as lookup keys
      citySlugMap.set(slug, slug);
      if (city.name) {
        citySlugMap.set(String(city.name).trim().toLowerCase(), slug);
      }

      const entry: MetadataRoute.Sitemap[number] = {
        url: `${base}/places/${slug}`,
        priority: 0.8,
      };

      // Only include lastModified if it is a genuine timestamp (not epoch 0)
      const lastMod = getValidDate(city.createdAt);
      if (lastMod) entry.lastModified = lastMod;

      cityRoutes.push(entry);
    }
  } catch (error) {
    console.error("[sitemap] Failed to load cities:", error);
  }

  // ── 3. Local-area pages (/places/[citySlug]/[areaSlug]) ────────────────
  const localAreaRoutes: MetadataRoute.Sitemap = [];
  const seenLocalAreaUrls = new Set<string>();

  try {
    const [localAreas, allLocalAreaSeo] = await Promise.all([
      listLocalAreas(),
      getAllLocalAreaSeo(),
    ]);

    const seoMap = new Map<string, LocalAreaSeo>();
    for (const s of allLocalAreaSeo) {
      if (!s) continue;
      const cSlug = String(s.citySlug || "").trim().toLowerCase();
      const aSlug = String(s.areaSlug || s.slug || "").trim().toLowerCase();
      if (cSlug && aSlug) {
        seoMap.set(`${cSlug}:${aSlug}`, s);
      }
    }

    for (const area of localAreas) {
      if (!area) continue;

      // Attempt lookup by citySlug first, then fall back to cityName
      const storedCitySlug = String(area.citySlug ?? "").trim().toLowerCase();
      const storedCityName = String(area.cityName ?? "").trim().toLowerCase();
      const citySlug =
        citySlugMap.get(storedCitySlug) ?? citySlugMap.get(storedCityName);

      if (!citySlug) continue; // Skip areas whose parent city is not in the sitemap

      const rawAreaSlug = String(area.slug ?? "").trim().toLowerCase();
      const areaSlug = rawAreaSlug
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!areaSlug) continue;

      // Skip draft or unpublished areas
      const seo = seoMap.get(`${citySlug}:${areaSlug}`);
      if (seo && seo.mode === "individual" && seo.status === "draft") {
        continue;
      }

      const areaUrl = `${base}/places/${citySlug}/${areaSlug}`;
      const normalizedUrl = areaUrl.toLowerCase();
      if (seenLocalAreaUrls.has(normalizedUrl)) continue;
      seenLocalAreaUrls.add(normalizedUrl);

      const entry: MetadataRoute.Sitemap[number] = {
        url: areaUrl,
        priority: 0.7,
      };

      const lastMod = getValidDate(area.createdAt);
      if (lastMod) entry.lastModified = lastMod;

      localAreaRoutes.push(entry);
    }
  } catch (error) {
    console.error("[sitemap] Failed to load local areas:", error);
  }

  // ── 4. Active public listing pages (/places/[citySlug]/[id]) ──────────
  const adRoutes: MetadataRoute.Sitemap = [];
  const seenAdUrls = new Set<string>();

  try {
    const allAds = await listAllAds(500);
    for (const ad of allAds) {
      const adId = ad._id ? String(ad._id) : "";
      if (!ad || !adId || !ad.city) continue;
      const isVisible = await isAdVisiblePublicly(ad as unknown as Ad);
      if (!isVisible) continue;

      const rawCity = String(ad.city).trim().toLowerCase();
      const citySlug =
        citySlugMap.get(rawCity) ||
        rawCity.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      if (!citySlug) continue;

      const adUrl = `${base}/places/${citySlug}/${adId}`;
      const normalizedUrl = adUrl.toLowerCase();
      if (seenAdUrls.has(normalizedUrl)) continue;
      seenAdUrls.add(normalizedUrl);

      const entry: MetadataRoute.Sitemap[number] = {
        url: adUrl,
        priority: 0.6,
      };

      const lastMod = getValidDate(ad.updatedAt || ad.createdAt);
      if (lastMod) entry.lastModified = lastMod;

      adRoutes.push(entry);
    }
  } catch (error) {
    console.error("[sitemap] Failed to load ads for sitemap:", error);
  }

  // ── Combine & deduplicate (normalised lowercase key) ───────────────────
  const allRoutes = [...staticRoutes, ...cityRoutes, ...localAreaRoutes, ...adRoutes];

  const uniqueMap = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const route of allRoutes) {
    const key = route.url.trim().toLowerCase();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, route);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Returns a valid Date only when the value is a real timestamp (i.e. not
 * missing, not NaN, and not the Unix epoch placeholder used for static-data
 * cities whose createdAt is set to new Date(0)).
 *
 * Returns null in all other cases so callers can safely omit lastModified.
 */
function getValidDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  const time = date.getTime();
  // Reject NaN and epoch-zero timestamps (used as "no real date" placeholders)
  if (Number.isNaN(time) || time <= 86_400_000) return null;
  return date;
}