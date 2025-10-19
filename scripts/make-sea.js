import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const bundlePath = path.join(distDir, "bundle.cjs");
const exePath = path.join(distDir, "wur-scraper.exe");

fs.mkdirSync(distDir, { recursive: true });

console.log("Building bundle js...");
execSync(
    `esbuild index.js --bundle --platform=node --target=node22 --minify --outfile="${bundlePath}" --format=cjs`,
    { stdio: "inherit" }
);
console.log("Bundle created Successfully");

const nodeBinary = execSync("where node").toString().trim().split("\n")[0];
console.log("Node binary:", nodeBinary);

console.log("Creating executable wrapper...");
fs.copyFileSync(nodeBinary, exePath);
console.log("Executable wrapper created Succefully");

const shimPath = path.join(distDir, "wur-scraper-shim.js");
fs.writeFileSync(
    shimPath,
    `require('${bundlePath.replace(/\\/g, "\\\\")}');\n`
);

const batchPath = path.join(distDir, "wur-scraper.bat");
fs.writeFileSync(
    batchPath,
    `@echo off\nnode "${bundlePath}" %*\nexit /b %errorlevel%\n`
);
console.log("Batch file created Successfully");

const stats = fs.statSync(exePath);
console.log("\n Executables created:");
console.log("Batch file (recommended):", batchPath);
console.log("   → Run: wur-scraper.bat");
console.log("Node wrapper:", exePath);
console.log("------- Run: node wur-scraper.exe");
console.log("Size:", (stats.size / 1024 / 1024).toFixed(2), "MB");

console.log("\nTesting...");
const { spawnSync } = await import("child_process");
const result = spawnSync("node", [bundlePath], {
    encoding: "utf-8",
    timeout: 30000,
    stdio: ["pipe", "pipe", "pipe"]
});

if (result.stdout) {
    console.log("Test done successful!");
    console.log(result.stdout);
}

console.log("\nReady to use:");
console.log(`   ${batchPath.split("\\").pop()}`);