@App.module 'Models', (Models) ->
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
      audio: 'audio'
      bit_rate: '.bit_rate'

    behaviors:
      Bindings: {}

    bindings:
      '.author': 'author'
      '.name': 'name'

#    events:
#      'play audio': 'play'
#      'ended audio': 'next'

    play: () ->
      @ui.audio[0].play()

    onRender: () ->
      minutes = Math.floor(@model.get('duration') / 60)
      seconds = Math.round(@model.get('duration')) - (minutes * 60)
      seconds = ('00' + seconds).slice(-2)
      @ui.duration.html minutes + ':' + seconds
      @ui.source.attr 'src', '/api/file?id=' + @model.get('_id')
      @ui.bit_rate.html Math.round(@model.get('bit_rate')/1024) + ' kb/s'

  class Views.AudioList extends Marionette.CollectionView
    childView: Views.Audio

    onRender: () ->
      @children.forEach (audio, i) =>
        next = @children.findByIndex(i + 1)
        if next
          audio.ui.audio.on 'ended', () =>
            next.play()

@App.module 'Controllers', (Controllers, App) ->
  class Controllers.File extends Marionette.Controller
    index: () ->
      App.selectAudio {}, App.mainRegion

    routes:
      'audio': 'index'

  App.selectAudio = (params, region) ->
    fileList = new App.Models.FileList()
    if not params
      params = {}
    params.type = 'audio'
    fileList.params = params
    App.thresome region,
      top: new App.Views.Upload()
      middle: new App.Views.AudioList collection: fileList

  App.widgets.audio = App.selectAudio

