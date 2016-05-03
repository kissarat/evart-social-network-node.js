faker = require 'faker'
_ = require 'underscore'

users = null

module.exports = (db, $) ->
  usersCollection = db.collection('users')
  cursor = usersCollection.find({friend: {$ne: null}}, {_id: 1})
  insert_user_messages = () ->
    cursor.nextObject (err, user) ->
      if err or not user
        console.log err
        insert_user_messages()
      else
        targets = _.sample users, _.random 50, 500
        messages = []
        finish = Date.now()
        start = finish - 1000 * 3600 * 24 * 365 * 5
        insert_message = () ->
          target = targets.pop()
          message =
            source: user._id
            target: target
            text: faker.lorem.sentences()
            time: new Date(_.random(start, finish)).toISOString()
          db.collection('messages').insertOne message, (err, result) ->
            if err
              console.error err
            else
              $.increment()
            if targets.length > 0
              insert_message()
            else
              insert_user_messages()
        insert_message()
  usersCollection.aggregate [{$sample: {size: _.random(500, 2000)}}], (err, array) ->
    if err
      console.error err
      process.exit()
    else
      users = array.map (u) -> u._id
#    console.log users.length
    insert_user_messages()
