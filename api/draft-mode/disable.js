const PREVIEW_COOKIE = '__sanity_preview'

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed')
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'visit.nelsoncounty.com'
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const secure = proto === 'https'

  res.setHeader(
    'Set-Cookie',
    PREVIEW_COOKIE + '=; Path=/; HttpOnly; SameSite=None; Max-Age=0' + (secure ? '; Secure' : '')
  )
  res.writeHead(307, {Location: '/'})
  res.end()
}
