/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3099749703")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file2558852872",
    "maxSelect": 0,
    "maxSize": 600,
    "mimeTypes": [],
    "name": "archivo_zip",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3099749703")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file2558852872",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": null,
    "name": "archivo_zip",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  return app.save(collection)
})
