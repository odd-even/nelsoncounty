export const deskStructure = (S) =>
  S.list()
    .title('Check Into Nelson')
    .items([
      S.listItem()
        .title('Campaign page')
        .id('campaign')
        .child(
          S.document()
            .schemaType('campaign')
            .documentId('campaign')
            .title('Campaign page')
        ),
      S.divider(),
      S.listItem()
        .title('Travel from answers')
        .schemaType('travelFromResponse')
        .child(
          S.documentTypeList('travelFromResponse')
            .title('Travel from answers')
            .defaultOrdering([{field: 'submittedAt', direction: 'desc'}])
        ),
    ])
