import type { Creator } from './types/index.js';

export interface PageSeo {
  title: string;
  description: string;
  canonicalPath: string;
  canonicalUrl: string;
  imageUrl: string;
  robots: string;
  schema: Record<string, unknown>;
}

export const publicSeoPaths = Object.keys({
  '/': true,
  '/live': true,
  '/streamers': true,
  '/featured': true,
  '/vods': true,
  '/squad': true,
  '/map': true,
  '/clips': true,
  '/events': true,
  '/about': true,
});

const pageContent: Record<string, { title: string; description: string; schemaType: string }> = {
  '/': {
    title: 'Pioneer RP Live | Official Streamer Hub',
    description: 'Watch Pioneer RP creators live on Twitch, discover featured streamers, and explore the FiveM roleplay community.',
    schemaType: 'WebSite',
  },
  '/live': {
    title: 'Live Pioneer RP Streams | Twitch Creators',
    description: 'See which Pioneer RP creators are live on Twitch now and watch their roleplay stories as they happen.',
    schemaType: 'CollectionPage',
  },
  '/streamers': {
    title: 'Pioneer RP Streamers | Creator Directory',
    description: 'Browse Pioneer RP streamers, find creator profiles, and discover their characters and live channels.',
    schemaType: 'CollectionPage',
  },
  '/featured': {
    title: 'Featured Pioneer RP Creators',
    description: 'Meet the featured streamers sharing stories from the Pioneer RP FiveM community.',
    schemaType: 'CollectionPage',
  },
  '/vods': {
    title: 'Pioneer RP VODs | Past Broadcasts',
    description: 'Catch up on recorded Pioneer RP streams and past roleplay broadcasts from community creators.',
    schemaType: 'CollectionPage',
  },
  '/squad': {
    title: 'Pioneer RP Squad Streams | Watch Together',
    description: 'Watch multiple Pioneer RP Twitch creators together in a shared multi-stream view.',
    schemaType: 'WebPage',
  },
  '/map': {
    title: 'Pioneer RP City Map | Districts and Creators',
    description: 'Explore the Pioneer RP city map, its districts, and the creators bringing the roleplay world to life.',
    schemaType: 'WebPage',
  },
  '/clips': {
    title: 'Pioneer RP Clips | Community Highlights',
    description: 'Watch memorable clips and highlights from Pioneer RP roleplay streamers.',
    schemaType: 'CollectionPage',
  },
  '/events': {
    title: 'Pioneer RP Events and Stream Schedule',
    description: 'Explore upcoming Pioneer RP community events and creator streaming schedules.',
    schemaType: 'CollectionPage',
  },
  '/about': {
    title: 'About Pioneer RP Live | Creator Hub',
    description: 'Learn about Pioneer RP Live, the official hub for Pioneer RP streamers and community broadcasts.',
    schemaType: 'AboutPage',
  },
};

const canonicalAliases: Record<string, string> = {
  '/past-broadcasts': '/vods',
  '/squad-stream': '/squad',
  '/city-map': '/map',
  '/highlights': '/clips',
  '/schedule': '/events',
};

function cleanDescription(value: string, fallback: string): string {
  const plainText = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plainText) return fallback;
  return plainText.length > 160 ? `${plainText.slice(0, 157).trimEnd()}...` : plainText;
}

export function getPageSeo(pathname: string, origin: string, creators: Creator[] = []): PageSeo {
  const requestedPath = pathname.toLowerCase().replace(/\/$/, '') || '/';
  const profileMatch = requestedPath.match(/^\/(?:streamer|streamers)\/([a-z0-9_-]+)$/);
  const isAdmin = requestedPath === '/admin' || requestedPath.startsWith('/admin/');
  const canonicalPath = isAdmin
    ? requestedPath
    : profileMatch
      ? `/streamer/${profileMatch[1]}`
      : canonicalAliases[requestedPath] || (pageContent[requestedPath] ? requestedPath : '/');
  const creator = profileMatch
    ? creators.find(item => item.slug.toLowerCase() === profileMatch[1])
    : undefined;
  const page = pageContent[canonicalPath] || pageContent['/'];
  const title = isAdmin
    ? 'Admin Portal | Pioneer RP Live'
    : creator
      ? `${creator.displayName} | Pioneer RP Live`
      : profileMatch
        ? `${profileMatch[1].replace(/[-_]/g, ' ')} | Pioneer RP Live`
        : page.title;
  const fallbackDescription = creator
    ? `${creator.displayName} is a Pioneer RP creator on Twitch.`
    : profileMatch
      ? 'View this creator profile from the Pioneer RP community.'
      : page.description;
  const profileDetails = creator
    ? [creator.bio, creator.characterName && `In-city character: ${creator.characterName}.`, creator.gangName && `Affiliation: ${creator.gangName}.`]
        .filter(Boolean)
        .join(' ')
    : '';
  const description = isAdmin
    ? 'Sign in to the Pioneer RP administration portal.'
    : cleanDescription(profileDetails, fallbackDescription);
  const canonicalUrl = new URL(canonicalPath, origin).toString();
  const imageUrl = new URL('/pioneer-logo.png', origin).toString();
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': creator || profileMatch ? 'ProfilePage' : page.schemaType,
    name: title,
    description,
    url: canonicalUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Pioneer RP Live',
      url: new URL('/', origin).toString(),
    },
  };

  if (creator) {
    schema.mainEntity = {
      '@type': 'Person',
      name: creator.displayName,
      description,
      image: creator.profileImageUrl || imageUrl,
    };
  }

  return {
    title,
    description,
    canonicalPath,
    canonicalUrl,
    imageUrl,
    robots: isAdmin ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    schema,
  };
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function updateDocumentSeo(pathname: string, origin: string, creators: Creator[] = []) {
  const seo = getPageSeo(pathname, origin, creators);
  document.title = seo.title;
  setMeta('name', 'description', seo.description);
  setMeta('name', 'robots', seo.robots);
  setMeta('property', 'og:title', seo.title);
  setMeta('property', 'og:description', seo.description);
  setMeta('property', 'og:url', seo.canonicalUrl);
  setMeta('property', 'og:image', seo.imageUrl);
  setMeta('property', 'og:site_name', 'Pioneer RP Live');
  setMeta('property', 'og:type', 'website');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', seo.title);
  setMeta('name', 'twitter:description', seo.description);
  setMeta('name', 'twitter:image', seo.imageUrl);

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = seo.canonicalUrl;

  let structuredData = document.querySelector<HTMLScriptElement>('#pioneer-rp-structured-data');
  if (!structuredData) {
    structuredData = document.createElement('script');
    structuredData.id = 'pioneer-rp-structured-data';
    structuredData.type = 'application/ld+json';
    document.head.appendChild(structuredData);
  }
  structuredData.textContent = JSON.stringify(seo.schema);
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, character => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] || character);
}

export function buildRobotsTxt(origin: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    `Sitemap: ${new URL('/sitemap.xml', origin).toString()}`,
    '',
  ].join('\n');
}

export function buildSitemapXml(origin: string, creators: Creator[]): string {
  const paths = [
    ...publicSeoPaths,
    ...creators.filter(creator => creator.enabled).map(creator => `/streamer/${encodeURIComponent(creator.slug)}`),
  ];
  const urls = paths.map(path => `  <url><loc>${escapeXml(new URL(path, origin).toString())}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
  ].join('\n');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] || character);
}

export function renderSeoHead(seo: PageSeo): string {
  const jsonLd = JSON.stringify(seo.schema).replace(/</g, '\\u003c');
  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="robots" content="${escapeHtml(seo.robots)}" />`,
    `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Pioneer RP Live" />',
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(seo.canonicalUrl)}" />`,
    `<meta property="og:image" content="${escapeHtml(seo.imageUrl)}" />`,
    '<meta property="og:image:alt" content="Pioneer RP Live creator hub" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(seo.imageUrl)}" />`,
    `<script type="application/ld+json" id="pioneer-rp-structured-data">${jsonLd}</script>`,
  ].join('\n    ');
}

export function injectSeoHead(template: string, seo: PageSeo): string {
  const replacement = `\n    ${renderSeoHead(seo)}\n    `;
  const markers = /<!-- PIONEERRP_SEO_START -->[\s\S]*?<!-- PIONEERRP_SEO_END -->/;
  if (markers.test(template)) return template.replace(markers, replacement);
  return template.replace('</head>', `    ${renderSeoHead(seo)}\n  </head>`);
}