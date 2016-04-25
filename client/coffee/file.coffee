@App.module 'Models', (Model) ->
  class Models.FileList extends Backbone.Collection
    url: () ->
      '/api/file?' + $.param @params
    comparator: reverse_time

@App.module 'Views', (Views) ->
  class Views.Audio extends Marionette.ItemView
    template: '#view-audio'

    ui:
      duration: '.duration'
      source: 'source'

    behaviors:
      Bindings: {}

    bindings:
      '.author': 'author'
      '.name': 'name'

    onRender: () ->
      minutes = Math.floor(@model.get('duration') / 60)
      seconds = @model.get('duration') - (minutes * 60)
      @ui.duration.html minutes + ':' + seconds
      @ui.source.attr 'src', '/api/file?id=' + @model.get('_id')

  class Views.AudioList extends Marionette.CollectionView
    childView: Views.Audio

@App.module 'Controllers', (Controllers) ->
  class Controllers.File extends Marionette.Controller
    

  App.selectAudio (params, region) ->
    fileList = new App.Views.FileList()
    fileList.params = _.merge params, type: 'audio'
    App.thresome region,
      top: new App.Views.Upload()
      middle: new App.Views.AudioList fileList

