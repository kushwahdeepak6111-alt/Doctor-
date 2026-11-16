import { useEffect } from 'react';
import { useClinic } from '../context/ClinicContext';
import { buildRouteSeoMeta } from '../lib/seo';

function upsertMeta(selectorAttr: 'name' | 'property', key: string, content: string | null) {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[${selectorAttr}="${key}"]`);
  if (!content) {
    if (existing) existing.remove();
    return;
  }
  if (existing) {
    existing.setAttribute('content', content);
  } else {
    const el = document.createElement('meta');
    el.setAttribute(selectorAttr, key);
    el.setAttribute('content', content);
    document.head.appendChild(el);
  }
}

function upsertLink(rel: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function SeoHead() {
  const { route, language, settings, doctors, specializations, reviewSummary } = useClinic();

  useEffect(() => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://arogyaclinic.in';

    const meta = buildRouteSeoMeta({
      route,
      origin,
      language,
      settings,
      doctors,
      specializations,
      reviewSummary,
    });

    document.title = meta.title;
    upsertMeta('name', 'description', meta.description);
    upsertMeta('name', 'keywords', meta.keywords);
    upsertMeta('name', 'robots', meta.robots);
    upsertMeta('name', 'google-site-verification', meta.googleVerificationCode || null);
    upsertMeta('name', 'msvalidate.01', meta.bingVerificationCode || null);

    upsertLink('canonical', meta.canonicalUrl);

    upsertMeta('property', 'og:type', meta.ogType);
    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:site_name', meta.siteName);
    upsertMeta('property', 'og:url', meta.canonicalUrl);
    upsertMeta('property', 'og:image', meta.ogImage);
    upsertMeta('property', 'og:locale', meta.ogLocale);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', meta.ogImage);

    // Replace static/dynamic JSON-LD cleanly with route-aware Schema.org graph
    const staticScripts = Array.from(
      document.head.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
    );
    for (const s of staticScripts) {
      if (s.id !== 'arogya-seo-jsonld') {
        s.remove();
      }
    }

    let jsonLdScript = document.head.querySelector<HTMLScriptElement>('#arogya-seo-jsonld');
    if (meta.jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'arogya-seo-jsonld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(meta.jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }
  }, [route, language, settings, doctors, specializations, reviewSummary]);

  return null;
}
