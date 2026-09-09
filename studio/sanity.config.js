import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas/index.js'
import {deskStructure} from './deskStructure.js'
import {projectId, dataset} from './project.js'

export default defineConfig({
  name: 'check-into-nelson',
  title: 'Check Into Nelson',
  projectId,
  dataset,
  plugins: [
    structureTool({structure: deskStructure}),
    visionTool({defaultApiVersion: '2024-10-01'}),
  ],
  schema: {
    types: schemaTypes,
  },
})
