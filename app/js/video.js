ui.video = {
    create: function() {
        var form = this;
        var view = this;
        this.video.addEventListener('change', function() {
            form.title.value = this.files[0].name.replace(/\.\w+$/, '').replace(/\./g, ' ');
        });
        this.on('submit', function() {
            query({
                route: 'video',
                method: 'PUT',
                form: form,
                success: function(data) {
                    var file = form.video.files[0];
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/video/' + data.id);
                    xhr.responseType = "blob";
                    var MB = 1024 * 1024;
                    xhr.upload.addEventListener('loadstart', function(e) {
                        form.progress.setAttribute('max', e.total);
                        form.progress.setAttribute('value', e.loaded);
                        form.loaded = Math.ceil(e.loaded / MB);
                        form.total = Math.ceil(e.total / MB);
                    });
                    xhr.upload.addEventListener('progress', function(e) {
                        form.progress.setAttribute('value', e.loaded);
                        form.total = Math.ceil(e.total / MB);
                    });
                    xhr.upload.addEventListener('abort', morozov);
                    xhr.upload.addEventListener('error', morozov);
                    xhr.onload = function() {
                        go('video/index');
                    };
                    xhr.send(file);
                    form.progress.visible = true;
                    form.fields.visible = false;
                }
            })
        });

        this.url.addEventListener('change', function() {
            query({
                route: 'video/oembed',
                params: {url: view.url.value},
                success: function(data) {
                    view.paste.innerHTML = data.html;
                }
            });
        });

        view.on('save', function() {
            query({
                method: 'PUT',
                route: 'video/oembed',
                params: {url: view.url.value},
                success: function(data) {
                    if (data.n > 0) {
                        go('video/index');
                    }
                }
            });
        });

        form.visible = true;
    },


    index: function(params) {
        var view = this;

        query({
            route: 'video/index',
            params: params,
            success: function(videos) {
                videos.forEach(function(info) {
                    function open() {
                        go('video/view', {id: info._id, owner_id: params.owner_id || localStorage.user_id})
                    }

                    var video = view.widget('video', info);
                    var tag = video.querySelector('img');
                    if (info.thumbnail_url) {
                        tag.src = info.thumbnail_url;
                    }
                    else if ('done' == info.status) {
                        tag.src = '/video/thumbnail/' + info._id + '.jpg';
                    }
                    else {
                        tag.remove();
                        tag = view.widget('video-in-processing');
                        video.appendChild(tag);
                    }
                    tag.addEventListener('click', open);
                    view.videos.appendChild(video);
                });
                view.visible = true;
            }
        })
    },

    view: function(params) {
        var view = this;
        query({
            route: 'video/view',
            params: params,
            success: function(data) {
                var video = view.querySelector('video');
                if (data.html) {
                    view.innerHTML = data.html;
                }
                else {
                    video.setAttribute('src', '/video/' + params.id + '.mp4');
                }
                append_content('wall', {
                    type: 'video',
                    video_id: params.id,
                    owner_id: params.owner_id
                });
                view.visible = true;
            }
        });
    }
};
