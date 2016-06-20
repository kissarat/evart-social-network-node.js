App.module('File', function (File, App) {
    File.Route = Marionette.AppRouter.extend({
        // initialize: function (options) {
        //     this.route(/easter-dir(.*)$/, options.controller.dir);
        // }
    });

    File.Model = Backbone.Model.extend({
        getFileURL: function () {
            return (this.get('md5') ? '/md5/' + this.get('md5') : '/id/' + this.get('_id')) + '.' + this.get('ext');
        }
    });
});
