import type { APIRoute } from 'astro';
import { toolsCatalog } from '../data/tools';

const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'weekly', lastmod: '2026-10-02' },
  { path: '/about', priority: '0.6', changefreq: 'monthly', lastmod: '2026-09-29' },
  { path: '/contact', priority: '0.5', changefreq: 'monthly', lastmod: '2026-09-29' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'monthly', lastmod: '2026-09-29' },
  { path: '/terms', priority: '0.3', changefreq: 'monthly', lastmod: '2026-09-29' },
];

export const GET: APIRoute = async () => {
  const baseUrl = 'https://chemistrycal.com';

  const xmlUrls = [
    ...staticPages.map(p => `
  <url>
    <loc>${baseUrl}${p.path}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...toolsCatalog.map(tool => `
  <url>
    <loc>${baseUrl}${tool.path}</loc>
    <lastmod>${tool.lastmod}</lastmod>
    <changefreq>${tool.changefreq}</changefreq>
    <priority>${tool.priority}</priority>
  </url>`)
  ].join('');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};