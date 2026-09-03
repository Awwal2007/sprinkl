import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
  title = 'Sprinkl — Automated Cash & Crypto Giveaways in Nigeria',
  description = "Sprinkl is Nigeria's #1 automated dual-currency giveaway platform. Pay winners directly to bank accounts (NGN) or crypto wallets (USDT). Zero double-claims.",
  canonical = 'https://www.sprinkl.biz/',
  keywords = 'giveaway platform Nigeria, Nigerian giveaway website, automated giveaway platform, cash giveaway Nigeria, crypto giveaway platform, NGN giveaway, USDT giveaway Nigeria',
  ogImage = 'https://www.sprinkl.biz/og-sprinkl.png',
  ogType = 'website',
}) {
  const fullCanonical = canonical.startsWith('http') ? canonical : `https://www.sprinkl.biz${canonical}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Sprinkl" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
