import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? "https://bentido.in";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/cookies", "/sign-in", "/sign-up"],
        disallow: [
          "/admin",
          "/worker",
          "/dashboard",
          "/agreement",
          "/onboarding",
          "/api",
          "/reset-password",
          "/counterparty",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
