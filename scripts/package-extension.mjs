import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = manifest.version;
const distDir = path.join(root, "dist");
const zipName = `cf-pdf-exporter-v${version}.zip`;
const zipPath = path.join(distDir, zipName);
const includes = [
  "manifest.json",
  "README.md",
  "PRIVACY.md",
  "SECURITY.md",
  "assets",
  "src"
];

if (packageJson.version !== version) {
  throw new Error(`package.json version ${packageJson.version} does not match manifest version ${version}`);
}

for (const iconSize of [16, 32, 48, 128]) {
  const iconPath = path.join(root, "assets", "icons", `icon-${iconSize}.png`);
  if (!fs.existsSync(iconPath)) {
    throw new Error(`Missing ${path.relative(root, iconPath)}. Run npm run build:icons first.`);
  }
}

for (const entry of includes) {
  if (!fs.existsSync(path.join(root, entry))) {
    throw new Error(`Missing package entry ${entry}`);
  }
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const result = spawnSync("zip", ["-qr", zipPath, ...includes], {
  cwd: root,
  stdio: "inherit"
});

if (result.status !== 0) {
  throw new Error("zip command failed");
}

console.log(`Wrote ${path.relative(root, zipPath)}`);
