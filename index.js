// @angablue-exe esm
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let __filename, __dirname;
try {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
} catch {
    __dirname = process.cwd();
}

const url =
    "https://www.wur.nl/nl/onderzoek-resultaten/onderzoeksinstituten/livestock-research/producten/voederwaardeprijzen-rundvee.htm";

const outputPath = path.join(__dirname, "wur_data_clean.json");

async function scrapeData() {
    try {
        console.log("Fetching data from WUR...");
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);
        const table = $("table").first();

        let oldData = {};
        if (fs.existsSync(outputPath)) {
            try {
                oldData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
                console.log("Loaded existing data");
            } catch {
                console.warn("Error reading the file. New data created.");
            }
        }

        const headers = table
            .find("thead tr th")
            .map((i, el) => $(el).text().trim())
            .get()
            .filter(Boolean);

        const result = { ...oldData };
        const seen = {};

        table.find("tbody tr").each((i, row) => {
            const cells = $(row)
                .find("th, td")
                .map((j, cell) => $(cell).text().trim())
                .get();

            if (cells.length === 0) return;

            let key = cells[0];
            if (seen[key]) {
                seen[key]++;
                key = `${key}_${seen[key]}`;
            } else {
                seen[key] = 1;
            }

            const values = cells.slice(1);
            if (!result[key]) result[key] = {};

            headers.slice(1).forEach((date, idx) => {
                let val = values[idx];
                if (val === undefined) return;

                if (val && /^[0-9]+,[0-9]+$/.test(val))
                    val = parseFloat(val.replace(",", "."));
                else if (val && /^[0-9]+$/.test(val))
                    val = parseFloat(val);

                const normalizedDate = normalizeData(date);

                if (val !== null && result[key][normalizedDate] !== val) {
                    result[key][normalizedDate] = val;
                }
            });

        });

        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log("Data Updated:", outputPath);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

// when scrapping data i get some issues when data added to json the problem is sometime in wur reference they add data like 
// 8-04-2025 or 08-4-2025 or 8-4-2025
// so i added this function to normalize the date
function normalizeData(dateStr) {
    const dates = dateStr.split("-");
    if (dates.length != 3) return dateStr;

    const [day, month, year] = dates.map((p) => p.trim());
    const d = day.padStart(2, "0");
    const m = month.padStart(2, "0");
    return `${d}-${m}-${year}`
}
scrapeData();

// keep the process open briefly to show logs if double-clicked
setTimeout(() => { }, 10000);
