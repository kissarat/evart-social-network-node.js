@App.module 'Layouts', (Layouts) ->
  class Layouts.Dialog extends Marionette.LayoutView
    template: '#view-dialog-layout'

    regions:
      dialog: '.dialog'
      editor: '.editor'
