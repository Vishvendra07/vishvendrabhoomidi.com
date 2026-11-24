import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const common = {
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  description: z.string().min(1),
  draft: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
};
export const articleSchema = z.object({ ...common, publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), updatedAt: z.string().optional(), featured: z.boolean().default(false) }).refine(v => v.draft || !!v.publishedAt, "Published articles require publishedAt");
export const projectSchema = z.object({ ...common, role: z.string(), status: z.string(), technologies: z.array(z.string()), visibility: z.enum(["public", "private"]).default("public"), category:z.string().default("Engineering"), subtitle:z.string().default("Systems, thoughtfully connected."), context:z.string().default("Engineering project"), period:z.string().optional(), repository:z.string().url().optional(), order:z.number().default(99), family:z.string().optional(), art:z.string().optional(), proof:z.string().optional(), evidence:z.string().url().optional(), featured:z.boolean().default(false), collection:z.string().optional() });
export const noteSchema = z.object({ ...common, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export type Article = z.infer<typeof articleSchema> & { body: string; readingTime: number };
export type Project = z.infer<typeof projectSchema> & { body: string };
export type Note = z.infer<typeof noteSchema> & { body: string };

function read(kind: string) {
  const dir = path.join(process.cwd(), "src", "content", kind);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".mdx")).map(file => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));
    return { data, body: content };
  });
}
function unique<T extends { slug: string }>(entries: T[]) {
  if (new Set(entries.map(e => e.slug)).size !== entries.length) throw new Error("Duplicate content slug");
  return entries;
}
export function getArticles(includeDrafts = false): Article[] {
  return unique(read("articles").map(({ data, body }) => ({ ...articleSchema.parse(data), body, readingTime: Math.max(1, Math.ceil(body.split(/\s+/).length / 220)) })))
    .filter(a => includeDrafts || !a.draft).sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}
export function getProjects(): Project[] {
  return unique(read("projects").map(({ data, body }) => ({ ...projectSchema.parse(data), body }))).filter(p => !p.draft && p.visibility === "public").sort((a,b)=>a.order-b.order);
}
export function getNotes(): Note[] {
  return unique(read("notes").map(({ data, body }) => ({ ...noteSchema.parse(data), body }))).filter(p => !p.draft).sort((a,b) => b.date.localeCompare(a.date));
}
export function headingId(text: string) { return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-"); }
export function headings(body: string) {
  return [...body.matchAll(/^## (.+)$/gm)].map(m => ({ title: m[1], id: headingId(m[1]) }));
}
export function xmlEscape(value: string) { return value.replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!); }
