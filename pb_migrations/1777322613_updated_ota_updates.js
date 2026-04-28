/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3099749703")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "bool1282619419",
    "name": "activa",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3099749703")

  // remove field
  collection.fields.removeById("bool1282619419")

  return app.save(collection)
})
