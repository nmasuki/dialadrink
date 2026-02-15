import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/", "/cart", "/checkout/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/cart", "/checkout/"],
      },
    ],
    sitemap: "https://www.dialadrinkkenya.com/sitemap.xml",
  };
}
