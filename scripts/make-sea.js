// Ik heb het pakket "angablue" gebruikt, omdat dit het beste pakket dat ik heb gevonden
// om een Node.js-toepassing om te zetten naar een uitvoerbaar .exe-bestand.
// de documentatie is in deze link : 
// https://github.com/AngaBlue/exe

import fs from "fs";
import exe from "@angablue/exe";

if (fs.existsSync("./dist/wur-scraper.exe")) {
    fs.unlinkSync("./dist/wur-scraper.exe");
}

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
