import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./(components)/Navigations/Header";
import Footer from "./(components)/Navigations/Footer";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.crochetnbliss.com"),
  title: {
    default: "Crochet n' Bliss | Handmade Crochet, Yarn & Craft Supplies",
    template: "%s | Crochet n' Bliss",
  },
  description:
    "Shop premium handmade crochet products, yarns, cotton yarn, wool yarn, acrylic yarn, crochet gifts, and home décor from Crochet n' Bliss.",
  keywords: [
    "crochet",
    "crochet products",
    "handmade crochet",
    "crochet gifts",
    "yarn shop",
    "yarns",
    "crochet yarn",
    "acrylic yarn",
    "wool yarn",
    "cotton yarn",
    "cotton crochet yarn",
    "Ganga yarn",
    "Ganga cotton yarn",
    "Ganga acrylic yarn",
    "Vardhaman yarn",
    "Vardhaman cotton",
    "Vardhaman acrylic",
    "premium yarn",
    "soft yarn",
    "knitting yarn",
    "craft yarn",
    "handcrafted yarn",
    "crochet home décor",
    "crochet flowers",
    "crochet bags",
    "crochet baskets",
    "crochet wall décor",
    "Indian yarn brands",
    "best crochet yarn",
    "fine cotton yarn",
    "bulky yarn",
    "merino wool yarn",
    "baby wool yarn",
    "macrame yarn",
  ],
  applicationName: "Crochet n' Bliss",
  authors: [{ name: "Crochet n' Bliss" }],
  creator: "Crochet n' Bliss",
  publisher: "Crochet n' Bliss",
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Crochet n' Bliss | Handmade Crochet, Yarn & Craft Supplies",
    description:
      "Discover handcrafted crochet gifts, yarns, cotton, acrylic, wool, and premium brands like Ganga and Vardhaman.",
    url: "https://www.crochetnbliss.com",
    siteName: "Crochet n' Bliss",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/assets/images/1.png",
        width: 1200,
        height: 630,
        alt: "Crochet n' Bliss collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crochet n' Bliss",
    description:
      "Premium handmade crochet, yarns, cotton, acrylic, wool, and craft accessories for creative gifting and décor.",
    images: ["/assets/images/1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#FFF8F2] text-zinc-900">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
