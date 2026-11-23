/**
 * Patch Love Ridge stay + itinerary terms fields into the campaign document.
 *
 * Usage (from studio/):
 *   node scripts/push-love-ridge-terms.mjs
 */
import {getCliClient} from 'sanity/cli'
import {randomUUID} from 'node:crypto'

const client = getCliClient({apiVersion: '2024-10-01'}).withConfig({useCdn: false})

const TERMS = {
  termsSummary: 'Terms apply*',
  termsLead:
    'Black Friday Escape: Save 25%* on any 2-night stay at Love Ridge this winter. Book between November 18 and 30, 2026 for a stay from December 2026 through March 31, 2027.',
  termsFinePrint:
    'Available for new, directly booked reservations. Not valid for stays December 24 through January 2, or over MLK Day and Presidents’ Day weekends.',
  termsRequirementsLabel: 'Requirements',
  termsRequirements: [
    'Available Dec 1, 2026 – Dec 24, 2026',
    'Available Jan 3, 2027 – Jan 15, 2027',
    'Additional winter dates through March 31, 2027 (excluding blackout periods)',
    'Stay for at least 2 consecutive nights',
  ],
}

const campaign = await client.fetch(
  `*[_id == "campaign"][0]{
    _id,
    stays[]{_key,key,name},
    partnerChips[]{_key,name,href},
    introCards[]{_key,name,href},
    itineraryStays[]{_key,key,title}
  }`
)

if (!campaign?._id) {
  console.error('Campaign document not found')
  process.exit(1)
}

const stay = (campaign.stays || []).find(
  (s) => s.key === 'love-ridge' || s.key === 'Love Ridge' || /love\s*ridge/i.test(s.name || '')
)
if (!stay?._key) {
  console.error('Love Ridge stay not found in campaign.stays')
  process.exit(1)
}

const patches = client.transaction()

patches.patch('campaign', (p) =>
  p
    .set({[`stays[_key=="${stay._key}"].key`]: 'love-ridge'})
    .set({[`stays[_key=="${stay._key}"].name`]: 'Love Ridge'})
    .set({
      [`stays[_key=="${stay._key}"].copy`]:
        'Cozy up in a cabin on the Blue Ridge Parkway, with quiet mornings, clear nights and room to slow down.',
    })
    .set({[`stays[_key=="${stay._key}"].offerNote`]: '25%* Off Winter Stays'})
    .set({[`stays[_key=="${stay._key}"].badge`]: '25% off*'})
    .set({[`stays[_key=="${stay._key}"].termsSummary`]: TERMS.termsSummary})
    .set({[`stays[_key=="${stay._key}"].termsLead`]: TERMS.termsLead})
    .set({[`stays[_key=="${stay._key}"].termsFinePrint`]: TERMS.termsFinePrint})
    .set({[`stays[_key=="${stay._key}"].termsRequirementsLabel`]: TERMS.termsRequirementsLabel})
    .set({[`stays[_key=="${stay._key}"].termsRequirements`]: TERMS.termsRequirements})
    .set({
      [`stays[_key=="${stay._key}"].cta`]: {
        _type: 'cta',
        label: 'Book Love Ridge',
        href: 'https://loveridgeva.com/',
      },
    })
)

const hasChip = (campaign.partnerChips || []).some((c) => c.href === '#feature-love-ridge')
if (!hasChip) {
  patches.patch('campaign', (p) =>
    p.append('partnerChips', [
      {
        _key: randomUUID().replace(/-/g, '').slice(0, 12),
        _type: 'placeCard',
        name: 'Love Ridge',
        label: 'Stay',
        href: '#feature-love-ridge',
        alt: 'Love Ridge',
        imageUrl: 'https://visit.nelsoncounty.com/assets/check-into-nelson/cards/love-ridge-sq-400.webp?v=20261123a',
      },
    ])
  )
}

const hasIntro = (campaign.introCards || []).some((c) => c.href === '#feature-love-ridge')
if (!hasIntro) {
  patches.patch('campaign', (p) =>
    p.append('introCards', [
      {
        _key: randomUUID().replace(/-/g, '').slice(0, 12),
        _type: 'placeCard',
        name: 'Love Ridge',
        label: 'Stay',
        copy: 'Black Friday Escape: 25% off* any 2-night winter stay on the Blue Ridge Parkway.',
        href: '#feature-love-ridge',
        alt: 'Love Ridge',
        imageUrl: 'https://visit.nelsoncounty.com/assets/check-into-nelson/cards/love-ridge-card-480.webp?v=20261123a',
      },
    ])
  )
}

const itin = (campaign.itineraryStays || []).find((s) => s.key === 'loveridge')
if (itin?._key) {
  patches.patch('campaign', (p) =>
    p
      .set({[`itineraryStays[_key=="${itin._key}"].title`]: 'Love Ridge'})
      .set({[`itineraryStays[_key=="${itin._key}"].bookHref`]: 'https://loveridgeva.com/'})
      .set({[`itineraryStays[_key=="${itin._key}"].bookLabel`]: 'Book Love Ridge'})
      .set({[`itineraryStays[_key=="${itin._key}"].discount`]: '25% off*'})
      .set({[`itineraryStays[_key=="${itin._key}"].offerNote`]: '25%* Off Winter Stays'})
      .set({[`itineraryStays[_key=="${itin._key}"].partner`]: 'love-ridge'})
      .set({[`itineraryStays[_key=="${itin._key}"].termsSummary`]: TERMS.termsSummary})
      .set({[`itineraryStays[_key=="${itin._key}"].termsLead`]: TERMS.termsLead})
      .set({[`itineraryStays[_key=="${itin._key}"].termsFinePrint`]: TERMS.termsFinePrint})
      .set({[`itineraryStays[_key=="${itin._key}"].termsRequirementsLabel`]: TERMS.termsRequirementsLabel})
      .set({[`itineraryStays[_key=="${itin._key}"].termsRequirements`]: TERMS.termsRequirements})
      .set({
        [`itineraryStays[_key=="${itin._key}"].imageUrl`]:
          'https://visit.nelsoncounty.com/assets/check-into-nelson/cards/love-ridge-sq-400.webp?v=20261123a',
      })
  )
} else {
  patches.patch('campaign', (p) =>
    p.append('itineraryStays', [
      {
        _key: randomUUID().replace(/-/g, '').slice(0, 12),
        _type: 'itineraryStay',
        key: 'loveridge',
        title: 'Love Ridge',
        bookHref: 'https://loveridgeva.com/',
        bookLabel: 'Book Love Ridge',
        discount: '25% off*',
        offerNote: '25%* Off Winter Stays',
        partner: 'love-ridge',
        imageUrl:
          'https://visit.nelsoncounty.com/assets/check-into-nelson/cards/love-ridge-sq-400.webp?v=20261123a',
        ...TERMS,
      },
    ])
  )
}

const result = await patches.commit({visibility: 'async'})
console.log('Patched campaign', result)
const verify = await client.fetch(
  `*[_id == "campaign"][0]{
    stays[key == "love-ridge"][0]{key,name,badge,offerNote,termsSummary,termsRequirements},
    partnerChips[href == "#feature-love-ridge"][0]{name,href},
    introCards[href == "#feature-love-ridge"][0]{name,href,copy},
    itineraryStays[key == "loveridge"][0]{key,title,discount,termsSummary,termsRequirements}
  }`
)
console.log(JSON.stringify(verify, null, 2))
