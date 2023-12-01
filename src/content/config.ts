import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	schema: ({image}) => z.object({
		title: z.string(),
		description: z.string(),
		publishDate: z.date(),
		observations: z.array(
			z.object({
			title: z.string(),
			img: image(),
			body: z.string(),
			})
		).optional(),
		heroImage: image().optional(),
	}),
});

export const collections = { blog };

type UrlMap = Partial<{
  [key in keyof typeof collections]: string;
}>;

const urls: UrlMap = {
  blog: "/logbuch/",
};

export const getUrl = (collName: keyof typeof urls, slug: string) =>
  urls[collName] + slug;