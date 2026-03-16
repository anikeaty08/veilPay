const path = require("node:path");
const { spawnSync } = require("node:child_process");

const args = process.argv.slice(2);
const env = {
  ...process.env,
  APPDATA: path.resolve(__dirname, "../.hardhat-appdata"),
  LOCALAPPDATA: path.resolve(__dirname, "../.hardhat-localappdata"),
};

const hardhatBin = path.resolve(
  __dirname,
  process.platform === "win32"
    ? "../node_modules/.bin/hardhat.cmd"
    : "../node_modules/.bin/hardhat",
);

const result = spawnSync(
  process.platform === "win32" ? "cmd" : hardhatBin,
  process.platform === "win32" ? ["/c", hardhatBin, ...args] : args,
  {
    cwd: path.resolve(__dirname, ".."),
    env,
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
