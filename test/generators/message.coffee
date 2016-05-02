faker = require 'faker'
_ = require 'underscore'

users = null

module.exports = (db, $) ->
  usersCollection = db.collection('users')
  cursor = usersCollection.find({friend: {$ne: null}}, {_id: 1, friend: {$slice: [0, 50]}})
  insert_messages = () ->
    cursor.each (err, user) ->
      if err or 0 == user.friend.length
        console.log err, user
        return insert_messages()
      friends = _.sample(user.friend, _.random(2, users.friend.length))
      strangers = _.sample(users, _.random(2, Math.round(friends.length / 10)))
      targets = friends.concat strangers
#      if users.length > 0 and targets.length > 0
#        users.splice _.random(0, users.length - targets.length) - 1, targets.length
      users = users.concat targets
      messages = []
      finish = Date.now()
      start = finish - 1000 * 3600 * 24 * 365 * 5
      for target in targets
        max = _.random(1, 200)
        console.log max
        for i in [0 .. max]
          messages.push
            source: user._id
            target: target
            text: faker.lorem.sentences()
            time: new Date(_.random(start, finish)).toISOString()
      messages = _.shuffle messages
      if messages.length > 0
        db.collection('messages').insert messages, (err, result) ->
          if err
            console.error err
          else
            $.increment(10)
      else
        console.log 'No messages'
      insert_messages()
  usersCollection.aggregate [{$sample: {size: _.random(1, 500)}}], (err, array) ->
    users = array.map (u) -> u._id
#    console.log users.length
    insert_messages()
