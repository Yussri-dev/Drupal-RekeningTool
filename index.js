(async () => {
    const axios = await import("axios");
    const cheerio = await import("cheerio");
    const fs = await import("fs");

    const axiosDefault = axios.default;
    const cheerioModule = cheerio.default || cheerio;
    const fsModule = fs.default || fs;

    const url = "https://www.wur.nl/nl/onderzoek-resultaten/onderzoeksinstituten/livestock-research/producten/voederwaardeprijzen-rundvee.htm";
    const outputPath = "wur_data_clean.json";

    try {
        console.log("Fetching data from WUR...");
        const { data: html } = await axiosDefault.get(url);
        const $ = cheerioModule.load(html);
        const table = $("table").first();

        let oldData = {};
        if (fsModule.existsSync(outputPath)) {
            try {
                oldData = JSON.parse(fsModule.readFileSync(outputPath, "utf8"));
                console.log("Loaded existing data");
            } catch {
                console.warn("Error reading the file. New data Created.");
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

        fsModule.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log("Data Updated:", outputPath);

        // Exit only if running as a CLI tool (batch file or direct node execution)
        if (process.argv[1] && process.argv[1].includes("bundle")) {
            process.exit(0);
        }
    } catch (err) {
        console.error("Error:", err.message);

        // Exit only if running as a CLI tool
        if (process.argv[1] && process.argv[1].includes("bundle")) {
            process.exit(1);
        }
    }
})();