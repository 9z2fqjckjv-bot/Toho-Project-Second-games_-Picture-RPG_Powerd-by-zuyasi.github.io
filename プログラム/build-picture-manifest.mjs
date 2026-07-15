#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const preferredDirs = ["写真"];

const imageExt = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"]);

const findSourceDir = async () => {
  for (const dirName of preferredDirs) {
    const candidate = path.join(repoRoot, dirName);
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return { name: dirName, fullPath: candidate };
      }
    } catch {
      // skip missing directory
    }
  }
  throw new Error("写真 フォルダが見つかりません。");
};

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";

const collectImageFiles = async (dir, relativeDir = "") => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relativePath = relativeDir
      ? `${relativeDir}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      const nested = await collectImageFiles(fullPath, relativePath);
      results.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!imageExt.has(ext)) {
      continue;
    }

    results.push({ fullPath, relativePath, name: entry.name, ext });
  }

  return results;
};

const run = async () => {
  const source = await findSourceDir();
  const files = await collectImageFiles(source.fullPath);

  const images = [];
  const usedIds = new Set();
  for (const file of files) {
    const stats = await fs.stat(file.fullPath);
    const baseId = `${slug(file.relativePath)}-${file.ext.slice(1)}`;
    let id = baseId;
    let n = 2;
    while (usedIds.has(id)) {
      id = `${baseId}-${n}`;
      n += 1;
    }
    usedIds.add(id);

    images.push({
      id,
      name: file.name,
      path: `../${source.name}/${file.relativePath}`,
      sizeBytes: stats.size,
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDirectory: source.name,
    images,
  };

  const outPath = path.join(__dirname, "picture-manifest.json");
  await fs.writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`Updated: ${outPath}\n`);
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
