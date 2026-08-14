const fs = require("fs");
const path = require("path");

const svg = fs.readFileSync(
  path.join(__dirname, "../public/brand/heart-paws.svg"),
  "utf8",
);

const paths = [...svg.matchAll(/\sd="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((d) => d.length > 20);

const outDir = path.join(__dirname, "../src/lib");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "heart-paws-paths.json"),
  JSON.stringify(paths, null, 0),
);

console.log(`Extracted ${paths.length} paths`);
