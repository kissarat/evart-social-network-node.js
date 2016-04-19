@App.module 'Layouts', (Layouts) ->
  class Layouts.Dialog extends Marionette.LayoutView
    template: '#view-dialog-layout'

    regions:
      dialog: '.dialog'
      editor: '.editor'

  class Layouts.Thresome extends Marionette.LayoutView
    template: '#view-thresome-layout'

    regions:
      top: '.top'
      middle: '.middle'
      bottom: '.bottom'
