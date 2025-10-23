// scripts/make-sea.js
import exe from "@angablue/exe";

await exe({
    entry: "./dist/bundle.cjs",
    out: "./dist/wur-scraper.exe",
    console: true,
    skipBundle: true,            
    version: "1.0.0",
    properties: {
        ProductName: "WUR Scraper",
        FileDescription: "WUR Data Scraper"
    }
});
