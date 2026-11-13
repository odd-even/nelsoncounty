import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemas/index.js'
import {deskStructure} from './deskStructure.js'
import {projectId, dataset} from './project.js'

// Stable production preview only — never localhost.
const previewOrigin = 'https://visit.nelsoncounty.com'

export default defineConfig({
  name: 'check-into-nelson',
  title: 'Check Into Nelson',
  projectId,
  dataset,
  plugins: [
    presentationTool({
      name: 'preview',
      title: 'Preview',
      previewUrl: {
        origin: previewOrigin,
        preview: '/',
        initial: previewOrigin + '/',
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
      allowOrigins: [previewOrigin],
      resolve: {
        mainDocuments: defineDocuments([
          {
            route: '/',
            filter: `_type == "campaign" && _id == "campaign"`,
          },
        ]),
        locations: {
          campaign: defineLocations({
            select: {title: 'seoTitle'},
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || 'Check Into Nelson',
                  href: '/',
                },
              ],
            }),
          }),
        },
      },
    }),
    structureTool({structure: deskStructure}),
    visionTool({defaultApiVersion: '2024-10-01'}),
  ],
  schema: {
    types: schemaTypes,
  },
})
