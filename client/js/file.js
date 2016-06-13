App.module('File', function (File, App) {
    File.Model = Backbone.Model.extend({
        getFileURL: function () {
            return (this.get('md5') ? '/md5/' + this.get('md5') : '/id/' + this.get('_id')) + '.' + this.get('ext');
            // return '/id/' + this.get('_id') + '.' + this.get('ext');
        }
    });
});
