config = require __dirname + '/../server/config.json'
MongoClient = require('mongodb').MongoClient

MongoClient.connect config.mongo, (err, db) ->
  generator = process.argv[2]
  generator = require __dirname + '/generators/' + generator
  i = 0
  generator db,
    increment: () ->
      i++
      if 0 == i % 1000
        console.log i
