App.module "Models", (Models, App) ->

  class Models.Error extends Backbone.Model

  class Models.Dock extends Backbone.Model
    addNumber: (name, number) ->
      value = @get name
      value += number
      @set name, value
