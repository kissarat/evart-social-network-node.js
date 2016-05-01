faker = require 'faker'
_ = require 'underscore'

module.exports = (db, $) ->
  db.collection('users').find {}, {_id: 1}, (err, reader) ->
    reader.toArray().then (users) ->
      users = _.map users, (u) -> u._id
      insert_user = () ->
        user =
          domain: [faker.internet.domainWord(), faker.internet.domainWord(), _.random(1, users.length / 2)].join('_')
          phone: process.hrtime().join('')
          password: '1'
          friend: _.sample(users, _.random(1, 500))
        db.collection('users').insertOne user, (err, result) ->
          if err
            console.error err
          else
            $.increment()
            insert_user()
      insert_user()
