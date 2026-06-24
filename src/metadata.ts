/**
 * Vyapar Mitra Global SEO Metadata Store
 * Includes optimized branding configurations, canonical urls, Open Graph metadata, and page definitions.
 */

export interface MetadataConfig {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  robots: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
    url: string;
    image: string;
    siteName: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
}

export const globalMetadata: MetadataConfig = {
  title: 'Vyapar Mitra – High-Speed GST Billing, Inventory Management & Invoicing App',
  description: 'Vyapar Mitra is the ultimate offline-first GST billing app, real-time stock ledger books tracker, and small business ERP designed for storefronts, retail counters, and wholesale distributors.',
  keywords: [
    'Vyapar Mitra',
    'Vyapar billing app',
    'online billing software',
    'retail shop billing app',
    'GST invoice generator',
    'stock tracker',
    'stock management software',
    'inventory books',
    'business accounting software',
    'mobile billing scanner',
    'tax receipt maker',
    'business ledger diary',
    'small business ERP',
    'inventory count sheets',
    'GST bill maker software',
    'best invoice app',
    'offline store manager',
    'online accounting book',
    'free receipt templates',
    'shop manager app',
    'cash ledger register',
    'digital ledger app',
    'purchase book tracker',
    'simple sales book',
    'invoice payment QR',
    'indian business billing',
    'wholesale inventory manager',
    'gst software for shopkeeper',
    'grocery billing system',
    'thermal receipt printing app',
    'ledger entry book',
    'stock ledger calculator',
    'purchase order tracker',
    'tax accounting application',
    'dukan cash book',
    'vyapar digital register',
    'AI inventory replenishment',
    'automatic stock deduction',
    'financial ledger manager',
    'payment status tracker',
    'small store invoicing'
  ],
  author: 'Vyapar Mitra',
  robots: 'index, follow',
  canonical: 'https://vyaparmitra.app/',
  openGraph: {
    title: 'Vyapar Mitra – Billing, Inventory & Business Management Software',
    description: 'Vyapar Mitra is a cloud-based billing, invoicing, inventory management and business analytics platform designed for shops, retailers and growing businesses.',
    type: 'website',
    url: 'https://vyaparmitra.app/',
    image: 'https://vyaparmitra.app/og-image.png',
    siteName: 'Vyapar Mitra'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vyapar Mitra – Billing, Inventory & Business Management Software',
    description: 'Vyapar Mitra is a cloud-based billing, invoicing, inventory management and business analytics platform designed for shops, retailers and growing businesses.',
    image: 'https://vyaparmitra.app/og-image.png'
  }
};

/**
 * Generates dynamic SEO title configuration for subpages
 */
export function generatePageMetadata(pageTitle: string, pageDescription?: string): Partial<MetadataConfig> {
  return {
    title: `${pageTitle} | Vyapar Mitra`,
    description: pageDescription || globalMetadata.description,
  };
}
