faker = require 'faker'
_ = require 'underscore'

users = []

module.exports = (db, $) ->
  cursor = db.collection('users').find({friend: {$ne: null}});
  iterate = () ->
    cursor.each (err, user) ->
      if err
        console.error err
      else
        sample = _.sample(users, _.random(0, 500))
        $.increment()
  #      console.log sample.length
        if users.friend
          iterate()
        else
          users.push user._id
          if users.length > 2000
            users.splice(_.random(0, users.length - 1), 1)
          db.collection('users').updateOne {_id: user._id}, {$set: {friend: sample}}, iterate
  iterate()
