@App.module "Models", (Models, App) ->

  class Models.Base extends Backbone.Model
    idAttribute: '_id'

    urlRoot: -> '/api/' + @constructor.name.toLowerCase()
    
    toString: -> @get('_id')

  class Models.Error extends Backbone.Model

  class Models.User extends Models.Base
    urlRoot: '/api/user'

    @getName: (model) ->
      name = []
      if model.get('name')
        name.push model.get('name')
      else
        if model.get('forename')
          name.push model.get('forename')
        if model.get('surname')
          name.push model.get('surname')
      if name.length > 0
        name = name.join(' ')
      else
        name = model.get('domain')

  class Models.UserList extends Backbone.Collection
    model: (attrs, options) ->
      new App.Models.User attrs, options

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