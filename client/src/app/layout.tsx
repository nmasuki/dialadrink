import type { Metadata } from "next";
import { headers } from "next/headers";
import { Toaster } from "react-hot-toast";
import { Header, Footer } from "@/components/layout";
import StickyCartBar from "@/components/cart/StickyCartBar";
import ScrollToTop from "@/components/common/ScrollToTop";
import "./globals.css";

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
    opens: "09:00",
    closes: "22:00",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
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
