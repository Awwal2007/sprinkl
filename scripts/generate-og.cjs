const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Resvg } = require('@resvg/resvg-js');

async function generateOgImage() {
  const logoPath = path.join(__dirname, '..', 'public', 'sprinkl-logo.png');
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  const svg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Gradients -->
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080c14" />
        <stop offset="50%" stop-color="#0e1726" />
        <stop offset="100%" stop-color="#05080f" />
      </linearGradient>

      <!-- Emerald Glow -->
      <radialGradient id="emeraldGlow" cx="20%" cy="20%" r="60%">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
      </radialGradient>

      <!-- Cyan Glow -->
      <radialGradient id="cyanGlow" cx="85%" cy="80%" r="60%">
        <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.22" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
      </radialGradient>

      <!-- Card Gradient -->
      <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" stop-opacity="0.75" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.85" />
      </linearGradient>

      <!-- CTA Gradient -->
      <linearGradient id="ctaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>

      <!-- Text Gradient -->
      <linearGradient id="titleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="60%" stop-color="#f1f5f9" />
        <stop offset="100%" stop-color="#34d399" />
      </linearGradient>

      <!-- Filter for Shadows -->
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
      </filter>
      <filter id="glowShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#10b981" flood-opacity="0.4" />
      </filter>
    </defs>

    <!-- Main Background -->
    <rect width="1200" height="630" fill="url(#bgGradient)" />

    <!-- Ambient Glow Orbs -->
    <rect width="1200" height="630" fill="url(#emeraldGlow)" />
    <rect width="1200" height="630" fill="url(#cyanGlow)" />

    <!-- Subtle Background Grid Pattern -->
    <g opacity="0.07" stroke="#ffffff" stroke-width="1">
      <line x1="120" y1="0" x2="120" y2="630" />
      <line x1="240" y1="0" x2="240" y2="630" />
      <line x1="360" y1="0" x2="360" y2="630" />
      <line x1="480" y1="0" x2="480" y2="630" />
      <line x1="600" y1="0" x2="600" y2="630" />
      <line x1="720" y1="0" x2="720" y2="630" />
      <line x1="840" y1="0" x2="840" y2="630" />
      <line x1="960" y1="0" x2="960" y2="630" />
      <line x1="1080" y1="0" x2="1080" y2="630" />
      <line x1="0" y1="126" x2="1200" y2="126" />
      <line x1="0" y1="252" x2="1200" y2="252" />
      <line x1="0" y1="378" x2="1200" y2="378" />
      <line x1="0" y1="504" x2="1200" y2="504" />
    </g>

    <!-- Content Container -->
    <!-- Brand Header -->
    <g transform="translate(80, 75)">
      <!-- Mini logo / icon -->
      <image href="${logoDataUri}" x="0" y="0" width="52" height="52" filter="url(#glowShadow)" />
      <text x="68" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#ffffff" letter-spacing="-0.5">Sprinkl<tspan fill="#10b981">.biz</tspan></text>

      <!-- Category Pill -->
      <rect x="240" y="8" width="180" height="34" rx="17" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-opacity="0.3" stroke-width="1" />
      <text x="330" y="30" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#34d399" letter-spacing="0.5">#1 GIVEAWAY PLATFORM</text>
    </g>

    <!-- Main Headline with Conversion Copy -->
    <text x="80" y="200" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="url(#titleGradient)" letter-spacing="-1.5">
      Automated Giveaways.
    </text>
    <text x="80" y="260" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#ffffff" letter-spacing="-1.5">
      Instant Winner Payouts.
    </text>

    <!-- Subtitle / Value Prop -->
    <text x="80" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">
      Direct to Nigerian Bank Accounts (NGN), USDT &amp; Mobile VTU Airtime.
    </text>

    <!-- Trust Feature Badges -->
    <g transform="translate(80, 365)">
      <!-- Badge 1: 100% Fraud-Proof -->
      <rect x="0" y="0" width="180" height="42" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="18" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#38bdf8">✓ 100% Fraud-Proof</text>

      <!-- Badge 2: Instant Payouts -->
      <rect x="195" y="0" width="170" height="42" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="213" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#34d399">⚡ Instant Payouts</text>

      <!-- Badge 3: Multi-Currency -->
      <rect x="380" y="0" width="200" height="42" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1.2" />
      <text x="398" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#fbbf24">₦ NGN • ₮ USDT • VTU</text>
    </g>

    <!-- Call to Action (CTA) Button -->
    <g transform="translate(80, 460)">
      <rect x="0" y="0" width="260" height="64" rx="32" fill="url(#ctaGradient)" filter="url(#glowShadow)" />
      <text x="130" y="39" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#ffffff" letter-spacing="0.2">
        Launch Giveaway →
      </text>

      <text x="290" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="600" fill="#64748b">
        Free to create • 60s setup
      </text>
    </g>

    <!-- Right Side Hero Artwork (Card Preview with 3D Logo) -->
    <g transform="translate(760, 95)" filter="url(#shadow)">
      <!-- Outer Card with Glassmorphic Border -->
      <rect x="0" y="0" width="360" height="440" rx="36" fill="url(#cardBg)" stroke="#334155" stroke-width="1.5" />

      <!-- Inner Ambient Glow -->
      <circle cx="180" cy="180" r="140" fill="#10b981" fill-opacity="0.12" />

      <!-- Big 3D Logo -->
      <image href="${logoDataUri}" x="65" y="45" width="230" height="230" filter="url(#glowShadow)" />

      <!-- Card Stats Pill -->
      <rect x="35" y="295" width="290" height="54" rx="16" fill="#0f172a" fill-opacity="0.8" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.2" />
      <text x="60" y="328" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#ffffff">Automated Payouts</text>
      <text x="290" y="328" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#34d399">Active ●</text>

      <!-- URL footer -->
      <text x="180" y="395" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="#94a3b8" letter-spacing="1">
        WWW.SPRINKL.BIZ
      </text>
    </g>
  </svg>
  `;

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render().asPng();

  const outPath = path.join(__dirname, '..', 'public', 'og-sprinkl.png');
  fs.writeFileSync(outPath, pngData);
  console.log(`Successfully generated high-converting og:image at ${outPath} (${pngData.length} bytes)`);
}

generateOgImage().catch(console.error);
