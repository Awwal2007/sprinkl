import React from 'react';
import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://www.sprinkl.biz';

export default function SEO({
  title = 'Sprinkl — Automated Cash & Crypto Giveaways in Nigeria',
  description = "Sprinkl is Nigeria's #1 automated dual-currency giveaway platform. Pay winners directly to bank accounts (NGN) or crypto wallets (USDT). Zero double-claims.",
  canonical = '/',
  keywords = 'giveaway platform Nigeria, Nigerian giveaway website, automated giveaway platform, cash giveaway Nigeria, crypto giveaway platform, NGN giveaway, USDT giveaway Nigeria',
  ogImage = 'https://www.sprinkl.biz/og-sprinkl.png',
  ogType = 'website',
  noIndex = false,
  breadcrumbs = null,
  schema = null,
}) {
  const fullCanonical = canonical.startsWith('http')
    ? canonical
    : `${BASE_URL}${canonical.startsWith('/') ? canonical : `/${canonical}`}`;

  return (
    <Helmet>
      {/* Primary Page Identity */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />

      {/* Crawler Directives */}
      <meta
        name="robots"
        content={
          noIndex
            ? 'noindex, nofollow'
            : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
        }
      />

      {/* Google-Compliant Favicon Tags (Absolute URLs, multiples of 48px) */}
      <link rel="icon" href={`${BASE_URL}/favicon.ico`} sizes="48x48" />
      <link rel="icon" type="image/png" sizes="48x48" href={`${BASE_URL}/favicon-48x48.png`} />
      <link rel="icon" type="image/png" sizes="96x96" href={`${BASE_URL}/favicon-96x96.png`} />
      <link rel="icon" type="image/png" sizes="144x144" href={`${BASE_URL}/favicon-144x144.png`} />
      <link rel="icon" type="image/png" sizes="192x192" href={`${BASE_URL}/favicon-192x192.png`} />
      <link rel="icon" type="image/png" sizes="512x512" href={`${BASE_URL}/favicon-512x512.png`} />
      <link rel="icon" type="image/svg+xml" href={`${BASE_URL}/favicon.svg`} />
      <link rel="apple-touch-icon" sizes="180x180" href={`${BASE_URL}/apple-touch-icon.png`} />
      <link rel="shortcut icon" href={`${BASE_URL}/favicon.ico`} />

      {/* Open Graph / Social */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Sprinkl" />
      <meta property="og:locale" content="en_NG" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@sprinklbiz" />

      {/* Google BreadcrumbList JSON-LD Schema */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            '@id': `${fullCanonical}#breadcrumb`,
            itemListElement: breadcrumbs.map((b, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: b.name,
              item: b.path.startsWith('http')
                ? b.path
                : `${BASE_URL}${b.path.startsWith('/') ? b.path : `/${b.path}`}`,
            })),
          })}
        </script>
      )}

      {/* Page-Specific JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
