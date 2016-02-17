function preview() {
    var id = this.id;
    if (hook.select) {
        return hook.select({
            id: id,
            type: 'photo'
        });
    }
    var div = $id('preview');
    var source = /"([^"]+)"/.exec(this.style.backgroundImage);
    hook.delete = function () {
        query({
            method: 'DELETE',
            route: 'photo',
            params: {id: id},
            success: div.next
        });
    };
    if (source) {
        div.querySelector('img').src = source[1];
    }
    div.thumbnail = this;
    div.classList.add('active');
}

function $thumbnail(id) {
    var thumbnail = $new('div', {
        id: id,
        class: 'thumbnail',
        style: 'background-image: url("/photo/' + id + '.jpg")'
    });
    thumbnail.onclick = preview;
    return thumbnail;
}

var Album = {
    getUser: function (owner_id, call) {
        query({
            route: 'album',
            params: {owner_id: owner_id},
            success: call
        });
    }
};

(function () {
    var div = $id('preview');
    div.next = function () {
        if (div.thumbnail && div.thumbnail.nextElementSibling) {
            div.thumbnail.nextElementSibling.click();
        }
        else {
            div.classList.remove('active');
            reload();
        }
    };
    div.addEventListener('click', div.next);
})();

ui.photo = {
    create: function (params) {
        var view = this;
        this.on('submit', function () {
            upload_photo(params.album_id, view.fileInput.files, function (file) {
                if (file) {
                    this.addEventListener('load', function () {
                        view.uploaded.appendChild($thumbnail(this.responseJSON.id));
                    });
                }
                else {
                    go('photo/index', params.album_id ? params : {owner_id: localStorage.user_id});
                }
            });
        });
        this.visible = true;
    },

    index: function (params) {
        var view = this;
        query({
            route: 'photo',
            params: params,
            success: function (result) {
                result.forEach(function (photo) {
                    view.photos.appendChild($thumbnail(photo._id));
                });
                Album.getUser(localStorage.user_id, function (albums) {
                    var album = albums[params.album_id];
                    if (album) {
                        view.querySelector('h1').innerHTML = album.title;
                    }
                    view.visible = true;
                });
            }
        });
    },

    album: {
        create: function (params) {
            var view = this;
            view.on('create', function () {
                query({
                    route: 'album',
                    method: 'PUT',
                    form: view,
                    success: function (data) {
                        if (data.n > 0) {
                            if (!params.owner_id) {
                                params.owner_id = localStorage.user_id;
                            }
                            go('photo/album/index', params);
                        }
                    }
                });
            });
            view.visible = true;
        },

        index: function (params) {
            var view = this;
            var owner_id = params.owner_id || localStorage.user_id;
            view.all_photos.params.owner_id = owner_id;
            Album.getUser(owner_id, function (albums) {
                albums.forEach(function (album) {
                    view.list.appendChild(
                        $add($new('div'),
                            $new('div', {class: 'button'}, album.title, function () {
                                go('photo/index', {album_id: album._id});
                            }),
                            $fa('times', null, function () {
                                query({
                                    route: 'album',
                                    method: 'DELETE',
                                    params: {id: album._id},
                                    success: reload
                                });
                            })
                        ));
                });
                view.visible = true;
            });
        }
    }
};
