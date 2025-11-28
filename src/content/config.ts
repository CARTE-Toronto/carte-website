import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const people = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/people" }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    department: z.string().optional(),
    image: z.string().optional(),
    order: z.number().default(99),
  }),
});

const research = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/research" }),
  schema: z.object({
    title: z.string(),
    authors: z.string(),
    venue: z.string(),
    year: z.number(),
    description: z.string(),
    featured: z.boolean().default(false),
    // For featured papers (large cards with visuals)
    gradient: z.string().optional(),
    pattern: z.enum(["buildings", "houses", "digital"]).optional(),
    // For secondary papers (smaller cards with icons)
    icon: z.enum(["database", "health", "air", "code", "chart", "globe", "houses", "people"]).optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(99),
  }),
});

const training = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/training" }),
  schema: z.object({
    title: z.string(),
    audience: z.string(),
    duration: z.string().optional(),
    year: z.number().optional(),
    description: z.string(),
    featured: z.boolean().default(false),
    // For featured trainings (large cards with visuals)
    gradient: z.string().optional(),
    pattern: z.enum(["classroom", "network", "corporate", "lab"]).optional(),
    // For secondary trainings (smaller cards with icons)
    icon: z.enum(["academic", "flask", "briefcase", "users", "globe", "calendar"]).optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(99),
    // Optional testimonial
    testimonial: z.object({
      quote: z.string(),
      attribution: z.string(),
    }).optional(),
  }),
});

const partnerships = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/partnerships" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false),
    // For featured services (large cards with visuals)
    gradient: z.string().optional(),
    pattern: z.enum(["research", "training", "consulting", "network"]).optional(),
    // For secondary services (smaller cards with icons)
    icon: z.enum(["beaker", "academic", "briefcase", "users", "mic", "trophy"]).optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(99),
    // Optional link to another page
    link: z.string().optional(),
  }),
});

export const collections = {
  people,
  research,
  training,
  partnerships,
};
