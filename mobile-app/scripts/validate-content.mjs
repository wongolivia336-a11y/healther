import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const contentDir = fileURLToPath(new URL("../public/content/", import.meta.url));
const manifest = JSON.parse(await readFile(join(contentDir, "manifest.json"), "utf8"));
const foods = JSON.parse(await readFile(join(contentDir, manifest.foods), "utf8"));
const articles = JSON.parse(await readFile(join(contentDir, manifest.articles), "utf8"));

const unique = values => new Set(values).size === values.length;
if (manifest.schemaVersion !== 1 || !Number.isInteger(manifest.contentVersion)) throw new Error("Invalid manifest");
if (!Array.isArray(foods) || foods.length < 1 || !foods.every(item => item.id && item.name && item.rating)) throw new Error("Invalid foods");
if (!Array.isArray(articles) || articles.length < 1 || !articles.every(item => item.id && item.title && item.source?.url && item.source?.reviewedAt)) throw new Error("Invalid articles");
if (!unique(foods.map(item => item.id)) || !unique(articles.map(item => item.id))) throw new Error("Duplicate content id");
if (articles.some(item => !["A", "B", "C"].includes(item.source.level))) throw new Error("Invalid confidence level");

console.log(`Validated content v${manifest.contentVersion}: ${foods.length} foods, ${articles.length} articles`);
