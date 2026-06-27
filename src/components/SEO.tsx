import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  type?: string;
  keywords?: string;
}

export default function SEO({ title, description, url, type = 'website', keywords }: SEOProps) {
  // Ensure the base URL is correct if a relative path is passed
  const baseUrl = 'https://smartvyapar.vercel.app';
  const fullUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url}`) : baseUrl;

  // JSON-LD Structured Data for SoftwareApplication
  const schemaOrgJSONLD = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Smart Vyapar",
    "alternateName": ["SmartVyapar", "Smart Vyapar Billing App", "Vyapar App", "Billing Software"],
    "url": baseUrl,
    "description": description,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  return (
    <Helmet>
      {/* Standard HTML Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={fullUrl} />
      
      {/* Search Engine Directives */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />

      {/* Brand & Application Name overrides to force Google to use "Smart Vyapar" instead of Vercel */}
      <meta name="application-name" content="Smart Vyapar" />
      <meta name="apple-mobile-web-app-title" content="Smart Vyapar" />
      <meta property="og:site_name" content="Smart Vyapar" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={`${baseUrl}/icon-512x512.png`} />
      <meta property="og:image:alt" content="Smart Vyapar Dashboard" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:image" content={`${baseUrl}/icon-512x512.png`} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJSONLD)}
      </script>
    </Helmet>
  );
}
