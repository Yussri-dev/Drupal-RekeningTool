// scripts/make-sea.js
import exe from "@angablue/exe";

await exe({
    entry: "./dist/bundle.cjs",  // the working CommonJS file
    out: "./dist/wur-scraper.exe",
    console: true,
    skipBundle: true,            // don't re-bundle
    version: "1.0.0",
    properties: {
        ProductName: "WUR Scraper",
        FileDescription: "WUR Data Scraper"
    }
});
