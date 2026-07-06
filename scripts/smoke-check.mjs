import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "manifest.json",
  "src/background/service-worker.js",
  "src/content/content.js",
  "src/print/print.html",
  "src/print/print.css",
  "src/print/print.js",
  "src/popup/popup.html",
  "src/popup/popup.css",
  "src/popup/popup.js"
];

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `Missing ${file}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
assert(manifest.manifest_version === 3, "Manifest must use MV3");
assert(manifest.permissions.includes("debugger"), "Manifest must request debugger permission");
assert(manifest.permissions.includes("downloads"), "Manifest must request downloads permission");
assert(manifest.host_permissions.includes("https://codeforces.com/*"), "Missing Codeforces host permission");
assert(manifest.content_scripts[0].matches.includes("https://codeforces.com/*"), "Missing Codeforces content script match");

const content = fs.readFileSync(path.join(root, "src/content/content.js"), "utf8");
for (const pattern of [
  "/^\\/contest\\/(\\d+)\\/problems$/",
  "/^\\/gym\\/(\\d+)\\/problems$/",
  "/^\\/group\\/([^/]+)\\/contest\\/(\\d+)\\/problems$/",
  "document.querySelectorAll(\".problem-statement\")",
  "CF_CAPTURE_START_EXPORT_FROM_PAGE"
]) {
  assert(content.includes(pattern), `Content script missing ${pattern}`);
}

const background = fs.readFileSync(path.join(root, "src/background/service-worker.js"), "utf8");
for (const token of [
  "Page.printToPDF",
  "chrome.debugger, \"attach\"",
  "chrome.downloads, \"download\"",
  "CF_CAPTURE_PRINT_READY"
]) {
  assert(background.includes(token), `Background missing ${token}`);
}

const printCss = fs.readFileSync(path.join(root, "src/print/print.css"), "utf8");
for (const token of ["@page", "break-before: page", "break-inside: avoid"]) {
  assert(printCss.includes(token), `Print CSS missing ${token}`);
}

console.log("Smoke check passed");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
