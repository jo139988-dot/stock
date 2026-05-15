import { spawnSync } from "node:child_process";

if (process.platform === "win32") {
  console.log("Skipping OpenNext postbuild on Windows. Cloudflare's Linux build will generate .open-next.");
  process.exit(0);
}

console.log("Generating OpenNext output for Cloudflare Workers deploy...");

const result = spawnSync(
  "npx",
  ["opennextjs-cloudflare", "build", "--skipNextBuild"],
  {
    stdio: "inherit"
  }
);

process.exit(result.status ?? 1);
