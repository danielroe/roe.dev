import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { PublishAction } from './components/PublishAction'

export default defineConfig({
  name: 'default',
  title: 'roe.dev',

  projectId: '9bj3w2vo',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: S =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Questions')
              .child(
                S.list()
                  .title('Questions')
                  .items([
                    S.listItem()
                      .title('Unanswered')
                      .child(
                        S.documentList()
                          .title('Unanswered questions')
                          .apiVersion('v2025-02-19')
                          .filter('_type == "ama" && (answered != true && publishStatus != "published")')
                          .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                          .child(documentId =>
                            S.document().documentId(documentId).schemaType('ama'),
                          ),
                      ),
                    S.listItem()
                      .title('All questions')
                      .child(
                        S.documentList()
                          .title('All questions')
                          .apiVersion('v2025-02-19')
                          .filter('_type == "ama"')
                          .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                          .child(documentId =>
                            S.document().documentId(documentId).schemaType('ama'),
                          ),
                      ),
                  ]),
              ),
            S.listItem()
              .title('Projects')
              .child(
                S.list()
                  .title('Projects')
                  .items([
                    S.listItem()
                      .title('Featured')
                      .child(
                        S.documentList()
                          .title('Featured projects')
                          .filter('_type == "project" && isFeatured == true')
                          .defaultOrdering([{ field: 'order', direction: 'asc' }, { field: 'name', direction: 'asc' }])
                          .child(documentId =>
                            S.document().documentId(documentId).schemaType('project'),
                          ),
                      ),
                    S.listItem()
                      .title('Public')
                      .child(
                        S.documentList()
                          .title('Public projects')
                          .filter('_type == "project" && isPrivate != true')
                          .defaultOrdering([{ field: 'category', direction: 'asc' }, { field: 'order', direction: 'asc' }, { field: 'name', direction: 'asc' }])
                          .child(documentId =>
                            S.document().documentId(documentId).schemaType('project'),
                          ),
                      ),
                    S.listItem()
                      .title('All projects')
                      .child(
                        S.documentList()
                          .title('All projects')
                          .filter('_type == "project"')
                          .defaultOrdering([{ field: 'isFeatured', direction: 'desc' }, { field: 'order', direction: 'asc' }, { field: 'name', direction: 'asc' }])
                          .child(documentId =>
                            S.document().documentId(documentId).schemaType('project'),
                          ),
                      ),
                  ]),
              ),
            // Add other document types
            ...S.documentTypeListItems().filter(listItem => !['ama', 'project'].includes(listItem.getId() || '')),
          ]),
    }),
    visionTool(),
  ],

  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'ama') {
        // Filter out the default publish action for AMA documents
        const filteredActions = prev.filter(action => action.name !== 'publish')
        return [PublishAction, ...filteredActions]
      }
      return prev
    },
  },

  schema: {
    types: schemaTypes,
  },
})
