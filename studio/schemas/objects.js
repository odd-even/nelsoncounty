import {defineField, defineType} from 'sanity'

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
  title: 'Hero slide',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string'}),
    defineField({
      name: 'imageUrl',
      title: 'Image URL',
      type: 'url',
      description: 'Existing ImageKit or site asset URL',
    }),
    defineField({
      name: 'image',
      title: 'Upload image',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'label', media: 'image'},
  },
})

export const stayType = defineType({
  name: 'stay',
  title: 'Stay',
  type: 'object',
  fields: [
    defineField({name: 'key', title: 'ID', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'copy', title: 'Description', type: 'text', rows: 3}),
    defineField({name: 'offerNote', title: 'Offer note', type: 'string'}),
    defineField({name: 'imageUrl', title: 'Image URL', type: 'url'}),
    defineField({name: 'image', title: 'Upload image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'cta', title: 'Button', type: 'cta'}),
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
    defineField({name: 'role', title: 'Role line', type: 'string'}),
    defineField({name: 'badge', title: 'Badge', type: 'string'}),
    defineField({name: 'copy', title: 'Description', type: 'text', rows: 4}),
    defineField({name: 'offerNote', title: 'Offer note', type: 'string'}),
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
    defineField({name: 'imageUrl', title: 'Image URL', type: 'url'}),
    defineField({name: 'image', title: 'Upload image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'cta', title: 'Primary button', type: 'cta'}),
    defineField({name: 'secondaryCta', title: 'Secondary button', type: 'cta'}),
  ],
  preview: {
    select: {title: 'name', subtitle: 'badge', media: 'image'},
  },
})

export const passportStepType = defineType({
  name: 'passportStep',
  title: 'Passport step',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'copy', title: 'Copy', type: 'text', rows: 3}),
  ],
})
