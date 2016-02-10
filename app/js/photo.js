function preview() {
    var div = $id('preview');
    var source = /"([^"]+)"/.exec(this.style.backgroundImage);
    if (source) {
        div.querySelector('img').src = source[1];
        //location.hash = this.id;
    }
    div.thumbnail = this;
    div.visible = true;
}

(function () {
    var div = $id('preview');
    div.onclick = function () {
        if (div.thumbnail && div.thumbnail.nextElementSibling) {
            div.thumbnail.nextElementSibling.click();
        }
        else {
            //location.hash = '';
            div.visible = false;
        }
    };

    addEventListener('keydown', function (e) {
        if (27 == e.keyCode) {
            div.visible = false;
        }
    });
    //if (location.hash) {
    //    var thumbnail = $id(location.hash.slice(1));
    //    if (thumbnail) {
    //        thumbnail.click();
    //    }
    //}
})();

ui.photo = {
    create: function (params) {
        var view = this;
        this.on('submit', function () {
            var files = array(view.fileInput.files);
            files.reverse();
            function upload() {
                var file = files.pop();
                if (!file) {
                    return go('photo/index');
                }
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/photo?target_id=' + localStorage.user_id);
                xhr.responseType = "blob";
                xhr.setRequestHeader('Name', file.name);
                xhr.onload = function () {
                    view.uploaded.appendChild($content(file.name));
                    upload();
                };
                xhr.send(file);
            }

            upload();
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
