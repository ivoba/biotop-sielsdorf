import { defineConfig } from 'astro/config';
import image from '@astrojs/image';

// https://astro.build/config
export default defineConfig({
	integrations: [image()],
	site: `https://ivoba.github.io`,
	base: `/`,
	legacy: {
		astroFlavoredMarkdown: true
	},
	vite: {
		server: {
			watch: {
				ignored: ['/.idea/workspace.xml']
			}
		}
	}
});
