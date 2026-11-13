const {createClient} = require('@sanity/client')
const {validatePreviewUrl} = require('@sanity/preview-url-secret')

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'ccbigluo'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = process.env.SANITY_API_VERSION || '2024-10-01'
const PREVIEW_COOKIE = '__sanity_preview'
const SITE_ORIGIN = 'https://visit.nelsoncounty.com'

function withPreviewUrl(target) {
  try {
    const url = new URL(target, SITE_ORIGIN)
    url.protocol = 'https:'
    url.host = 'visit.nelsoncounty.com'
    url.searchParams.set('sanity-preview', '1')
    return url.toString()
  } catch {
    return SITE_ORIGIN + '/?sanity-preview=1'
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://check-into-nelson.sanity.studio')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed')
  }

  const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN
  if (!token) return res.status(501).send('Sanity preview is not configured.')

  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: API_VERSION,
    useCdn: false,
    token,
  })

  const requestUrl = new URL(req.url, SITE_ORIGIN)

  let result
  try {
    result = await validatePreviewUrl(client, requestUrl.toString())
  } catch (err) {
    console.error('validatePreviewUrl failed', err && err.message)
    return res.status(401).send('Invalid secret')
  }

  const {isValid, redirectTo = '/'} = result || {}
  if (!isValid) return res.status(401).send('Invalid secret')

  res.setHeader(
    'Set-Cookie',
    PREVIEW_COOKIE + '=1; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=3600'
  )
  res.writeHead(307, {Location: withPreviewUrl(redirectTo)})
  res.end()
}
