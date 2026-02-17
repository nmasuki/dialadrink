/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["mongoose"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 5184000,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: [
      "react-icons",
      "date-fns",
      "zod",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "@tiptap/react",
      "@tiptap/starter-kit",
    ],
  },
  async redirects() {
    return [
      {
        source: "/product/:slug",
        destination: "/products/:slug",
        permanent: true,
      },
      // Old query-param URLs → clean URLs
      {
        source: "/products",
        has: [{ type: "query", key: "category", value: "(?<cat>.+)" }],
        destination: "/:cat",
        permanent: true,
      },
      {
        source: "/products",
        has: [{ type: "query", key: "subcategory", value: "(?<sub>.+)" }],
        destination: "/:sub",
        permanent: true,
      },
      {
        source: "/products",
        has: [{ type: "query", key: "brand", value: "(?<brand>.+)" }],
        destination: "/:brand",
        permanent: true,
      },
      {
        source: "/products",
        has: [{ type: "query", key: "onOffer", value: "true" }],
        destination: "/offers",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
