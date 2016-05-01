faker = require 'faker'
_ = require 'underscore'

module.exports = (db, $) ->
  db.collection('users').find {}, {_id: 1}, (err, reader) ->
#    .skip(_.random(1, 100000)).limit(20000).then (reader) ->
    reader.toArray().then (users) ->
      loop_fn = () ->
        i = _.random(200, 500)
        sample = _.sample(users, _.random(2, users.length))
        insert_message = () ->
          source = sample.pop()
          if source.friend and source.friend.length > 0
            target = {_id: _.sample(source.friend, 1)[0]}
          else
            target = sample.pop()
          i--
          if target and i > 0
            message =
              source: source._id
              target: target._id
              text: faker.lorem.sentences()
              time: new Date().toISOString()
  #          console.log message
            db.collection('messages').insertOne message, (err, result) ->
              if err
                console.error err
              else
                $.increment()
                insert_message()
          else
            loop_fn()
        insert_message()
      loop_fn()
