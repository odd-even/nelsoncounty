const PROJECT_ID = process.env.SANITY_PROJECT_ID || "ccbigluo";
const DATASET = process.env.SANITY_DATASET || "production";
const API_VERSION = process.env.SANITY_API_VERSION || "2024-10-01";

const QUERY = `*[_id == "campaign"][0]{
  ...,
  heroSlides[]{_key,label,imageUrl,image{asset->{url}}},
  stays[]{_key,key,name,copy,offerNote,badge,imageUrl,image{asset->{url}},gallery[]{_key,alt,imageUrl,image{asset->{url}}},cta},
  partners[]{_key,key,name,role,badge,copy,offerNote,category,showInStrip,imageUrl,image{asset->{url}},gallery[]{_key,alt,imageUrl,image{asset->{url}}},cta,secondaryCta},
  introCards[]{_key,name,label,copy,href,alt,imageUrl,image{asset->{url}}},
  partnerChips[]{_key,name,label,href,alt,imageUrl,image{asset->{url}}},
  highlights[]{_key,name,label,copy,href,alt,imageUrl,image{asset->{url}}},
  passportSteps[]{_key,title,copy}
}`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN;
  if (!token) return res.status(503).json({ error: "Sanity token not configured" });

  const url =
    "https://" +
    PROJECT_ID +
    ".api.sanity.io/v" +
    API_VERSION +
    "/data/query/" +
    DATASET +
    "?query=" +
    encodeURIComponent(QUERY);

  const upstream = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
  });
  if (!upstream.ok) return res.status(502).json({ error: "Sanity query failed" });

  const json = await upstream.json();
  return res.status(200).json({ result: json.result || null });
};
