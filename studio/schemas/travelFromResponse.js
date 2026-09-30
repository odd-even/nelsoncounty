import {defineField, defineType} from 'sanity'

export const travelFromResponseType = defineType({
  name: 'travelFromResponse',
  title: 'Travel from answer',
  type: 'document',
  fields: [
    defineField({
      name: 'origin',
      title: 'Origin id',
      type: 'string',
      description: 'Preset id (e.g. richmond, md) or "custom".',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Human-readable place name shown in the popup.',
      readOnly: true,
    }),
    defineField({
      name: 'customLabel',
      title: 'Custom location',
      type: 'string',
      description: 'Free-text answer when origin is custom.',
      readOnly: true,
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted at',
      type: 'datetime',
      readOnly: true,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'pageUrl',
      title: 'Page URL',
      type: 'url',
      readOnly: true,
    }),
    defineField({
      name: 'referrer',
      title: 'Referrer',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'userAgent',
      title: 'User agent',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
  ],
  preview: {
    select: {
      origin: 'origin',
      label: 'label',
      customLabel: 'customLabel',
      submittedAt: 'submittedAt',
    },
    prepare({origin, label, customLabel, submittedAt}) {
      const title = customLabel || label || origin || 'Unknown'
      const when = submittedAt
        ? new Date(submittedAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : ''
      return {
        title,
        subtitle: [origin, when].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    {
      title: 'Newest first',
      name: 'submittedAtDesc',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
  ],
})
