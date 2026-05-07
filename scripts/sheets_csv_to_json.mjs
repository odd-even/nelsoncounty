#!/usr/bin/env node
// Fetch the published Google Sheet CSV and write it to data/listings.json
// as an array of row objects keyed by header name. This shape matches what
// frontpage_framer.html's parseCSV() produces in the browser, so the rest of
// the listings pipeline (mapCSVRowToListing -> filter private -> extract
// filter options) runs unchanged.
//
// Zero dependencies. Designed to run inside a GitHub Action with Node >= 18
// (which has a built-in global fetch).

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SHEET_CSV_URL =
  process.env.SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjIYDylHAm_j9b4rwGOjfPe0aoPRA1rcqsZ8NZg8ugT97pkM83n87NrDVhx7NU63-whpia-hRscywD/pub?gid=0&single=true&output=csv";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), "..");
const OUTPUT_PATH = resolve(repoRoot, "data", "listings.json");

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseCSV(csvText) {
  const rows = [];
  let currentRow = "";
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentRow += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentRow += char;
      }
    } else if (char === "\n" || char === "\r") {
      if (inQuotes) {
        currentRow += char;
      } else {
        if (char === "\r" && nextChar === "\n") i++;
        if (currentRow.trim()) rows.push(currentRow.trim());
        currentRow = "";
      }
    } else {
      currentRow += char;
    }
  }
  if (currentRow.trim()) rows.push(currentRow.trim());

  const filteredRows = rows.filter((row) => row.trim());
  if (filteredRows.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(filteredRows[0])
    .map((h) => h.trim())
    .filter((h) => h);

  const dataRows = [];
  for (let i = 1; i < filteredRows.length; i++) {
    const values = parseCSVLine(filteredRows[i]);
    if (values.length === 0) continue;
    const titleField = values[0] ? values[0].trim() : "";
    if (!titleField) continue;
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || "").trim();
    });
    dataRows.push(row);
  }
  return { headers, rows: dataRows };
}

async function fetchCsvWithRetry(url, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const cacheBust = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
      const res = await fetch(cacheBust, {
        redirect: "follow",
        headers: { "User-Agent": "nelsoncounty-sheet-exporter/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      const wait = 1000 * i;
      console.warn(`Attempt ${i} failed: ${err.message}. Retrying in ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function main() {
  console.log("Fetching CSV:", SHEET_CSV_URL);
  const csvText = await fetchCsvWithRetry(SHEET_CSV_URL);
  console.log("CSV bytes:", csvText.length);

  const { headers, rows } = parseCSV(csvText);
  console.log("Headers:", headers.length, "Rows:", rows.length);
  if (rows.length === 0) {
    throw new Error("Refusing to write empty listings.json (no data rows parsed).");
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: SHEET_CSV_URL,
    headers,
    rows,
  };
  const next = JSON.stringify(payload, null, 2) + "\n";

  let prev = null;
  try {
    prev = await readFile(OUTPUT_PATH, "utf8");
  } catch (_) {
    // file does not exist yet, that's fine
  }

  // Compare ignoring the generatedAt timestamp so we don't churn the git
  // history when the data hasn't actually changed.
  const stripTs = (s) => (s ? s.replace(/"generatedAt":\s*"[^"]*",?\s*\n?/, "") : s);
  if (prev && stripTs(prev) === stripTs(next)) {
    console.log("No content changes detected; leaving existing file in place.");
    return;
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, next, "utf8");
  console.log("Wrote", OUTPUT_PATH, "(" + rows.length + " rows)");
}

main().catch((err) => {
  console.error("Exporter failed:", err);
  process.exit(1);
});
