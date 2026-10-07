import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactActions from "@/components/ads/ContactActions";
import { Card, SectionPanel } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { listAdsByCity } from "@/lib/models/ad";
import { getCitySeo } from "@/lib/models/city-seo";
import { getCityBySlug, listAllCities } from "@/lib/models/city";
import { listLocalAreas } from "@/lib/models/localArea";
import { isAdActiveInCurrentShift, getTierRankInfo } from "@/lib/promo-shifts";
import { siteConfig, publicRobotsConfig } from "@/lib/config/site";
import { JsonLd } from "@/components/seo/json-ld";
import CityFaqSection from "@/components/places/city-faq-section";
import { cityPlaces } from "@/lib/places";
import { serviceCards } from "@/lib/services";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location: slug } = await params;
  let city = await getCityBySlug(slug);
  const rawSeo =
    (await getCitySeo(slug)) ||
    (city ? await getCitySeo(city.slug) : null);
  const seo = rawSeo?.status === "published" ? rawSeo : null;

  if (!city && seo) {
    city = {
      _id: seo.slug,
      name: seo.name || seo.slug,
      slug: seo.slug,
      state: "",
      region: "",
      famousFood: "",
      seoDescription: seo.description,
      createdAt: new Date(),
    };
  }

  if (!city) {
    return {
      title: "City not found",
      robots: { index: false, follow: false },
    };
  }

  const rawTitle =
    seo?.title?.trim() ||
    `Best Places & Services in ${city.name}`;
  // Strip trailing "| Rojlo" so the root layout template "%s | Rojlo" appends it cleanly once
  const title = rawTitle.replace(/\s*\|\s*Rojlo\s*$/i, "").trim();

  const staticCity = cityPlaces.find(
    (c) =>
      c.slug.toLowerCase() === slug.toLowerCase() ||
      c.slug.toLowerCase() === city?.slug.toLowerCase() ||
      c.name.trim().toLowerCase() === city?.name.trim().toLowerCase()
  );
  const citySeoDesc = city.seoDescription?.trim() || staticCity?.seoDescription?.trim();

  const description =
    seo?.description?.trim() ||
    citySeoDesc ||
    `Explore the best places and local services in ${city.name}${city.state ? `, ${city.state}` : ""}. Discover trusted service providers and post ads on Rojlo.`;

  const keywords =
    [
      seo?.primaryKeyword?.trim(),
      ...(seo?.popularSearches ?? []).map((k) => k.trim()),
      ...(seo?.secondaryKeywords ?? []).map((k) => k.trim()),
      ...(seo?.longTailKeywords ?? []).map((k) => k.trim()),
    ]
      .filter(Boolean)
      .join(", ") || undefined;

  let canonical = `${siteConfig.url}/places/${city.slug || slug}`;
  if (seo?.canonicalUrl?.trim()) {
    try {
      const parsed = new URL(seo.canonicalUrl.trim(), siteConfig.url);
      canonical = `${siteConfig.url}${parsed.pathname}`;
    } catch {
      canonical = `${siteConfig.url}/places/${city.slug || slug}`;
    }
  }
  const ogImage = seo?.featuredImage?.trim() || `${siteConfig.url}/rojlo.png`;
  const fullSocialTitle = `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    robots: publicRobotsConfig,
    openGraph: {
      title: fullSocialTitle,
      description,
      url: canonical,
      type: "website",
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${city.name} - Services & Places on Rojlo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullSocialTitle,
      description,
      images: [ogImage],
    },
  };
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<{ location: string }>;
  searchParams?: Promise<{ preview?: string }>;
}) {
  const { location: slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const isPreview = sParams.preview === "true" || sParams.preview === "1";
  return <CityContent slug={slug} isPreview={isPreview} />;
}

async function CityContent({
  slug,
  isPreview = false,
}: {
  slug: string;
  isPreview?: boolean;
}) {
  let city = await getCityBySlug(slug);
  const seo =
    (await getCitySeo(slug)) ||
    (city ? await getCitySeo(city.slug) : null);

  // Fallback: If city not yet indexed in static/custom list but SEO exists, synthesize city record
  if (!city && seo) {
    city = {
      _id: seo.slug,
      name: seo.name || seo.slug,
      slug: seo.slug,
      state: "",
      region: "",
      famousFood: "",
      seoDescription: seo.description,
      createdAt: new Date(),
    };
  }

  if (!city) notFound();

  const [ads, localAreas, allCities] = await Promise.all([
    listAdsByCity(city.name),
    listLocalAreas({ cityName: city.name, citySlug: city.slug }),
    city.state ? listAllCities() : Promise.resolve([]),
  ]);

  const siblingCities = city.state
    ? allCities
        .filter(
          (c) =>
            c.state &&
            c.state.trim().toLowerCase() === city.state?.trim().toLowerCase() &&
            c.slug.toLowerCase() !== city.slug.toLowerCase()
        )
        .slice(0, 12)
    : [];

  const staticCity = cityPlaces.find(
    (c) =>
      c.slug.toLowerCase() === city?.slug.toLowerCase() ||
      c.name.trim().toLowerCase() === city?.name.trim().toLowerCase()
  );
  const famousFood = city.famousFood?.trim() || staticCity?.famousFood?.trim() || "";
  const citySeoDesc = city.seoDescription?.trim() || staticCity?.seoDescription?.trim() || "";

  const defaultFaqs = [
    {
      id: "faq-post-ad",
      question: `How can I post a service ad in ${city.name}?`,
      answer: `Service providers and advertisers can post verified listings in ${city.name} by visiting our ad posting portal at /post-ad/new. Select ${city.name}, choose your service category, and enter your verified contact information.`,
    },
    {
      id: "faq-availability",
      question: `What services are available in ${city.name}?`,
      answer: `Rojlo features listings across categories including Call Girls, Male Escorts, and Massage therapy in ${city.name}${city.state ? `, ${city.state}` : ""}. Providers update their availability and contact channels directly.`,
    },
    {
      id: "faq-nearby",
      question: `How do I find listings in other cities near ${city.name}?`,
      answer: `You can browse neighboring cities in ${city.state || "the region"} using the regional directory below, or search the complete nationwide directory on the Rojlo Places page.`,
    },
  ];

  const hasCustomFaqs = Boolean(seo?.faqs && seo.faqs.length > 0);
  const faqsToRender = hasCustomFaqs ? seo!.faqs! : defaultFaqs;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Places",
        item: `${siteConfig.url}/places`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: city.name,
        item: `${siteConfig.url}/places/${city.slug}`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Services in ${city.name}`,
    description: `Explore verified services and places in ${city.name} on Rojlo.`,
    url: `${siteConfig.url}/places/${city.slug}`,
    about: {
      "@type": "City",
      name: city.name,
      containedInPlace: city.state ? { "@type": "AdministrativeArea", name: city.state } : undefined,
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqsToRender
      .filter((f) => f.question?.trim() && f.answer?.trim())
      .map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
  };

  const isPublished = seo?.status === "published";
  const shouldShowSeo = Boolean(seo && (isPublished || isPreview));

  const popularKeywords = Array.from(
    new Set([
      ...(seo?.popularSearches ?? []),
      ...(seo?.secondaryKeywords ?? []),
      ...(seo?.longTailKeywords ?? []),
    ])
  )
    .map((k) => (typeof k === "string" ? k.trim() : ""))
    .filter(Boolean);

  return (
    <main>
      {isPreview && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-300 bg-gray-500 px-4 py-2.5 text-white shadow-md">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-gray-100">
              {seo?.status === "draft" ? "Draft Preview" : "Live Preview"}
            </span>
            <span>
              Preview Mode — Viewing {seo?.status === "draft" ? "Draft" : "Published"} SEO Content for {city.name}
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs font-medium text-gray-100">
            Draft content is visible only with preview link
          </span>
        </div>
      )}

      <JsonLd data={[breadcrumbSchema, collectionSchema, faqSchema]} />
      <section className="px-4 py-10 sm:px-6">
        <SectionPanel>
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Places", href: "/places" },
              { label: city.name },
            ]}
          />
          <div className="mt-4">
            <Eyebrow>Services in {city.name}</Eyebrow>
          </div>
          <h1 className="mt-3 text-2xl font-black text-gray-950 sm:text-3xl">
            Services & Places in {city.name}
          </h1>

          {localAreas.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-950">
                Popular Areas in {city.name}:
              </span>
              {localAreas.map((area) => (
                <Link
                  key={area._id ?? area.slug}
                  href={`/places/${city.slug}/${area.slug}`}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-900 transition hover:bg-gray-100 hover:border-gray-300"
                >
                  {area.name}
                </Link>
              ))}
            </div>
          )}

          {ads.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-6 sm:p-8 text-center">
              <h2 className="text-lg font-bold text-gray-950 sm:text-xl">
                No active listings currently posted in {city.name}
              </h2>
              <p className="mt-2 text-sm text-gray-700 max-w-xl mx-auto">
                Be the first provider to publish a verified service ad in {city.name}. Connect with local clients looking for professional services across {city.state || city.region || "the region"}.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/post-ad/new"
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                >
                  Post a Service in {city.name}
                </Link>
                <Link
                  href="/places"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
                >
                  Browse All Cities
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ads.map((ad, idx) => (
                <Card
                  key={ad._id}
                  className="group relative min-h-[28rem] sm:min-h-[30rem] p-5 sm:p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
                >
                  {ad._id && (
                    <Link
                      href={`/places/${city.slug}/${ad._id}`}
                      aria-label={`View details for ${ad.name}`}
                      className="absolute inset-0 z-0 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
                    />
                  )}

                  {isAdActiveInCurrentShift(ad) && (
                    <span className={`pointer-events-none absolute left-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black sm:left-6 sm:top-6 shadow-xs ${getTierRankInfo(ad.promoTier, ad.promoPackage).badgeClass}`}>
                      {getTierRankInfo(ad.promoTier, ad.promoPackage).badge}
                    </span>
                  )}

                  {ad.city && (
                    <span className="pointer-events-none absolute right-3.5 top-3.5 z-10 inline-flex max-w-[12rem] sm:max-w-xs items-center truncate rounded-full bg-gray-100 px-2.5 sm:px-3 py-1 text-xs font-semibold text-gray-800 sm:right-6 sm:top-6">
                      {ad.city}
                    </span>
                  )}

                  <div className="pointer-events-none relative z-10">
                    <h2 className="pr-20 sm:pr-24 text-lg sm:text-xl font-black text-gray-950 break-words">
                      {ad.name}
                    </h2>

                    {ad.about && (
                      <p className="mt-2 text-sm leading-6 sm:leading-7 text-gray-900 line-clamp-3">
                        {ad.about}
                      </p>
                    )}

                    {ad.images[0] && (
                      <div className="relative mt-4 h-56 overflow-hidden rounded-[1rem] bg-gray-50 sm:h-64">
                        <Image
                          src={ad.images[0]}
                          alt={`${ad.name} - Services in ${city.name}`}
                          fill
                          className="object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                          preload={idx === 0}
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                    <ContactActions
                      phone={ad.phone}
                      whatsapp={ad.whatsapp}
                      telegram={ad.telegram}
                      cityName={ad.city || city.name}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </SectionPanel>
      </section>

      {shouldShowSeo && seo?.content && seo.content.length > 0 ? (
        <section className="px-4 py-10 sm:px-6">
          <SectionPanel>
            <Eyebrow>City Guide</Eyebrow>
            {seo.featuredImage && (
              <div className="relative mt-4 h-64 sm:h-80 w-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
                <Image
                  src={seo.featuredImage}
                  alt={seo.imageAlt || `${city.name} guide`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 900px"
                />
              </div>
            )}
            {seo.content.map((block) => {
              if (block.type === "h1" || block.type === "h2") {
                return (
                  <h2
                    key={block.id}
                    className="mt-6 text-2xl font-bold text-gray-950 sm:text-3xl"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "h3") {
                return (
                  <h3
                    key={block.id}
                    className="mt-4 text-xl font-bold text-gray-950 sm:text-2xl"
                  >
                    {block.text}
                  </h3>
                );
              }
              return (
                <p
                  key={block.id}
                  className="mt-3 leading-7 text-gray-900"
                >
                  {block.text}
                </p>
              );
            })}
          </SectionPanel>
        </section>
      ) : (
        <section className="px-4 py-8 sm:px-6">
          <SectionPanel>
            <Eyebrow>About {city.name}</Eyebrow>
            <h2 className="mt-3 text-2xl font-black text-gray-950 sm:text-3xl">
              About Services & Places in {city.name}
            </h2>

            {citySeoDesc ? (
              <p className="mt-4 leading-7 text-gray-900 text-sm sm:text-base">
                {citySeoDesc}
              </p>
            ) : (
              <p className="mt-4 leading-7 text-gray-900 text-sm sm:text-base">
                Discover local services, entertainment, and verified classifieds in {city.name}
                {city.state ? `, ${city.state}` : ""}. Rojlo connects clients and advertisers directly with verified contact channels.
              </p>
            )}

            {famousFood && (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50/80 p-5 sm:p-6">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700">
                  Local Specialties & Food Culture
                </h3>
                <p className="mt-2 text-sm sm:text-base font-medium text-gray-900 leading-relaxed">
                  {city.name} is celebrated for local culinary favorites including <span className="font-semibold">{famousFood}</span>.
                </p>
              </div>
            )}

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-950 sm:text-xl">
                Popular Service Categories in {city.name}
              </h3>
              <p className="mt-1 text-sm text-gray-700">
                Explore verified listings or publish your advertisement in these core categories:
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {serviceCards.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-2xs transition hover:border-gray-300"
                  >
                    <div>
                      <h4 className="text-base font-bold text-gray-950">
                        {service.title}
                      </h4>
                      <p className="mt-2 text-xs leading-relaxed text-gray-700 line-clamp-3">
                        {service.description.replace(/\*/g, "")}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Link
                        href="/post-ad/new"
                        className="text-xs font-bold text-gray-900 underline underline-offset-2 hover:text-black"
                      >
                        Post in {city.name} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionPanel>
        </section>
      )}

      <CityFaqSection faqs={faqsToRender} cityName={city.name} />

      {shouldShowSeo && popularKeywords.length > 0 && (
        <section className="px-4 py-8 sm:px-6">
          <SectionPanel>
            <Eyebrow className="text-center">Popular Searches</Eyebrow>
            <h2 className="mt-3 text-center text-2xl font-black text-gray-950 sm:text-3xl">
              Most Search in {city.name}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {popularKeywords.map((keyword, index) => (
                <span
                  key={`${keyword}-${index}`}
                  className="select-none rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-950 shadow-2xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </SectionPanel>
        </section>
      )}

      {siblingCities.length > 0 && (
        <section className="px-4 py-8 sm:px-6">
          <SectionPanel>
            <Eyebrow>Regional Directory</Eyebrow>
            <h2 className="mt-3 text-xl font-bold text-gray-950 sm:text-2xl">
              More Cities in {city.state}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {siblingCities.map((sibling) => (
                <Link
                  key={sibling.slug}
                  href={`/places/${sibling.slug}`}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-xs font-semibold text-gray-950 transition hover:bg-gray-100 hover:border-gray-300"
                >
                  {sibling.name}
                </Link>
              ))}
            </div>
          </SectionPanel>
        </section>
      )}

      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 text-sm">
          <span className="font-semibold text-gray-900">
            Explore more locations and services on Rojlo:
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/places"
              className="font-bold text-gray-900 underline underline-offset-2 hover:text-black"
            >
              All Indian Cities
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/services"
              className="font-bold text-gray-900 underline underline-offset-2 hover:text-black"
            >
              Our Services
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/post-ad/new"
              className="font-bold text-gray-900 underline underline-offset-2 hover:text-black"
            >
              Post Free Ad
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
