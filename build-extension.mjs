import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const MANIFEST = "manifest.json";

const browser = process.argv[2];

if (!browser) {
  console.error("Usage: node build-extensions.js <browser>");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const manifestPath = path.join(__dirname, MANIFEST);
const browserManifestPath = path.join(__dirname, `manifest-${browser}.json`);

const distPath = path.join(__dirname, "dist", browser);
fs.removeSync(distPath);
fs.ensureDirSync(distPath);

fs.copySync(path.join(__dirname, "icons"), distPath + "/icons");
fs.copySync(path.join(__dirname, "popup"), distPath + "/popup");
fs.copySync(path.join(__dirname, "styles.css"), distPath + "/styles.css");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const browserManifest = JSON.parse(
  fs.readFileSync(browserManifestPath, "utf8")
);

const mergedManifest = { ...manifest, ...browserManifest };

const manifestDistPath = path.join(distPath, "manifest.json");
fs.writeFileSync(
  manifestDistPath,
  JSON.stringify(mergedManifest, null, 2),
  "utf8"
);

console.log(`${browser[0].toUpperCase() + browser.slice(1)} extension built in ${distPath}`);
