import {createClient} from '@sanity/client'
import {projectId, dataset} from '../project.js'
import {campaignSeed} from './campaign-seed.mjs'
import {randomUUID} from 'node:crypto'

const token = process.env.SANITY_AUTH_TOKEN
if (!token) {
  console.error('Set SANITY_AUTH_TOKEN to seed the campaign document.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-01',
  token,
  useCdn: false,
})

function withKeys(value) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return withKeys(item)
      }
      const next = {...item, _key: item._key || randomUUID().replace(/-/g, '').slice(0, 12)}
      for (const [k, v] of Object.entries(next)) {
        if (k === '_key') continue
        next[k] = withKeys(v)
      }
      return next
    })
  }
  if (value && typeof value === 'object') {
    const next = {...value}
    for (const [k, v] of Object.entries(next)) {
      next[k] = withKeys(v)
    }
    return next
  }
  return value
}

const doc = {
  _id: 'campaign',
  _type: 'campaign',
  ...withKeys(campaignSeed),
}

await client.createOrReplace(doc)
console.log('Seeded campaign document on', projectId, dataset)
