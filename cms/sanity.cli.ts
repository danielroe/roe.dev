import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '9bj3w2vo',
    dataset: 'production',
  },
  deployment: {
    appId: 'fq7iikx0dv9y4w5vo31o5jqk',
    autoUpdates: true,
  },
})
