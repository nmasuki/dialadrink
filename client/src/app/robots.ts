import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout/success", "/checkout/processing"],
      },
    ],
    sitemap: "https://www.dialadrinkkenya.com/sitemap.xml",
  };
}
