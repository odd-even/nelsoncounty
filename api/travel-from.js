const PROJECT_ID = process.env.SANITY_PROJECT_ID || "ccbigluo";
const DATASET = process.env.SANITY_DATASET || "production";
const API_VERSION = process.env.SANITY_API_VERSION || "2024-10-01";
const MAX_LABEL = 80;

const ORIGIN_LABELS = {
  charlottesville: "Charlottesville",
  richmond: "Richmond",
  "dc-nova": "Washington, D.C. / Northern Virginia",
  lynchburg: "Lynchburg",
  roanoke: "Roanoke",
  "elsewhere-va": "Elsewhere in Virginia",
  md: "Maryland",
  wv: "West Virginia",
  nc: "North Carolina",
  pa: "Pennsylvania",
  tn: "Tennessee",
  ky: "Kentucky",
  custom: "Custom",
  dismissed: "Prefer not to say",
};

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function cleanString(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body);
  } catch (err) {
    return {};
  }
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "Sanity write token not configured" });
  }

  const body = parseBody(req);
  const origin = cleanString(body.origin, 64).toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!origin) {
    return res.status(400).json({ error: "Missing origin" });
  }

  const customLabel = origin === "custom" ? cleanString(body.custom || body.customLabel, MAX_LABEL) : "";
  const label =
    cleanString(body.label, MAX_LABEL) ||
    customLabel ||
    ORIGIN_LABELS[origin] ||
    origin;

  const submittedAt = new Date().toISOString();
  const pageUrl = cleanString(body.pageUrl, 500);
  const referrer = cleanString(body.referrer, 500);
  const userAgent = cleanString(req.headers["user-agent"], 300);

  const doc = {
    _type: "travelFromResponse",
    origin,
    label,
    submittedAt,
  };
  if (customLabel) doc.customLabel = customLabel;
  if (pageUrl && /^https?:\/\//i.test(pageUrl)) doc.pageUrl = pageUrl;
  if (referrer) doc.referrer = referrer;
  if (userAgent) doc.userAgent = userAgent;

  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;
  let sanityRes;
  try {
    sanityRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mutations: [{ create: doc }],
      }),
    });
  } catch (err) {
    return res.status(502).json({ error: "Failed to reach Sanity" });
  }

  if (!sanityRes.ok) {
    let detail = "";
    try {
      detail = await sanityRes.text();
    } catch (err) {}
    return res.status(502).json({
      error: "Sanity write failed",
      status: sanityRes.status,
      detail: detail.slice(0, 400),
    });
  }

  return res.status(201).json({ ok: true });
};
