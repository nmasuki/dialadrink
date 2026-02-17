import type { Metadata } from "next";
import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { Montserrat, Open_Sans } from "next/font/google";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

const StickyCartBar = dynamic(() => import("@/components/cart/StickyCartBar"));
const ScrollToTop = dynamic(() => import("@/components/common/ScrollToTop"));
const Toaster = dynamic(() => import("react-hot-toast").then((m) => m.Toaster));

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-opensans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dial A Drink Kenya - Alcohol Delivery Nairobi",
    template: "%s | Dial A Drink Kenya",
  },
  description:
    "Kenyas leading online alcohol delivery service. Order whisky, beer, wine and more with fast delivery across Nairobi and major cities.",
  keywords: [
    "alcohol delivery",
    "nairobi",
    "kenya",
    "whisky",
    "beer",
    "wine",
    "spirits",
    "online liquor store",
  ],
  authors: [{ name: "Dial A Drink Kenya" }],
  creator: "Dial A Drink Kenya",
  publisher: "Dial A Drink Kenya",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.dialadrinkkenya.com"
  ),
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "/",
    siteName: "Dial A Drink Kenya",
    title: "Dial A Drink Kenya - Alcohol Delivery Nairobi",
    description:
      "Kenyas leading online alcohol delivery service. Order whisky, beer, wine and more with fast delivery.",
    images: [
      {
        url: "https://res.cloudinary.com/nmasuki/image/upload/c_fill/icons/apple-icon-152x152.png",
        width: 152,
        height: 152,
        alt: "Dial A Drink Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@liqourdelivery",
    creator: "@liqourdelivery",
  },
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "https://res.cloudinary.com/nmasuki/image/upload/c_fill,w_180,h_180/icons/apple-icon-152x152.png", sizes: "180x180" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Organization JSON-LD structured data
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dial A Drink Kenya",
  url: "https://www.dialadrinkkenya.com",
  logo: "https://res.cloudinary.com/nmasuki/image/upload/c_fit,w_207,h_50/logo.png",
  sameAs: [
    "https://www.facebook.com/dialadrinkkenya",
    "https://twitter.com/liqourdelivery",
    "https://www.instagram.com/dialadrinkkenya",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+254723688108",
    contactType: "customer service",
    areaServed: "KE",
    availableLanguage: ["English", "Swahili"],
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nairobi",
    addressCountry: "KE",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Dial A Drink Kenya",
  url: "https://www.dialadrinkkenya.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://www.dialadrinkkenya.com/products?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LiquorStore",
  name: "Dial A Drink Kenya",
  image: "https://res.cloudinary.com/nmasuki/image/upload/c_fit,w_207,h_50/logo.png",
  url: "https://www.dialadrinkkenya.com",
  telephone: "+254723688108",
  priceRange: "KES 200 - KES 50000",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Nairobi",
    addressRegion: "Nairobi",
    addressCountry: "KE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -1.2921,
    longitude: 36.8219,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
  areaServed: {
    "@type": "City",
    name: "Nairobi",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-next-url") || headersList.get("x-invoke-path") || "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        {!isAdmin && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
            />
          </>
        )}
      </head>
      <body className={isAdmin ? "min-h-screen" : "min-h-screen flex flex-col"}>
        {!isAdmin && <Header />}
        {!isAdmin && <ScrollToTop />}
        {isAdmin ? children : <main className="flex-1 pb-20">{children}</main>}
        {!isAdmin && <Footer />}
        {!isAdmin && <StickyCartBar />}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
            },
            success: {
              iconTheme: {
                primary: "#4caf50",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#f44336",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
