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
      if !message
        message = name
        name = null
      if @el[name] || !name
        field = if name then @el[name].parentNode else @el
        $('<div></div>')
        .attr('class', 'error')
        .html(message)
        .appendTo(field)
      else
        console.error name + ' field not found'

    events:
      'click button': (e) ->
        e.preventDefault()
        @$el.find('.error').remove()
        @model.save null,
          error: (_1, ajax) =>
            if code.BAD_REQUEST == ajax.status && ajax.responseJSON.invalid
              for name, error of jax.responseJSON.invalid
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
    error: (ajax) ->
      if code.FORBIDDEN == ajax.status
        @report 'Phone or password not found'


  class Views.Signup extends Views.Form
    template: '#view-signup'

    success: (data, model) ->
      App.navigate 'verify/' + model.id

  class Views.Verify extends Views.Form
    template: '#view-code'

    success: (data) ->
      if data.verified
        App.navigate 'login'
      else
        @report 'code', 'Invalid code'


  @show = (name, options) ->
    if options?
      options =
        model: if _instanceof(options, Backbone.Model) then options else new App.Models[name](options)
    view = new Views[name] options
    App.mainRegion.show view
