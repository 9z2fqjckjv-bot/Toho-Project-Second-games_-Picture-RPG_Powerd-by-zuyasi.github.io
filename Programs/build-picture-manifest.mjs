#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const preferredDirs = ["Pictures", "Picture"];

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
  throw new Error("Pictures または Picture フォルダが見つかりません。");
};

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";

const run = async () => {
  const source = await findSourceDir();
  const entries = await fs.readdir(source.fullPath, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());

  const images = [];
  const usedIds = new Set();
  for (const file of files) {
    const ext = path.extname(file.name).toLowerCase();
    if (!imageExt.has(ext)) {
      continue;
    }
    const full = path.join(source.fullPath, file.name);
    const stats = await fs.stat(full);
    const baseId = `${slug(file.name)}-${ext.slice(1)}`;
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
      path: `../${source.name}/${file.name}`,
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
