@App.module 'Views', (Views) ->
  class App.Behaviors.Bindings extends Marionette.Behavior
    onRender: ->
      document.title = _.result(@view, 'title') || @view.constructor.name
      @view.el.setAttribute 'class', @view.template.replace '#view-', 'view '
      @view.stickit()

  class Views.Error extends Marionette.ItemView
    template: '#view-error'

    behaviors:
      Bindings: {}

    ui:
      status: 'h1'
      text: 'p'

    bindings:
      'h1': 'status'
      '.text': 'text'

  class Views.Form extends Marionette.LayoutView
    tagName: 'form'

    behaviors:
      Bindings: {}

    bindings: ->
      b = {}
      @$el('[name]').each (i, input) ->
        name = input.getAttribute('name')
        b["[name=#{name}]"] = name
      return b

  #noinspection JSUnresolvedVariable
  class Views.Login extends Views.Form
    template: '#view-login'

  @show = (name, options) ->
    if options?
      options =
        model: if _instanceof(options, Backbone.Model) then options else new App.Models[name](options)
    view = new Views[name] options
    App.mainRegion.show view
