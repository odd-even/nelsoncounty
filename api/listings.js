// Live public listings feed for frontpage_framer.html.
// Reads the published Google Sheet CSV on each cache miss so the directory
// does not wait on the GitHub Actions export (that schedule runs hours late).

const SHEET_CSV_URL =
  process.env.SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTjIYDylHAm_j9b4rwGOjfPe0aoPRA1rcqsZ8NZg8ugT97pkM83n87NrDVhx7NU63-whpia-hRscywD/pub?gid=0&single=true&output=csv";

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

function isPrivateRow(row) {
  const raw = row.private ?? row.Private ?? "";
  const value = String(raw).trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=30, s-maxage=60, stale-while-revalidate=120");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cacheBust = SHEET_CSV_URL + (SHEET_CSV_URL.includes("?") ? "&" : "?") + "t=" + Math.floor(Date.now() / 60000);
  const sheetRes = await fetch(cacheBust, {
    redirect: "follow",
    headers: { "User-Agent": "nelsoncounty-listings-api/1.0" },
  });
  if (!sheetRes.ok) {
    return res.status(502).json({ error: "Sheet fetch failed", status: sheetRes.status });
  }

  const csvText = await sheetRes.text();
  const { headers, rows: allRows } = parseCSV(csvText);
  const rows = allRows.filter((row) => !isPrivateRow(row));
  if (rows.length === 0) {
    return res.status(502).json({ error: "Sheet returned no public rows" });
  }

  return res.status(200).json({
    generatedAt: new Date().toISOString(),
    source: "google-sheet",
    headers,
    rows,
  });
};
