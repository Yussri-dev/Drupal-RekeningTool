// @angablue-exe esm
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
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

        let oldData = {};
        if (fs.existsSync(outputPath)) {
            try {
                oldData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
                console.log("Loaded existing data");
            } catch {
                console.warn("Error reading existing JSON. Starting new file.");
            }
        }

        if (!oldData["kVEM2022"]) oldData["kVEM2022"] = {};
        if (!oldData["kg DVE-toeslag"]) oldData["kg DVE-toeslag"] = {};
        if (!oldData["kVEVI"]) oldData["kVEVI"] = {};
        if (!oldData["kg DVE-toeslag_2"]) oldData["kg DVE-toeslag_2"] = {};

        const result = { ...oldData };

        $('section[data-name="tables"]').each((sectionIdx, section) => {
            const $section = $(section);
            const $table = $section.find("table._195ygb41");

            if ($table.length === 0) return;

            const headers = $table
                .find("thead tr th")
                .map((i, th) => $(th).text().trim())
                .get()
                .filter(Boolean);

            if (headers.length === 0) return;

            $table.find("tbody tr").each((rowIdx, row) => {
                const $row = $(row);

                const cells = $row
                    .find("td")
                    .map((i, cell) => $(cell).find("p").text().trim())
                    .get();

                if (cells.length < 3) return;

                const rawDate = cells[0];
                const normalizedDate = normalizeDate(rawDate);

                // MELKVEE TABLE
                if (headers.includes("kVEM2022")) {
                    const kVEM = parseFloat(cells[1].replace(",", "."));
                    const dveMelk = parseFloat(cells[2].replace(",", "."));

                    if (!isNaN(kVEM)) {
                        result["kVEM2022"][normalizedDate] = kVEM;
                        console.log(`Added kVEM2022 → ${normalizedDate} = ${kVEM}`);
                    }

                    if (!isNaN(dveMelk)) {
                        result["kg DVE-toeslag"][normalizedDate] = dveMelk;
                        console.log(`Added kg DVE-toeslag → ${normalizedDate} = ${dveMelk}`);
                    }
                }

                // VLEESVEE TABLE
                if (headers.includes("kVEVI")) {
                    const kVEVI = parseFloat(cells[1].replace(",", "."));
                    const dveVlees = parseFloat(cells[2].replace(",", "."));

                    if (!isNaN(kVEVI)) {
                        result["kVEVI"][normalizedDate] = kVEVI;
                        console.log(`Added kVEVI → ${normalizedDate} = ${kVEVI}`);
                    }

                    if (!isNaN(dveVlees)) {
                        result["kg DVE-toeslag_2"][normalizedDate] = dveVlees;
                        console.log(`Added kg DVE-toeslag_2 → ${normalizedDate} = ${dveVlees}`);
                    }
                }
            });
        });

        result["kVEM2022"] = sortObjectByDate(result["kVEM2022"]);
        result["kg DVE-toeslag"] = sortObjectByDate(result["kg DVE-toeslag"]);
        result["kVEVI"] = sortObjectByDate(result["kVEVI"]);
        result["kg DVE-toeslag_2"] = sortObjectByDate(result["kg DVE-toeslag_2"]);

        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log("\n✓ Data successfully updated (sorted chronologically):", outputPath);
        process.exit(0);

    } catch (err) {
        console.error("Scraping failed:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

//ALWAYS RETURNS DD-MM-YYYY
function normalizeDate(str) {
    const months = {
        januari: "01", februari: "02", maart: "03", april: "04",
        mei: "05", juni: "06", juli: "07", augustus: "08",
        september: "09", oktober: "10", november: "11", december: "12"
    };

    // format: "9 september 2025"
    const long = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (long) {
        let [, d, m, y] = long;
        d = d.padStart(2, "0");
        const month = months[m.toLowerCase()];
        return `${d}-${month}-${y}`;
    }

    // format: "08/04/2025" or "8-4-2025"
    const short = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (short) {
        let [, d, m, y] = short;
        return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
    }

    return str; 
}

function sortObjectByDate(obj) {
    return Object.fromEntries(
        Object.entries(obj).sort((a, b) => {
            const [da, ma, ya] = a[0].split("-").map(Number);
            const [db, mb, yb] = b[0].split("-").map(Number);
            return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        })
    );
}

scrapeData();

setTimeout(() => {}, 10000);
