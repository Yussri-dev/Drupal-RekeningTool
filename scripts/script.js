// Gebruikt Xlsx em Excel te leren
import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

// variabel
let wurData = null;
let cvbData = [];
let categories = [];

function orderDates(dates) {
    return dates.sort((a, b) => {
        const [da, ma, ya] = a.split(/[-/]/).map(Number);
        const [db, mb, yb] = b.split(/[-/]/).map(Number);
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });
}

function getDateObject(date) {
    const [d, m, y] = date.split(/[-/]/);
    return new Date(`${y}-${m}-${d}`);
}

async function loadWUR() {
    // fetching data van json bestand - belangrijk
    const res = await fetch("./wur_data_clean.json");
    wurData = await res.json();

    // Ik heb deze methode gebruikt om de datums chronologisch te sorteren.
    const dates = orderDates(Object.keys(wurData["kVEM2022"]))

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

function getAverage(obj, getEndDate) {
    const dates = orderDates(Object.keys(obj));
    if (!dates.length)
        return NaN;

    const start_date = getDateObject(dates.at(-1));
    const startmonth = start_date.getMonth();
    const startyear = start_date.getFullYear();

    const endDate = getEndDate(startmonth, startyear);

    const needed_dates = dates
        .map(date => {
            return { "value": obj[date], "date": getDateObject(date) };
        })
        .filter(ele => ele["date"] >= endDate && !isNaN(ele["value"]))
        .map(ele => ele["value"]);

    return needed_dates.reduce((a, b) => a + b, 0) / needed_dates.length;
}

function last12MonthsAverage(obj) {

    return getAverage(obj, (startmonth, startyear) => {
        const endMonth = startmonth + 1 % 12; // altijd één maand voor de start
        const endYear = startmonth == 11 ? startyear : startyear - 1; // Eind jaar is -1 tenzij je begint van December
        return new Date(endYear, endMonth);
    });
}

function last3MonthsAverage(obj) {

    return getAverage(obj, (startmonth, startyear) => {
        const endMonth = startmonth - 2 % 12;
        const endYear = endMonth > startmonth ? startyear - 1 : startyear;
        return new Date(endYear, endMonth);
    });
}

function threeYearAverage(obj) {

    return getAverage(obj, (startmonth, startyear) => {
        const endMonth = startmonth + 1 % 12; // altijd één maand voor de start
        const endYear = startmonth == 11 ? startyear - 2 : startyear - 3; // Eind jaar is -3 tenzij je begint van December
        return new Date(endYear, endMonth);
    });
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
                <th>DS (g/kg)</th>
                <th>DVE (g/kg DS)</th>
                <th>VEM (/kg DS)</th>
                <th>VEVI (/kg DS)</th>
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
    ds.setAttribute("data-label", "DS (g/kg)");
    const dve = document.createElement("td");
    dve.setAttribute("data-label", "DVE (g/kg DS)");
    const vem = document.createElement("td");
    vem.setAttribute("data-label", "VEM (/kg DS)");
    const vevi = document.createElement("td");
    vevi.setAttribute("data-label", "VEVI (/kg DS)");
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

function addEigenProductRow(tbody) {
    const row = document.createElement("tr");

    function makeInputCell(type, placeholder, dataLabel, step = null) {
        const td = document.createElement("td");
        td.setAttribute("data-label", dataLabel);

        const input = document.createElement("input");
        input.type = type;
        input.placeholder = placeholder;

        if (step !== null) {
            input.step = step;
        }

        td.appendChild(input);
        return { td, input };
    }

    const productCellObj = makeInputCell("text", "Naam product", "Product");
    const priceCellObj = makeInputCell("number", "€", "Reële prijs (€/ton)", "1");
    const dsCellObj = makeInputCell("number", "DS", "DS (g/kg)", "1");
    const dveCellObj = makeInputCell("number", "DVE", "DVE (g/kg DS)", "1");
    const vemCellObj = makeInputCell("number", "VEM", "VEM (/kg DS)", "1");
    const veviCellObj = makeInputCell("number", "VEVI", "VEVI (/kg DS)", "1");

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

    function calcEigen() {
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

        const DS = parseFloat(dsCellObj.input.value);
        const DVE = parseFloat(dveCellObj.input.value);
        const VEM = parseFloat(vemCellObj.input.value);
        const VEVI = parseFloat(veviCellObj.input.value);

        const hasMilkInputs = !isNaN(DS) && !isNaN(DVE) && !isNaN(VEM) && !isNaN(kVEM) && !isNaN(DVE_melk);
        const hasMeatInputs = !isNaN(DS) && !isNaN(DVE) && !isNaN(VEVI) && !isNaN(kVEVI) && !isNaN(DVE_vlees);

        let kwpMelk = NaN;
        let kwpVlees = NaN;

        if (hasMilkInputs) {
            kwpMelk = Math.round(((VEM * kVEM) + (DVE * DVE_melk)) * DS / 1000 / 100);
            melk.innerHTML = `<b>${kwpMelk}</b>`;
        } else {
            melk.textContent = "";
        }

        if (hasMeatInputs) {
            kwpVlees = Math.round(((VEVI * kVEVI) + (DVE * DVE_vlees)) * DS / 1000 / 100);
            vlees.innerHTML = `<b>${kwpVlees}</b>`;
        } else {
            vlees.textContent = "";
        }

        const price = parseFloat(priceCellObj.input.value);

        if (!isNaN(price) && price > 0 && !isNaN(kwpMelk) && kwpMelk > 0) {
            const percMelk = Math.round((price / kwpMelk) * 100);
            pmelk.innerHTML = `<span class="${percMelk < 100 ? "green" : "red"}">${percMelk}</span>`;
        } else {
            pmelk.textContent = "";
        }

        if (!isNaN(price) && price > 0 && !isNaN(kwpVlees) && kwpVlees > 0) {
            const percVlees = Math.round((price / kwpVlees) * 100);
            pvlees.innerHTML = `<span class="${percVlees < 100 ? "green" : "red"}">${percVlees}</span>`;
        } else {
            pvlees.textContent = "";
        }
    }

    [
        priceCellObj.input,
        dsCellObj.input,
        dveCellObj.input,
        vemCellObj.input,
        veviCellObj.input
    ].forEach(input => {
        input.addEventListener("input", calcEigen);
    });

    row.append(
        productCellObj.td,
        priceCellObj.td,
        melk,
        vlees,
        dsCellObj.td,
        dveCellObj.td,
        vemCellObj.td,
        veviCellObj.td,
        pmelk,
        pvlees,
        delCell
    );

    row.calc = calcEigen;

    tbody.appendChild(row);
}

function buildEigenVoedermiddelenSection() {
    const section = document.createElement("div");
    section.className = "category-section eigen-section";

    const header = document.createElement("div");
    header.className = "category-header";
    header.textContent = "Eigen voedermiddelen";

    const table = document.createElement("table");
    table.innerHTML = `
        <thead>
            <tr>
                <th>Product</th>
                <th>Reële prijs (€/ton)</th>
                <th>VWP Melk</th>
                <th>VWP Vlees</th>
                <th>DS (g/kg)</th>
                <th>DVE (g/kg DS)</th>
                <th>VEM (/kg DS)</th>
                <th>VEVI (/kg DS)</th>
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
    btnAdd.onclick = () => {
        addEigenProductRow(tbody);
    };

    section.append(header, table, btnAdd);
    document.getElementById("categoriesContainer").appendChild(section);
}

await loadWUR();
await loadCVB();
categories.forEach(buildCategorySection);



buildEigenVoedermiddelenSection();
