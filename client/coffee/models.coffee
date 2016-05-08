@App.module "Models", (Models, App) ->

  class Models.Base extends Backbone.Model
    idAttribute: '_id'

    urlRoot: -> '/api/' + @constructor.name.toLowerCase()
    
    toString: -> @get('_id')

  class Models.Error extends Backbone.Model

  class Models.User extends Models.Base
    urlRoot: '/api/user'

    isFriend: (other) ->
      (other || App.user).friend.indexOf(@model.get('_id')) >= 0

  class Models.UserList extends Backbone.Collection
    model: (attrs, options) ->
      new App.Models.User attrs, options

  class Models.Verify extends Backbone.Model
    urlRoot: '/api/user/verify'

  class Models.Login extends Backbone.Model
    urlRoot: '/api/user/login'

  class Models.Message extends Models.Base
    isPost: ->
      not not @get 'owner'

    getChildren: ->
      new App.Models.MessageList @get 'children'

  class Models.MessageList extends Backbone.Collection
    url: () ->
      '/api/message?' + $.param @params

    fetchNextPage: () ->
      @params.skip = (@params.skip || 0) + 10
      @fetch remove: false

#    fetch: (params) ->
#      messageList = new Models.MessageList()
#      messageList.params = params
#      messageList.fetch()

    model: (attrs, options) ->
      new App.Models.Message attrs, options

    comparator: sort_time

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

  class Models.UserList extends Backbone.Collection
    url: () ->
      '/api/user?' + $.param @params.attributes

  class Models.Dock extends Backbone.Model
    addNumber: (name, number) ->
      value = @get name
      value += number
      @set name, value
      
#  class Models.UserSearch extends Backbone.Model