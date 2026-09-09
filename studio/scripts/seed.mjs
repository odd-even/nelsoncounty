import {createClient} from '@sanity/client'
import {projectId, dataset} from '../project.js'
import {campaignSeed} from './campaign-seed.mjs'

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

const doc = {
  _id: 'campaign',
  _type: 'campaign',
  ...campaignSeed,
}

await client.createOrReplace(doc)
console.log('Seeded campaign document on', projectId, dataset)
