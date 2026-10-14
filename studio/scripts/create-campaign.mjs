import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-10-01'}).withConfig({useCdn: false})

const rawIds = await client.fetch('*[_type == "campaign"]._id', {}, {perspective: 'raw'})

const published = rawIds.includes('campaign')
if (published) {
  console.log('Published campaign document already exists')
  process.exit(0)
}

if (rawIds.includes('drafts.campaign')) {
  const draft = await client.getDocument('drafts.campaign')
  const {_rev, ...rest} = draft
  await client.createOrReplace({...rest, _id: 'campaign'})
  await client.delete('drafts.campaign')
  console.log('Published draft campaign document')
  process.exit(0)
}

await client.createOrReplace({
  _id: 'campaign',
  _type: 'campaign',
  promoCode: 'CHECKINTONELSON',
  seoTitle: 'Check Into Nelson | Visit Nelson County',
  heroPhrase1Line1: 'Check Into',
  heroPhrase1Line2: 'Nelson.',
  heroPhrase2Line1: 'Stay Longer.',
  heroPhrase2Line2: 'Experience More.',
  heroLede:
    'Trade the rushed day trip for a few days surrounded by Blue Ridge views, local wine, creative experiences, outdoor adventure, and room to slow down.',
  heroPrimaryCta: {label: 'Choose Your Stay', href: '#stay-title'},
  heroSecondaryCta: {label: 'Find Activities', href: '#experience-title'},
  heroPromoLabel: 'Promo code',
  partnersStripLabel: 'Participating partners',
  introTitle: 'A Blue Ridge getaway that gives you time to enjoy it',
  staysEyebrow: 'Stay longer',
  staysTitle: 'Choose your stay',
  experienceTitle: 'Build your experience',
  experienceCopy:
    'Stay for two nights or make it a three-to-four-day getaway. Choose the experiences that fit your pace and create a trip that feels like your own.',
  itineraryTitle: 'Build your itinerary',
  highlightsTitle: 'There’s so much to do in Nelson County.',
  highlightsCta: {
    label: 'See all activities',
    href: 'https://nelsoncounty.com/find-your-adventure',
  },
  passportEyebrow: 'Loyalty · Powered by LoyalBrew',
  passportTitle: 'Collect stamps while you stay longer',
  footerTitle: 'Check Into Nelson',
  footerCopy:
    'Check Into Nelson is presented by Nelson County Tourism in partnership with participating Nelson County businesses.',
  stays: [
    {_key: 'farmhouse', key: 'farmhouse', name: 'Farmhouse at Veritas'},
    {_key: 'devils-backbone-camp', key: 'devils-backbone-camp', name: 'Devils Backbone Campground'},
    {_key: 'indigo-house', key: 'indigo-house', name: 'The Indigo House'},
    {_key: 'retreat-crabtree', key: 'retreat-crabtree', name: 'The Retreat at Crabtree Falls'},
  ],
  partners: [
    {_key: 'flying-fox', key: 'flying-fox', name: 'Flying Fox Vineyard', role: 'Wine country', badge: 'Sip'},
    {_key: 'glass-hollow', key: 'glass-hollow', name: 'Glass Hollow Studio', role: 'Hands-on artistry', badge: 'Create'},
    {_key: 'tunnel', key: 'tunnel', name: 'Blue Ridge Tunnel', role: 'Historic outdoors', badge: 'Explore'},
    {_key: 'wintergreen', key: 'wintergreen', name: 'Wintergreen Resort', role: 'Mountain resort', badge: 'Explore'},
    {_key: 'nelson-29', key: 'nelson-29', name: 'Nelson 29 Craft Beverage Trail', role: 'Craft beverage trail', badge: 'Sip'},
    {_key: 'rides', key: 'rides', name: 'Reliable Rides', role: 'Get Around', badge: 'Get around'},
  ],
})

console.log('Created published campaign document')
