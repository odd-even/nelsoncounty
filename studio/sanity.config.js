import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemas/index.js'
import {deskStructure} from './deskStructure.js'
import {projectId, dataset} from './project.js'

const previewOrigin = 'https://visit.nelsoncounty.com'

export default defineConfig({
  name: 'check-into-nelson',
  title: 'Check Into Nelson',
  projectId,
  dataset,
  plugins: [
    structureTool({structure: deskStructure}),
    presentationTool({
      title: 'Visual editor',
      previewUrl: {
        origin: previewOrigin,
        preview: '/?sanity-preview=1',
        initial: previewOrigin + '/?sanity-preview=1',
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
                  href: '/?sanity-preview=1',
                },
              ],
            }),
          }),
        },
      },
    }),
    visionTool({defaultApiVersion: '2024-10-01'}),
  ],
  schema: {
    types: schemaTypes,
  },
})
