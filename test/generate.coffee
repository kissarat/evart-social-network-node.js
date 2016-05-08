config = require __dirname + '/../server/config.json'
MongoClient = require('mongodb').MongoClient

MongoClient.connect config.mongo, (err, db) ->
  generator = process.argv[2]
  generator = require __dirname + '/generators/' + generator
  i = 0
  generator db,
    increment: (step = 1000) ->
      i++
      if 0 == i % step
        console.log i