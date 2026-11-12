const {createClient} = require('@sanity/client')
const {validatePreviewUrl} = require('@sanity/preview-url-secret')

const PROJECT_ID = process.env.SANITY_PROJECT_ID || 'ccbigluo'
const DATASET = process.env.SANITY_DATASET || 'production'
const API_VERSION = process.env.SANITY_API_VERSION || '2024-10-01'
const PREVIEW_COOKIE = '__sanity_preview'

function withPreviewParam(target) {
  try {
    const url = new URL(target, 'https://visit.nelsoncounty.com')
    url.searchParams.set('sanity-preview', '1')
    return url.pathname + url.search + url.hash
  } catch {
    return '/?sanity-preview=1'
  }
}

module.exports = async function handler(req, res) {
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

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'visit.nelsoncounty.com'
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const requestUrl = new URL(req.url, proto + '://' + host)

  const {isValid, redirectTo = '/'} = await validatePreviewUrl(client, requestUrl.toString())
  if (!isValid) return res.status(401).send('Invalid secret')

  const secure = proto === 'https'
  res.setHeader(
    'Set-Cookie',
    PREVIEW_COOKIE +
      '=1; Path=/; HttpOnly; SameSite=None; Max-Age=3600' +
      (secure ? '; Secure' : '')
  )
  res.writeHead(307, {Location: withPreviewParam(redirectTo)})
  res.end()
}
