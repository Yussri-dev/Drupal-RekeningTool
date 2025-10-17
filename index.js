import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

//Dummy Data to test if the json file updates Keys
// const url = "http://127.0.0.1:5500/Wur_Test_For_Scrap.html";
const url = "https://www.wur.nl/nl/onderzoek-resultaten/onderzoeksinstituten/livestock-research/producten/voederwaardeprijzen-rundvee.htm";
const outputPath = "wur_data_clean.json";

async function scrapeWUR() {
    try {
        const { data: html } = await axios.get(url);
        const $ = cheerio.load(html);
        const table = $("table").first();

        let oldData = {};
        if (fs.existsSync(outputPath)) {
            try {
                oldData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
            } catch {
                console.warn("error reading the file. New data Created.");
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
                if (val && /^[0-9]+,[0-9]+$/.test(val)) val = parseFloat(val.replace(",", "."));
                else if (val && /^[0-9]+$/.test(val)) val = parseFloat(val);

                if (val !== null && result[key][date] !== val) {
                    result[key][date] = val;
                }
            });
        });

        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log("Data Updated :", outputPath);
    } catch (err) {
        console.error("Error:", err.message);
    }
}

scrapeWUR();
