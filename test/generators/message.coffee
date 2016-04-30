faker = require 'faker'
_ = require 'underscore'

module.exports = (db, $) ->
  db.collection('users').find {}, {_id: 1}, (err, reader) ->
    reader.toArray().then (users) ->
      loop_fn = () ->
        sample = _.sample(users, _.random(2, users.length))
        insert_message = () ->
          source = sample.pop()
          target = sample.pop()
          if target
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
