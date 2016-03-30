@App.module 'Views', (Views) ->
  class App.Behaviors.Bindings extends Marionette.Behavior
    onRender: ->
      document.title = _.result(@view, 'title') || @view.constructor.name
      @view.$el.one (e) ->
        e.preventDefault()
        App.navigate this.getAttribute 'href'
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

    attributes:
      method: 'post'

    report: (name, message) ->
      if @el[name]
        @el[name].reportValidity message
      else
        console.error name + ' field not found'

    events:
      'click button': (e) ->
        e.preventDefault()
        @model.save null,
          error: (_1, ajax) =>
            invalid = ajax.responseJSON.invalid
            if code.BAD_REQUEST == ajax.status && invalid
              for name, error of invalid
                @report name, error.message
            else if @error
              @error ajax
          success: (model, data) =>
            if @success
              @success data, model

    behaviors:
      Bindings: {}

    bindings: ->
      b = {}
      @$el.find('[name]').each (i, input) ->
        name = input.getAttribute('name')
        b["[name=#{name}]"] = name
      return b

  class Views.Login extends Views.Form
    template: '#view-login'

  class Views.Signup extends Views.Form
    template: '#view-signup'

    success: (data, model) ->
      App.navigate 'verify/' + model.id

  class Views.Verify extends Views.Form
    template: '#view-code'

    success: (data) ->
      if data.verified
        App.navigate 'user/' + @model.id
      else
        @report 'code', 'Invalid code'


  @show = (name, options) ->
    if options?
      options =
        model: if _instanceof(options, Backbone.Model) then options else new App.Models[name](options)
    view = new Views[name] options
    App.mainRegion.show view
