import {defineField, defineType} from 'sanity'

function requireImageOrUrl(message = 'Upload an image or provide a fallback URL') {
  return (Rule) =>
    Rule.custom((value, context) => {
      const parent = context?.parent || {}
      if (value?.asset?._ref || parent.imageUrl) return true
      return message
    })
}

const imageUpload = defineField({
  name: 'image',
  title: 'Upload image',
  type: 'image',
  options: {hotspot: true},
  description: 'Preferred. Served as optimized WebP from the Sanity CDN.',
})

const requiredImageUpload = defineField({
  ...imageUpload,
  validation: requireImageOrUrl(),
})

const legacyImageUrl = defineField({
  name: 'imageUrl',
  title: 'Fallback image URL',
  type: 'url',
  description: 'Optional fallback only. Prefer Upload image above.',
})

export const ctaType = defineType({
  name: 'cta',
  title: 'Button',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'Page anchor (#stay) or full URL',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'href'},
  },
})

export const heroSlideType = defineType({
  name: 'heroSlide',
  title: 'Hero / banner slide',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Name',
      type: 'string',
      description: 'Shown on the banner caption and slide control.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Caption tag links to',
      type: 'string',
      description: 'Same jump target the little banner caption tag uses when clicked.',
      options: {
        list: [
          {title: 'Farmhouse at Veritas', value: '#feature-farmhouse'},
          {title: 'Devils Backbone Campground', value: '#feature-devils-backbone-camp'},
          {title: 'The Indigo House', value: '#feature-indigo-house'},
          {title: 'Retreat at Crabtree Falls', value: '#feature-retreat-crabtree'},
          {title: 'Flying Fox Vineyard', value: '#feature-flying-fox'},
          {title: 'Glass Hollow Studio', value: '#feature-glass-hollow'},
          {title: 'Blue Ridge Tunnel', value: '#feature-tunnel'},
          {title: 'Wintergreen Resort', value: '#feature-wintergreen'},
          {title: 'Nelson 29', value: '#feature-nelson-29'},
          {title: 'Reliable Rides', value: '#feature-rides'},
          {title: 'Choose your stay', value: '#stay'},
          {title: 'Build your experience', value: '#experience'},
          {title: 'Itinerary', value: '#itinerary'},
          {title: 'Highlights', value: '#highlights'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    requiredImageUpload,
    legacyImageUrl,
  ],
  preview: {
    select: {title: 'label', subtitle: 'href', media: 'image'},
  },
})

export const stayType = defineType({
  name: 'stay',
  title: 'Stay',
  type: 'object',
  fields: [
    defineField({name: 'key', title: 'ID', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'copy', title: 'Description', type: 'text', rows: 3, validation: (Rule) => Rule.required()}),
    defineField({name: 'offerNote', title: 'Offer note', type: 'string'}),
    defineField({name: 'badge', title: 'Badge', type: 'string', description: 'Shown on the photo, for example 15% off.'}),
    requiredImageUpload,
    legacyImageUrl,
    defineField({
      name: 'gallery',
      title: 'Photo gallery',
      type: 'array',
      of: [{type: 'galleryImage'}],
      description: 'Carousel photos. Upload each image — served as optimized WebP.',
    }),
    defineField({name: 'cta', title: 'Button', type: 'cta', validation: (Rule) => Rule.required()}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'cta.label', media: 'image'},
  },
})

export const partnerType = defineType({
  name: 'partner',
  title: 'Partner',
  type: 'object',
  fields: [
    defineField({name: 'key', title: 'ID', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'role', title: 'Role line', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'badge', title: 'Category badge', type: 'string', description: 'Pill on the photo, for example Sip or Create.'}),
    defineField({name: 'discount', title: 'Discount pill', type: 'string', description: 'Shown on the button, for example 10% off.'}),
    defineField({name: 'copy', title: 'Description', type: 'text', rows: 4, validation: (Rule) => Rule.required()}),
    defineField({name: 'offerNote', title: 'Offer note', type: 'string', description: 'Shown next to the promo code, for example 10% off.'}),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Taste', value: 'taste'},
          {title: 'Culture', value: 'culture'},
          {title: 'Outdoor', value: 'outdoor'},
          {title: 'Experience', value: 'experience'},
          {title: 'Community', value: 'community'},
        ],
      },
    }),
    defineField({name: 'showInStrip', title: 'Show in partner strip', type: 'boolean', initialValue: true}),
    requiredImageUpload,
    legacyImageUrl,
    defineField({
      name: 'gallery',
      title: 'Photo gallery',
      type: 'array',
      of: [{type: 'galleryImage'}],
      description: 'Carousel photos. Upload each image — served as optimized WebP.',
    }),
    defineField({name: 'cta', title: 'Primary button', type: 'cta', validation: (Rule) => Rule.required()}),
    defineField({name: 'secondaryCta', title: 'Secondary button', type: 'cta'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'badge', media: 'image'},
  },
})

export const galleryImageType = defineType({
  name: 'galleryImage',
  title: 'Gallery photo',
  type: 'object',
  fields: [
    defineField({name: 'alt', title: 'Alt text', type: 'string'}),
    requiredImageUpload,
    legacyImageUrl,
  ],
  preview: {
    select: {title: 'alt', media: 'image'},
    prepare({title, media}) {
      return {title: title || 'Photo', media}
    },
  },
})

export const placeCardType = defineType({
  name: 'placeCard',
  title: 'Place card',
  type: 'object',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'label', title: 'Label', type: 'string', description: 'Short pill, such as Sip or Stay.'}),
    defineField({name: 'copy', title: 'Description', type: 'text', rows: 3}),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'Page anchor (#feature-farmhouse) or full URL.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'alt', title: 'Alt text', type: 'string'}),
    requiredImageUpload,
    legacyImageUrl,
  ],
  preview: {
    select: {title: 'name', subtitle: 'label', media: 'image'},
  },
})


export const itineraryStayType = defineType({
  name: 'itineraryStay',
  title: 'Itinerary stay option',
  type: 'object',
  fields: [
    defineField({
      name: 'key',
      title: 'ID',
      type: 'string',
      description: 'Must match the page key: farmhouse, backbone, indigo, or retreat.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'title', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    requiredImageUpload,
    legacyImageUrl,
    defineField({name: 'bookHref', title: 'Book link', type: 'url', validation: (Rule) => Rule.required()}),
    defineField({name: 'bookLabel', title: 'Book button label', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'discount', title: 'Discount pill', type: 'string', description: 'For example 10% off.'}),
    defineField({
      name: 'offerNote',
      title: 'Offer note',
      type: 'string',
      description: 'Use {code} where the promo code should appear.',
    }),
    defineField({name: 'partner', title: 'Tracking partner id', type: 'string'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'discount', media: 'image'},
  },
})

export const itinerarySipType = defineType({
  name: 'itinerarySip',
  title: 'Itinerary sip option',
  type: 'object',
  fields: [
    defineField({
      name: 'key',
      title: 'ID',
      type: 'string',
      description: 'Must match the page key: flyingfox, backbone, or nelson29.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'title', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    requiredImageUpload,
    legacyImageUrl,
    defineField({name: 'visitHref', title: 'Visit link', type: 'url', validation: (Rule) => Rule.required()}),
    defineField({name: 'visitLabel', title: 'Visit button label', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'discount', title: 'Discount pill', type: 'string', description: 'For example 10% off. Leave blank for no pill.'}),
    defineField({
      name: 'offerNote',
      title: 'Offer note',
      type: 'string',
      description: 'Use {code} where the promo code should appear.',
    }),
    defineField({name: 'partner', title: 'Tracking partner id', type: 'string'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'discount', media: 'image'},
  },
})
