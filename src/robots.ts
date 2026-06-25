/**
 * Smart Vyapar Programmatic Crawler Robots Configuration
 * Official Origin: https://smartvyapar.vercel.app
 */

export interface RobotsConfig {
  userAgent: string;
  allow: string | string[];
  disallow: string | string[];
  sitemap: string;
}

export default function robots(): RobotsConfig {
  return {
    userAgent: '*',
    allow: '/',
    disallow: [
      '/api/',
      '/private/',
      '/admin/',
    ],
    sitemap: 'https://smartvyapar.vercel.app/sitemap.xml',
  };
}
