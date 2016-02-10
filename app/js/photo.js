ui.photo = {
    create: function(params) {
        var view = this;
        this.on('submit', function() {
            each(view.fileInput.files, function(file) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/photo?target_id=' + localStorage.user_id);
                xhr.responseType = "blob";
                xhr.setRequestHeader('Name', file.name);
                xhr.onload = function() {
                    go('photo/index');
                };
                xhr.send(file);
            });
        });
        this.visible = true;
    },

    index: function() {
        var view = this;
        query({
            route: 'photo/index',
            success: function(result) {
                result.photos.forEach(function(photo) {
                    view.photos.appendChild($new('img', {src: result.path + '/' + photo}));
                });
                view.visible = true;
            }
        });
    }
};
