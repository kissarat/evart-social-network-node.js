@App.module "Models", (Models, App) ->

  class Models.Base extends Backbone.Model
    idAttribute: '_id'

    urlRoot: ->
      return '/api/' + @constructor.name.toLowerCase()

  class Models.Error extends Backbone.Model

  class Models.User extends Models.Base

  class Models.UserList extends Backbone.Collection
    urlRoot: '/api/user'
#    @findByIds: (ids) ->
#      userList = new Models.UserList()
#      $.getJSON '/api/user?ids=' + ids.join('.'), (data) ->
#        userList.add

  class Models.Verify extends Backbone.Model
    urlRoot: '/api/user/verify'

  class Models.Login extends Backbone.Model
    urlRoot: '/api/user/login'

  class Models.Message extends Models.Base

  class Models.MessageList extends Backbone.Collection
    url: () ->
      '/api/message?' + $.param @params

