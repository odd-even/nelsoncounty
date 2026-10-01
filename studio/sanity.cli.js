import {defineCliConfig} from 'sanity/cli'
import {projectId, dataset} from './project.js'

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  studioHost: 'check-into-nelson',
  deployment: {
    appId: 'hbjlgqzncnuag1rb7cv3oekx',
  },
})
