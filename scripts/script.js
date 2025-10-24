// Gebruikt Xlsx em Excel te leren
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

// variabel
let wurData = null;
let cvbData = [];
let categories = [];

async function loadWUR() {
    // fetching data van json bestand - belangrijk
    const res = await fetch("./wur_data_clean.json");
    wurData = await res.json();

    // Ik heb deze methode gebruikt om de datums chronologisch te sorteren.
    const dates = Object.keys(wurData["kVEM2022"])
        .sort((a, b) => {
            const [da, ma, ya] = a.split(/[-/]/).map(Number);
            const [db, mb, yb] = b.split(/[-/]/).map(Number);
            return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        });

    const select = document.getElementById("dateSelect");

    const recentDates = dates.slice(-3).reverse();
    // Verschillende typen voor select
    const extra =
        [
            "3-Maandsgemiddelde",
            "Jaargemiddelde (12 maanden)",
            "3-jaarsgemiddelde"
        ];
    const displayDates = [...recentDates, ...extra];

    select.innerHTML = displayDates
        .map(d => `<option value="${d}">${d}</option>`)
        .join("");

    const lastDate = recentDates.at(0);
    select.value = lastDate;

    select.addEventListener("change", updateAllCalculations);

    showWUR(lastDate);
}

function last12MonthsAverage(obj) {
    const vals = Object.values(obj)
        .map(Number)
        .filter(v => !isNaN(v))
        .slice(-12);

    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
}

function last3MonthsAverage(obj) {
    const vals = Object.values(obj)
        .map(Number)
        .filter(v => !isNaN(v))
        .slice(-3); 

    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
}

function threeYearAverage(obj) {
    const vals = Object.values(obj)
        .map(Number)
        .filter(v => !isNaN(v))
        .slice(-39);

    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : NaN;
}

// BACKUP: Oude methode voor het berekenen van het 3-jaarsgemiddelde
// Deze functie groepeerde per kalenderjaar en berekende het gemiddelde van de jaargemiddelden
// Vervangen door een eenvoudigere methode (39 meest recente publicaties)

/*
function threeYearAverage(obj) {
    const entries = Object.entries(obj)
        .map(([key, val]) => {
            const [day, month, year] = key.split(/[-/]/).map(Number);
            if (!year || isNaN(val)) return null;
            return { year, value: Number(val) };
        })
        .filter(Boolean);

    if (entries.length === 0) return NaN;

    const grouped = {};
    for (const { year, value } of entries) {
        if (!grouped[year]) grouped[year] = [];
        grouped[year].push(value);
    }

    const yearAverages = Object.entries(grouped).map(([year, values]) => ({
        year: Number(year),
        avg: values.reduce((a, b) => a + b, 0) / values.length
    }));

    const last3 = yearAverages
        .sort((a, b) => a.year - b.year)
        .slice(-3);

    const totalAvg = last3.reduce((sum, y) => sum + y.avg, 0) / last3.length;

    return totalAvg;
}
*/
function showWUR(date) {
    let kvem, dveMelk, kvevi, dveVlees;

    if (date === "Jaargemiddelde (12 maanden)") {
        kvem = last12MonthsAverage(wurData["kVEM2022"]);
        dveMelk = last12MonthsAverage(wurData["kg DVE-toeslag"]);
        kvevi = last12MonthsAverage(wurData["kVEVI"]);
        dveVlees = last12MonthsAverage(wurData["kg DVE-toeslag_2"]);
    }
    else if (date === "3-Maandsgemiddelde") {
        kvem = last3MonthsAverage(wurData["kVEM2022"]);
        dveMelk = last3MonthsAverage(wurData["kg DVE-toeslag"]);
        kvevi = last3MonthsAverage(wurData["kVEVI"]);
        dveVlees = last3MonthsAverage(wurData["kg DVE-toeslag_2"]);
    }
    else if (date === "3-jaarsgemiddelde") {
        kvem = threeYearAverage(wurData["kVEM2022"]);
        dveMelk = threeYearAverage(wurData["kg DVE-toeslag"]);
        kvevi = threeYearAverage(wurData["kVEVI"]);
        dveVlees = threeYearAverage(wurData["kg DVE-toeslag_2"]);
    }
    else {
        kvem = wurData["kVEM2022"][date];
        dveMelk = wurData["kg DVE-toeslag"][date];
        kvevi = wurData["kVEVI"][date];
        dveVlees = wurData["kg DVE-toeslag_2"][date];
    }

    document.getElementById("kVEMVal").textContent = isNaN(kvem) ? "-" : kvem.toFixed(1).replace(".", ",");
    document.getElementById("DVE_melkVal").textContent = isNaN(dveMelk) ? "-" : dveMelk.toFixed(1).replace(".", ",");
    document.getElementById("kVEVIVal").textContent = isNaN(kvevi) ? "-" : kvevi.toFixed(1).replace(".", ",");
    document.getElementById("DVE_vleesVal").textContent = isNaN(dveVlees) ? "-" : dveVlees.toFixed(1).replace(".", ",");
}

async function loadCVB() {
    const res = await fetch("./CVB-Tabel.xlsx");
    const buf = await res.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    cvbData = XLSX.utils.sheet_to_json(sheet);
    categories = [...new Set(cvbData.map(r => r["Categorie"]).filter(Boolean))];
}

function buildCategorySection(catName) {
    const section = document.createElement("div");
    section.className = "category-section";

    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = catName;

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Product</th>
                <th>Reële prijs (€/ton)</th>
                <th>VWP Melk</th>
                <th>VWP Vlees</th>
                <th>DS</th>
                <th>DVE</th>
                <th>VEM</th>
                <th>VEVI</th>
                <th>Prijs/VWP Melk (%)</th>
                <th>Prijs/VWP Vlees (%)</th>
                <th></th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");
    const btnAdd = document.createElement("button");
    btnAdd.textContent = "(+) Voeg een product toe";
    btnAdd.className = "add-btn";
    btnAdd.onclick = () => addProductRow(catName, tbody);

    section.append(header, table, btnAdd);
    document.getElementById("categoriesContainer").appendChild(section);
}

function addProductRow(category, tbody) {
    const row = document.createElement("tr");
    const products = cvbData.filter(r => r["Categorie"] === category);

    const prodSelect = document.createElement("select");
    prodSelect.innerHTML = products.map(p => `<option>${p["Naam"]}</option>`).join("");
    const prodCell = document.createElement("td");
    prodCell.setAttribute("data-label", "Product");
    prodCell.appendChild(prodSelect);

    const priceCell = document.createElement("td");
    priceCell.setAttribute("data-label", "Reële prijs (€/ton)");
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.step = "1";
    priceInput.placeholder = "€";
    priceCell.appendChild(priceInput);

    const ds = document.createElement("td");
    ds.setAttribute("data-label", "DS");
    const dve = document.createElement("td");
    dve.setAttribute("data-label", "DVE");
    const vem = document.createElement("td");
    vem.setAttribute("data-label", "VEM");
    const vevi = document.createElement("td");
    vevi.setAttribute("data-label", "VEVI");
    const melk = document.createElement("td");
    melk.setAttribute("data-label", "VWP Melk");
    melk.classList.add("vwp-column");

    const vlees = document.createElement("td");
    vlees.setAttribute("data-label", "VWP Vlees");
    vlees.classList.add("vwp-column");
    const pmelk = document.createElement("td");
    pmelk.setAttribute("data-label", "Prijs/VWP Melk (%)");
    const pvlees = document.createElement("td");
    pvlees.setAttribute("data-label", "Prijs/VWP Vlees (%)");

    const delCell = document.createElement("td");
    delCell.setAttribute("data-label", "Verwijder");
    const delBtn = document.createElement("button");
    delBtn.className = "delete-btn";
    delBtn.innerHTML = "X";
    delBtn.title = "Verwijder deze regel";
    delBtn.addEventListener("click", () => {
        if (confirm("Weet je zeker dat je deze regel wilt verwijderen?")) {
            row.remove();
        }
    });
    delCell.appendChild(delBtn);

    function updateProductDetails(name) {
        const p = cvbData.find(r => r["Naam"] === name && r["Categorie"] === category);
        if (!p) return;

        ds.textContent = Math.round(+p["DS"] || 0);
        dve.textContent = Math.round(+p["DVE"] || 0);
        vem.textContent = Math.round(+p["VEM_bas"] || 0);
        vevi.textContent = Math.round(+p["VEVI_bas"] || 0);

        calc();
    }

    function calc() {
        const date = document.getElementById("dateSelect").value;

        let kVEM, kVEVI, DVE_melk, DVE_vlees;

        if (date === "Jaargemiddelde (12 maanden)") {
            kVEM = last12MonthsAverage(wurData["kVEM2022"]);
            DVE_melk = last12MonthsAverage(wurData["kg DVE-toeslag"]);
            kVEVI = last12MonthsAverage(wurData["kVEVI"]);
            DVE_vlees = last12MonthsAverage(wurData["kg DVE-toeslag_2"]);
        }
        else if (date === "3-Maandsgemiddelde") {
            kVEM = last3MonthsAverage(wurData["kVEM2022"]);
            DVE_melk = last3MonthsAverage(wurData["kg DVE-toeslag"]);
            kVEVI = last3MonthsAverage(wurData["kVEVI"]);
            DVE_vlees = last3MonthsAverage(wurData["kg DVE-toeslag_2"]);
        }
        else if (date === "3-jaarsgemiddelde") {
            kVEM = threeYearAverage(wurData["kVEM2022"]);
            DVE_melk = threeYearAverage(wurData["kg DVE-toeslag"]);
            kVEVI = threeYearAverage(wurData["kVEVI"]);
            DVE_vlees = threeYearAverage(wurData["kg DVE-toeslag_2"]);
        }
        else {
            kVEM = +wurData["kVEM2022"][date];
            kVEVI = +wurData["kVEVI"][date];
            DVE_melk = +wurData["kg DVE-toeslag"][date];
            DVE_vlees = +wurData["kg DVE-toeslag_2"][date];
        }

        const DS = parseFloat(ds.textContent);
        const DVE = parseFloat(dve.textContent);
        const VEM = parseFloat(vem.textContent);
        const VEVI = parseFloat(vevi.textContent);

        if (!DS || !DVE || !VEM || !VEVI || !kVEM || !kVEVI) {
            melk.innerHTML = vlees.innerHTML = "NaN";
            pmelk.textContent = pvlees.textContent = "";
            return;
        }

        const kwpMelk = Math.round(((VEM * kVEM) + (DVE * DVE_melk)) * DS / 1000 / 100);
        const kwpVlees = Math.round(((VEVI * kVEVI) + (DVE * DVE_vlees)) * DS / 1000 / 100);

        melk.innerHTML = `<b>${kwpMelk}</b>`;
        vlees.innerHTML = `<b>${kwpVlees}</b>`;

        const price = parseFloat(priceInput.value);
        if (price > 0) {
            const percMelk = Math.round((price / kwpMelk) * 100);
            const percVlees = Math.round((price / kwpVlees) * 100);
            pmelk.innerHTML = `<span class="${percMelk < 100 ? "green" : "red"}">${percMelk}</span>`;
            pvlees.innerHTML = `<span class="${percVlees < 100 ? "green" : "red"}">${percVlees}</span>`;
        } else {
            pmelk.textContent = "";
            pvlees.textContent = "";
        }
    }

    prodSelect.addEventListener("change", e => updateProductDetails(e.target.value));
    priceInput.addEventListener("input", calc);

    row.append(prodCell, priceCell, melk, vlees, ds, dve, vem, vevi, pmelk, pvlees, delCell);
    tbody.appendChild(row);

    updateProductDetails(products[0]["Naam"]);
    row.calc = calc;
}

function updateAllCalculations() {
    showWUR(document.getElementById("dateSelect").value);
    document.querySelectorAll("tbody tr").forEach(r => r.calc && r.calc());
}

await loadWUR();
await loadCVB();
categories.forEach(buildCategorySection);