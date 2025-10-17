import * as XLSX from "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm";

let wurData = null;
let cvbData = [];
let categories = [];

async function loadWUR() {
    const res = await fetch("./wur_data_clean.json");
    wurData = await res.json();

    const dates = Object.keys(wurData["kVEM2022"]);
    const select = document.getElementById("dateSelect");

    select.innerHTML = dates.map(d => `<option>${d}</option>`).join("");

    const lastDate = dates.at(-1);
    select.value = lastDate;

    select.addEventListener("change", updateAllCalculations);

    showWUR(lastDate);
}


function showWUR(date) {
    document.getElementById("kVEMVal").textContent = wurData["kVEM2022"][date];
    document.getElementById("DVE_melkVal").textContent = wurData["kg DVE-toeslag"][date];
    document.getElementById("kVEVIVal").textContent = wurData["kVEVI"][date];
    document.getElementById("DVE_vleesVal").textContent = wurData["kg DVE-toeslag_2"][date];
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
            <th>Prijs €/ton</th>
            <th>DS</th>
            <th>DVE</th>
            <th>VEM</th>
            <th>VEVI</th>
            <th>KWP Melk</th>
            <th>KWP Vlees</th>
            <th>Prijs/KWP Melk (%)</th>
            <th>Prijs/KWP Vlees (%)</th>
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
    prodCell.appendChild(prodSelect);

    const priceCell = document.createElement("td");
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.step = "1";
    priceInput.placeholder = "€";
    priceCell.appendChild(priceInput);

    const ds = document.createElement("td");
    const dve = document.createElement("td");
    const vem = document.createElement("td");
    const vevi = document.createElement("td");
    const melk = document.createElement("td");
    const vlees = document.createElement("td");
    const pmelk = document.createElement("td");
    const pvlees = document.createElement("td");

    const delCell = document.createElement("td");
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
        ds.textContent = (+p["DS"]).toFixed(2);
        dve.textContent = (+p["DVE"]).toFixed(2);
        vem.textContent = (+p["VEM_bas"]).toFixed(2);
        vevi.textContent = (+p["VEVI_bas"]).toFixed(2);
        calc();
    }

    function calc() {
        const date = document.getElementById("dateSelect").value;
        const { kVEM, kVEVI, DVE_melk, DVE_vlees } = {
            kVEM: wurData["kVEM2022"][date],
            kVEVI: wurData["kVEVI"][date],
            DVE_melk: wurData["kg DVE-toeslag"][date],
            DVE_vlees: wurData["kg DVE-toeslag_2"][date]
        };

        const DS = parseFloat(ds.textContent);
        const DVE = parseFloat(dve.textContent);
        const VEM = parseFloat(vem.textContent);
        const VEVI = parseFloat(vevi.textContent);

        if (!DS || !DVE || !VEM || !VEVI) return;

        const kwpMelk = ((VEM * kVEM) + (DVE * DVE_melk)) * DS / 1000 / 100;
        const kwpVlees = ((VEVI * kVEVI) + (DVE * DVE_vlees)) * DS / 1000 / 100;

        melk.textContent = kwpMelk.toFixed(1);
        vlees.textContent = kwpVlees.toFixed(1);

        const price = parseFloat(priceInput.value);
        if (price) {
            const percMelk = (price / kwpMelk) * 100;
            const percVlees = (price / kwpVlees) * 100;
            pmelk.innerHTML = `<span class="${percMelk < 100 ? "green" : "red"}">${percMelk.toFixed(0)}</span>`;
            pvlees.innerHTML = `<span class="${percVlees < 100 ? "green" : "red"}">${percVlees.toFixed(0)}</span>`;
        } else {
            pmelk.textContent = "";
            pvlees.textContent = "";
        }
    }

    prodSelect.addEventListener("change", e => updateProductDetails(e.target.value));
    priceInput.addEventListener("input", calc);

    row.append(prodCell, priceCell, ds, dve, vem, vevi, melk, vlees, pmelk, pvlees, delCell);
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