import { useEffect } from 'react';

const BASE_URL = 'https://www.sprinkl.biz';

/**
 * useSEO — Dynamic per-page SEO meta tag management
 *
 * Updates <title>, <meta name="description">, <link rel="canonical">,
 * Open Graph (og:*), and Twitter Card (twitter:*) tags on every page mount.
 *
 * Usage:
 *   useSEO({
 *     title: 'Page Title | Sprinkl',
 *     description: 'Page description...',
 *     path: '/signup',
 *   });
 */
export default function useSEO({ title, description, path = '', image, noIndex = false } = {}) {
  useEffect(() => {
    const canonicalUrl = `${BASE_URL}${path}`;
    const ogImage = image || `${BASE_URL}/og-sprinkl.png`;

    // ── Title ──────────────────────────────────────────────────────────────
    if (title) {
      document.title = title;
    }

    // ── Helper: set or create a <meta> tag ────────────────────────────────
    const setMeta = (selector, content) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const attrName = selector.includes('property=') ? 'property' : 'name';
        const attrValue = selector.match(/["']([^"']+)["']/)?.[1];
        if (attrName && attrValue) el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // ── Helper: set or create a <link> tag ───────────────────────────────
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // ── Canonical ─────────────────────────────────────────────────────────
    setLink('canonical', canonicalUrl);

    // ── Robots ────────────────────────────────────────────────────────────
    setMeta('meta[name="robots"]', noIndex
      ? 'noindex, nofollow'
      : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );

    // ── Standard meta ─────────────────────────────────────────────────────
    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[name="title"]', title || document.title);
    }

    // ── Open Graph ────────────────────────────────────────────────────────
    setMeta('meta[property="og:url"]', canonicalUrl);
    setMeta('meta[property="og:site_name"]', 'Sprinkl');
    if (title) setMeta('meta[property="og:title"]', title);
    if (description) setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:image"]', ogImage);

    // ── Twitter / X Card ─────────────────────────────────────────────────
    setMeta('meta[property="twitter:url"]', canonicalUrl);
    if (title) setMeta('meta[property="twitter:title"]', title);
    if (description) setMeta('meta[property="twitter:description"]', description);
    setMeta('meta[property="twitter:image"]', ogImage);
  }, [title, description, path, image, noIndex]);
}
