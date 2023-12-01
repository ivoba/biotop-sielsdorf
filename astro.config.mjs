import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  site: `https://sielsdorf.bund-huerth.de`,
  base: `/`,
  vite: {
    server: {
      watch: {
        ignored: ["**/.idea/**"],
      },
    },
  },
});
