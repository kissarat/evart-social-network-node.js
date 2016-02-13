function preview() {
    var div = $id('preview');
    var source = /"([^"]+)"/.exec(this.style.backgroundImage);
    if (source) {
        div.querySelector('img').src = source[1];
    }
    div.thumbnail = this;
    div.classList.add('active');
}

(function () {
    var div = $id('preview');
    div.onclick = function () {
        if (div.thumbnail && div.thumbnail.nextElementSibling) {
            div.thumbnail.nextElementSibling.click();
        }
        else {
            div.classList.remove('active');
        }
    };
})();

ui.photo = {
    create: function (params) {
        var view = this;
        this.on('submit', function () {
            upload_photo(array(view.fileInput.files), function(file, files) {
                view.uploaded.appendChild($content(file.name));
                if (files.length == 0) {
                    go('photo/index');
                }
            });
        });
        this.visible = true;
    },

    index: function () {
        var view = this;
        query({
            route: 'photo/index',
            success: function (result) {
                result.photos.forEach(function (photo) {
                    var thumbnail = $new('div', {
                        class: 'thumbnail',
                        style: 'background-image: url("' + result.path + '/' + photo + '")',
                        id: photo
                    });
                    thumbnail.onclick = preview;
                    view.photos.appendChild(thumbnail);
                });
                view.visible = true;
            }
        });
    }
};
