/**
 * Smart Vyapar Programmatic Dynamic Sitemap Configuration
 * Official Origin: https://smartvyapar.app
 */

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export default function sitemap(): SitemapEntry[] {
  const baseUrl = 'https://smartvyapar.app';
  const routes = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/features', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/about', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/contact', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/privacy-policy', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/billing-software', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/inventory-management', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/invoice-generator', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/business-analytics', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/dashboard', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/create-invoice', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/invoices', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/payment-status', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/inventory', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/ai-replenishment', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/purchase-orders', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/analytics', changeFrequency: 'weekly' as const, priority: 0.6 },
    { path: '/financial-center', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/help-desk', changeFrequency: 'weekly' as const, priority: 0.5 },
    { path: '/notifications', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/profile', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/settings', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/admin', changeFrequency: 'monthly' as const, priority: 0.4 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
