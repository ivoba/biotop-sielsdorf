import { getImage } from "astro:assets";
import {
  CollectionEntry,
  defineCollection,
  getCollection,
  reference,
  z,
  ImageFunction
} from "astro:content";

const blog = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.date(),
      observations: z
         .array(
          getObservationSchema(image)
        ) 
        .optional(),
      heroImage: image().optional(),
    }),
});

const getObservationSchema = (image: ImageFunction) =>
    z.object({
      name: z.string(),
      latin: z.string(),
      img: image(),
      body: z.string(),
    });

export const collections = { blog };
export type Observation = z.infer<ReturnType<typeof getObservationSchema>>

type UrlMap = Partial<{
  [key in keyof typeof collections]: string;
}>;

const urls: UrlMap = {
  blog: "/logbuch/",
};

export const getUrl = (collName: keyof typeof urls, slug: string) =>
  urls[collName] + slug;

export const getSortedBlogPosts = async () => {
  return (await getCollection("blog")).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );
};
