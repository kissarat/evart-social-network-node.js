@App.module "Models", (Models) ->

  class Models.Base extends Backbone.Model
    idAttribute: '_id'

    urlRoot: ->
      return '/api/' + @constructor.name.toLowerCase()

  class Models.Error extends Backbone.Model

  class Models.User extends Models.Base

  class Models.Verify extends Backbone.Model
    urlRoot: '/api/user/verify'

  class Models.UserList extends Backbone.Collection
    urlRoot: '/api/user'

  class Models.Login extends Backbone.Model
