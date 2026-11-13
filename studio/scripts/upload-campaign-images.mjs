/**
 * Upload every campaign imageUrl into Sanity assets and attach image{} refs.
 * Prefers local files under the repo when the URL points at visit.nelsoncounty.com.
 *
 * Usage:
 *   SANITY_AUTH_TOKEN=... node scripts/upload-campaign-images.mjs
 */
import {createClient} from '@sanity/client'
import {createReadStream, existsSync} from 'node:fs'
import {basename, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {projectId, dataset} from '../project.js'

const token = process.env.SANITY_AUTH_TOKEN || process.env.SANITY_API_WRITE_TOKEN
if (!token) {
  console.error('Set SANITY_AUTH_TOKEN (or SANITY_API_WRITE_TOKEN) to upload images.')
  process.exit(1)
}

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-01',
  token,
  useCdn: false,
})

const IMAGE_LISTS = [
  ['heroSlides', 'image'],
  ['partnerChips', 'image'],
  ['introCards', 'image'],
  ['highlights', 'image'],
  ['itineraryStays', 'image'],
  ['itinerarySips', 'image'],
]

function localPathFromUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url, 'https://visit.nelsoncounty.com')
    if (!/visit\.nelsoncounty\.com$/i.test(u.hostname) && u.hostname !== 'localhost') return null
    const path = decodeURIComponent(u.pathname.replace(/^\//, ''))
    const full = join(ROOT, path)
    return existsSync(full) ? full : null
  } catch {
    return null
  }
}

function filenameFromUrl(url) {
  try {
    return basename(new URL(url, 'https://visit.nelsoncounty.com').pathname) || 'image.webp'
  } catch {
    return 'image.webp'
  }
}

const cache = new Map()

async function uploadFromUrl(url) {
  if (!url) return null
  if (cache.has(url)) return cache.get(url)

  const local = localPathFromUrl(url)
  let asset
  if (local) {
    asset = await client.assets.upload('image', createReadStream(local), {
      filename: basename(local),
      contentType: local.endsWith('.webp') ? 'image/webp' : undefined,
    })
    console.log('uploaded local', basename(local), '->', asset._id)
  } else {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch ' + url + ' (' + res.status + ')')
    const buf = Buffer.from(await res.arrayBuffer())
    asset = await client.assets.upload('image', buf, {
      filename: filenameFromUrl(url),
      contentType: res.headers.get('content-type') || undefined,
    })
    console.log('uploaded remote', filenameFromUrl(url), '->', asset._id)
  }

  const image = {
    _type: 'image',
    asset: {_type: 'reference', _ref: asset._id},
  }
  cache.set(url, image)
  return image
}

function withImage(item, image) {
  if (!item || !image) return item
  const next = {...item, image}
  // Keep imageUrl as fallback until Studio uploads are confirmed everywhere.
  return next
}

async function mapList(items, field) {
  if (!Array.isArray(items)) return items
  const out = []
  for (const item of items) {
    if (!item) {
      out.push(item)
      continue
    }
    let next = {...item}
    if (item.imageUrl && !(item.image && item.image.asset && item.image.asset._ref)) {
      try {
        next = withImage(next, await uploadFromUrl(item.imageUrl))
      } catch (err) {
        console.warn('skip', item.imageUrl, err.message || err)
      }
    }
    if (field === 'gallery' && Array.isArray(item.gallery)) {
      next.gallery = await mapList(item.gallery, 'image')
    }
    out.push(next)
  }
  return out
}

const doc = await client.fetch(`*[_id == "campaign"][0]`)
if (!doc) {
  console.error('No campaign document found.')
  process.exit(1)
}

const patch = {_id: 'campaign', _type: 'campaign'}

for (const [listName] of IMAGE_LISTS) {
  if (doc[listName]) patch[listName] = await mapList(doc[listName], 'image')
}

if (doc.stays) {
  patch.stays = []
  for (const stay of doc.stays) {
    let next = {...stay}
    if (stay.imageUrl && !(stay.image && stay.image.asset)) {
      try {
        next = withImage(next, await uploadFromUrl(stay.imageUrl))
      } catch (err) {
        console.warn('skip stay', stay.key, err.message || err)
      }
    }
    if (Array.isArray(stay.gallery)) next.gallery = await mapList(stay.gallery, 'image')
    patch.stays.push(next)
  }
}

if (doc.partners) {
  patch.partners = []
  for (const partner of doc.partners) {
    let next = {...partner}
    if (partner.imageUrl && !(partner.image && partner.image.asset)) {
      try {
        next = withImage(next, await uploadFromUrl(partner.imageUrl))
      } catch (err) {
        console.warn('skip partner', partner.key, err.message || err)
      }
    }
    if (Array.isArray(partner.gallery)) next.gallery = await mapList(partner.gallery, 'image')
    patch.partners.push(next)
  }
}

await client.createOrReplace({...doc, ...patch})
console.log('Campaign images uploaded and attached.', 'assets:', cache.size)
