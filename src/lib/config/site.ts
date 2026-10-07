function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (
    envUrl &&
    (envUrl.startsWith("https://") || envUrl.startsWith("http://")) &&
    !envUrl.includes("localhost") &&
    !envUrl.includes("127.0.0.1")
  ) {
    return envUrl.replace(/\/+$/, "");
  }
  return "https://rojloo.vercel.app";
}

const siteUrl = resolveSiteUrl();

export const siteConfig = {
  name: "Rojlo",
  description: "Rojlo – Find services, places and post ads in your city.",
  url: siteUrl,
  locale: "en_US",
} as const;

export const publicRobotsConfig = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
} as const;

