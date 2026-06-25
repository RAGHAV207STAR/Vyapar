/**
 * Smart Vyapar Global SEO Metadata Store
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
  title: 'Smart Vyapar – High-Speed GST Billing, Inventory Management & Invoicing App',
  description: 'Smart Vyapar is the ultimate offline-first GST billing app, real-time stock ledger books tracker, and small business ERP designed for storefronts, retail counters, and wholesale distributors.',
  keywords: [
    'Smart Vyapar',
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
  author: 'Smart Vyapar',
  robots: 'index, follow',
  canonical: 'https://vyaparmitra.app/',
  openGraph: {
    title: 'Smart Vyapar – Billing, Inventory & Business Management Software',
    description: 'Smart Vyapar is a cloud-based billing, invoicing, inventory management and business analytics platform designed for shops, retailers and growing businesses.',
    type: 'website',
    url: 'https://vyaparmitra.app/',
    image: 'https://vyaparmitra.app/og-image.png',
    siteName: 'Smart Vyapar'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Vyapar – Billing, Inventory & Business Management Software',
    description: 'Smart Vyapar is a cloud-based billing, invoicing, inventory management and business analytics platform designed for shops, retailers and growing businesses.',
    image: 'https://vyaparmitra.app/og-image.png'
  }
};

/**
 * Generates dynamic SEO title configuration for subpages
 */
export function generatePageMetadata(pageTitle: string, pageDescription?: string): Partial<MetadataConfig> {
  return {
    title: `${pageTitle} | Smart Vyapar`,
    description: pageDescription || globalMetadata.description,
  };
}
