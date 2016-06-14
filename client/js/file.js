App.module('File', function (File, App) {
    File.Route = Marionette.AppRouter.extend({
        initialize: function (options) {
            this.route(/easter-dir(.*)$/, options.controller.dir);
        }
    });

    File.Model = Backbone.Model.extend({
        getFileURL: function () {
            return (this.get('md5') ? '/md5/' + this.get('md5') : '/id/' + this.get('_id')) + '.' + this.get('ext');
            // return '/id/' + this.get('_id') + '.' + this.get('ext');
        }
    });

    return new File.Route({controller: {
        dir: function (path) {
            $.getJSON('/api/dir' + path, function (files) {
                var empty = new App.Views.Empty();
                empty.$el.addClass('scroll');
                empty.$el.css('text-align', 'left');
                empty.$el.css('cursor', 'pointer');
                App.getPlace('main').show(empty);
                files.forEach(function (file) {
                    var div = document.createElement('div');
                    var isDir = false;
                    if (!/\.\w+$/.test(file)) {
                        file += '/';
                        isDir = true;
                    }
                    if (/\.(jpg|png|gif)$/.test(file)) {
                        var img = document.createElement('img');
                        img.src = '/easter-file' + path + file;
                        div.style.display = 'inline-block';
                        div.style.setProperty('max-width', '100px');
                        div.appendChild(img);
                    }
                    else {
                        div.innerHTML = file;
                    }
                    div.addEventListener('click', function () {
                        if (isDir) {
                            App.navigate('/easter-dir' + path + file);
                        }
                        else {
                            open('/easter-file' + path + file);
                        }
                    });
                    empty.el.appendChild(div);
                });
            })
        }
    }})
});
