@App.module "Models", (Models) ->
  class Models.Error extends Backbone.Model

  class Models.User extends Backbone.Model

  class Models.UserList extends Backbone.Collection
    urlRoot: '/api/user'

  class Models.Login extends Backbone.Model
