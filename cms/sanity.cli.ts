import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '9bj3w2vo',
    dataset: 'production',
  },
  deployment: {
    autoUpdates: true,
  },
})
