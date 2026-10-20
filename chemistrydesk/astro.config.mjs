import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://chemistrycal.com',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
});