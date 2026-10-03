export type ProductColor = {
  name: string;
  hex: string;
  image: string;
  price: number;
  originalPrice?: number;
  salePercent?: number | null;
  stock: number;
  sku: string;
};

export type Product = {
  id: number | string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  salePercent?: number | null;
  rating: number;
  reviews: number;
  image: string;
  secondaryImage: string;
  description: string;
  badge?: string;
  colors: ProductColor[];
};

export const categories = [
  {
    name: "Flowers",
    description: "Blooming bouquets crafted in soft yarn.",
    image: "/assets/images/1.png",
  },
  {
    name: "Bouquets",
    description: "Statement floral bundles for gifting.",
    image: "/assets/images/2.png",
  },
  {
    name: "Keychains",
    description: "Mini keepsakes with polished detailing.",
    image: "/assets/images/3.png",
  },
  {
    name: "Home Décor",
    description: "Cozy accents to warm up your space.",
    image: "/assets/images/banner-4.png",
  },
  {
    name: "Plushies",
    description: "Cuddly companions in premium textures.",
    image: "/assets/images/5.png",
  },
  {
    name: "Baby Collection",
    description: "Soft heirlooms designed for little hands.",
    image: "/assets/images/herobanner.png",
  },
];

export const featuredProducts: Product[] = [
  {
    id: 1,
    name: "Rose Garden Bouquet",
    category: "Bouquets",
    price: 72,
    rating: 4.9,
    reviews: 128,
    image: "/assets/images/1.png",
    secondaryImage: "/assets/images/2.png",
    description: "A luxurious bouquet made with layered rose blossoms and soft petal textures.",
    badge: "Bestseller",
    colors: [
      { name: "Blush", hex: "#F7C6D0", image: "/assets/images/1.png", price: 72, stock: 8, sku: "RGB-01" },
      { name: "Cream", hex: "#FFF8F2", image: "/assets/images/2.png", price: 78, stock: 5, sku: "RGB-02" },
      { name: "Sage", hex: "#B7C8A4", image: "/assets/images/3.png", price: 80, stock: 4, sku: "RGB-03" },
    ],
  },
  {
    id: 2,
    name: "Daisy Keychain Trio",
    category: "Keychains",
    price: 24,
    rating: 4.8,
    reviews: 77,
    image: "/assets/images/3.png",
    secondaryImage: "/assets/images/5.png",
    description: "A charming trio of mini daisy motifs with polished finishing details.",
    colors: [
      { name: "Pink", hex: "#F7C6D0", image: "/assets/images/3.png", price: 24, stock: 12, sku: "DKT-01" },
      { name: "Lavender", hex: "#D8C5E0", image: "/assets/images/5.png", price: 26, stock: 9, sku: "DKT-02" },
    ],
  },
  {
    id: 3,
    name: "Cloud Plushie",
    category: "Plushies",
    price: 46,
    rating: 5.0,
    reviews: 92,
    image: "/assets/images/5.png",
    secondaryImage: "/assets/images/banner-4.png",
    description: "A cloud-soft plushie with gentle contours and a cuddly silhouette.",
    colors: [
      { name: "Cream", hex: "#FFF8F2", image: "/assets/images/5.png", price: 46, stock: 7, sku: "CP-01" },
      { name: "Dusty Rose", hex: "#E8B5C2", image: "/assets/images/banner-4.png", price: 48, stock: 6, sku: "CP-02" },
    ],
  },
  {
    id: 4,
    name: "Blooming Wall Hanging",
    category: "Home Décor",
    price: 58,
    rating: 4.7,
    reviews: 63,
    image: "/assets/images/banner-4.png",
    secondaryImage: "/assets/images/herobanner.png",
    description: "A textured hanging piece that adds warmth and artisanal charm to any space.",
    colors: [
      { name: "Ivory", hex: "#F4ECE3", image: "/assets/images/banner-4.png", price: 58, stock: 5, sku: "BWH-01" },
      { name: "Sage", hex: "#B7C8A4", image: "/assets/images/herobanner.png", price: 60, stock: 4, sku: "BWH-02" },
    ],
  },
];

export const allProducts: Product[] = [
  ...featuredProducts,
  {
    id: 5,
    name: "Baby Bunny Blanket",
    category: "Baby Collection",
    price: 64,
    rating: 4.8,
    reviews: 49,
    image: "/assets/images/herobanner.png",
    secondaryImage: "/assets/images/1.png",
    description: "A soft wrap designed for snuggles, gifting, and nursery charm.",
    colors: [
      { name: "Pink", hex: "#F7C6D0", image: "/assets/images/herobanner.png", price: 64, stock: 4, sku: "BBB-01" },
      { name: "Blue", hex: "#A7C7E7", image: "/assets/images/1.png", price: 66, stock: 3, sku: "BBB-02" },
    ],
  },
  {
    id: 6,
    name: "Winter Berry Wreath",
    category: "Seasonal Collection",
    price: 88,
    rating: 4.9,
    reviews: 34,
    image: "/assets/images/2.png",
    secondaryImage: "/assets/images/3.png",
    description: "A festive wreath that captures winter tones and handcrafted warmth.",
    colors: [
      { name: "Red", hex: "#D96A6A", image: "/assets/images/2.png", price: 88, stock: 5, sku: "WBW-01" },
      { name: "Green", hex: "#6B8F5A", image: "/assets/images/3.png", price: 89, stock: 4, sku: "WBW-02" },
    ],
  },
];
