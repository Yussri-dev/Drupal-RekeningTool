import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const exePath = path.join(distDir, "wur-scraper.exe");
const indexPath = path.join(__dirname, "../index.js");

fs.mkdirSync(distDir, { recursive: true });

console.log("Creating standalone .exe using pkg...");
try {
    execSync(`npx pkg "${indexPath}" -o "${exePath}" -t node18-win --compress Brotli --build`, {
        stdio: "inherit",
        cwd: path.join(__dirname, "..")
    });
    console.log("Executable created Successfully!");
} catch (error) {
    console.error("Error creating executable:", error.message);
    process.exit(1);
}

const stats = fs.statSync(exePath);
console.log("\nExecutable created:");
console.log("File:", exePath);
console.log("Size:", (stats.size / 1024 / 1024).toFixed(2), "MB");

console.log("\nTesting...");
const { spawnSync } = await import("child_process");
const result = spawnSync(exePath, [], {
    encoding: "utf-8",
    timeout: 30000,
    stdio: ["pipe", "pipe", "pipe"]
});

if (result.stdout) {
    console.log("Test successful!");
    console.log(result.stdout);
}

if (result.error) {
    console.error("Test failed:", result.error);
}

console.log("\nReady to use:");
console.log(`   ${exePath}`);