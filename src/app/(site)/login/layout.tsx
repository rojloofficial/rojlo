import type { Metadata } from "next";
import { siteConfig, publicRobotsConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Login | Rojlo",
  description: "Log in to your Rojlo account to manage your ads, listings, and profile.",
  alternates: {
    canonical: `${siteConfig.url}/login`,
  },
  robots: publicRobotsConfig,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
