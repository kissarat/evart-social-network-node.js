@App.module "Models", (Models, App) ->

  class Models.Base extends Backbone.Model
    idAttribute: '_id'

    urlRoot: ->
      return '/api/' + @constructor.name.toLowerCase()

    toString: ->
      return this.get('_id')

  class Models.Error extends Backbone.Model

  class Models.User extends Models.Base
    urlRoot: '/api/user'

  class Models.UserList extends Backbone.Collection

  class Models.Verify extends Backbone.Model
    urlRoot: '/api/user/verify'

  class Models.Login extends Backbone.Model
    urlRoot: '/api/user/login'

  class Models.Message extends Models.Base

  class Models.MessageList extends Backbone.Collection
    url: () ->
      '/api/message?' + $.param @params

  window.reverse_time = (a, b) ->
    if a.get('time') < b.get('time')
      1
    else if a.get('time') > b.get('time')
      -1
    else
      0

  class Models.Photo extends Models.Base

  class Models.PhotoList extends Backbone.Collection
    url: () ->
      '/api/photo?' + $.param @params
    comparator: reverse_time

  class Models.Video extends Models.Base

  class Models.VideoList extends Backbone.Collection
    url: () ->
      '/api/video?' + $.param @params
    comparator: reverse_time
