faker = require 'faker'
_ = require 'underscore'

module.exports = (db, $) ->
  aggregation = [
    {$sample: {size: 50000}}
  ]
#  i = 200
  db.collection('users').aggregate aggregation, (err, users) ->
    users = _.map users, (u) -> u._id
    insert_user = () ->
#      i--
#      if i < 0
#        process.exit()
      user =
        domain: [faker.internet.domainWord(), _.random(10000, 50000)].join('_')
        phone: process.hrtime().join('')
        password: '1'
      if users.length > 0
        user.freind = _.sample(users, _.random(1, 500))
      db.collection('users').insertOne user, (err, result) ->
        if err
          console.error err
        else
          $.increment()
        insert_user()
    insert_user()
