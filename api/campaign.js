const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'ccbigluo'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = process.env.SANITY_API_VERSION || '2024-10-01'
const PREVIEW_COOKIE = '__sanity_preview'

const IMAGE = `image{asset->{_id,url,metadata{dimensions}},hotspot,crop}`

const QUERY = `*[_id == "campaign"][0]{
  ...,
  heroSlides[]{_key,label,imageUrl,${IMAGE}},
  stays[]{_key,key,name,copy,offerNote,badge,imageUrl,${IMAGE},gallery[]{_key,alt,imageUrl,${IMAGE}},cta},
  partners[]{_key,key,name,role,badge,discount,copy,offerNote,category,showInStrip,imageUrl,${IMAGE},gallery[]{_key,alt,imageUrl,${IMAGE}},cta,secondaryCta},
  introCards[]{_key,name,label,copy,href,alt,imageUrl,${IMAGE}},
  partnerChips[]{_key,name,label,href,alt,imageUrl,${IMAGE}},
  highlights[]{_key,name,label,copy,href,alt,imageUrl,${IMAGE}},
  itineraryStays[]{_key,key,title,bookHref,bookLabel,discount,offerNote,partner,imageUrl,${IMAGE}},
  itinerarySips[]{_key,key,title,visitHref,visitLabel,discount,offerNote,partner,imageUrl,${IMAGE}}
}`

function hasPreviewCookie(req) {
  const raw = req.headers.cookie || ''
  return raw.split(';').some(function (part) {
    return part.trim().indexOf(PREVIEW_COOKIE + '=1') === 0
  })
}

function wantsPreview(req) {
  if (hasPreviewCookie(req)) return true
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
    const proto = req.headers['x-forwarded-proto'] || 'https'
    const url = new URL(req.url, proto + '://' + host)
    return url.searchParams.get('preview') === '1' || url.searchParams.get('sanity-preview') === '1'
  } catch {
    return false
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
  res.setHeader('Vary', 'Cookie')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') return res.status(405).json({error: 'Method not allowed'})

  const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN
  if (!token) return res.status(503).json({error: 'Sanity token not configured'})

  const preview = wantsPreview(req)
  const perspective = preview ? 'drafts' : 'published'

  const url =
    'https://' +
    PROJECT_ID +
    '.api.sanity.io/v' +
    API_VERSION +
    '/data/query/' +
    DATASET +
    '?query=' +
    encodeURIComponent(QUERY) +
    '&perspective=' +
    encodeURIComponent(perspective)

  const upstream = await fetch(url, {
    headers: {Authorization: 'Bearer ' + token},
  })
  if (!upstream.ok) return res.status(502).json({error: 'Sanity query failed'})

  const json = await upstream.json()
  res.setHeader('Cache-Control', preview ? 'private, no-store' : 'public, max-age=0, must-revalidate')
  return res.status(200).json({result: json.result || null, perspective})
}
