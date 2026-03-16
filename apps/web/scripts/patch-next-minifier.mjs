import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "next",
  "dist",
  "build",
  "webpack",
  "plugins",
  "minify-webpack-plugin",
  "src",
  "index.js",
);

if (!fs.existsSync(pluginPath)) {
  console.log("[patch-next-minifier] Skipping, plugin not found.");
  process.exit(0);
}

const source = fs.readFileSync(pluginPath, "utf8");

if (source.includes("return new Error(`${file} from Minifier")) {
  console.log("[patch-next-minifier] Patch already applied.");
  process.exit(0);
}

const patched = source.replaceAll("new _webpack.WebpackError(", "new Error(");

if (patched === source) {
  console.log("[patch-next-minifier] No changes needed.");
  process.exit(0);
}

fs.writeFileSync(pluginPath, patched, "utf8");
console.log("[patch-next-minifier] Applied patch to Next minifier.");
