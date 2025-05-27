import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

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
                          .filter('_type == "ama" && answered != true')
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
                          .filter('_type == "ama"')
                          .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                          .child(documentId =>
                            S.document().documentId(documentId).schemaType('ama'),
                          ),
                      ),
                  ]),
              ),
            // Add other document types
            ...S.documentTypeListItems().filter(listItem => listItem.getId() !== 'ama'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
