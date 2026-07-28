import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const outputDir = join(fileURLToPath(root), "public", "content");

async function loadExport(relativePath, exportName) {
  const source = await readFile(new URL(relativePath, root), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
  return module[exportName];
}

await mkdir(outputDir, { recursive: true });
const foods = await loadExport("src/content/foodData.ts", "foods");
const articles = await loadExport("src/content/learnData.ts", "learnArticles");
const manifest = JSON.parse(await readFile(new URL("src/content/contentManifest.json", root), "utf8"));

for (const [name, value] of Object.entries({
  "manifest.json": manifest,
  [String(manifest.foods).replace(/^\.\//, "")]: foods,
  [String(manifest.articles).replace(/^\.\//, "")]: articles
})) {
  const path = join(outputDir, name);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

console.log(`Content v${manifest.contentVersion}: ${foods.length} foods, ${articles.length} articles`);
