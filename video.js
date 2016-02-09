ui.video = {
    create: function() {
        var form = this;
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
        form.visible = true;
    },


    index: function(params) {
        var view = this;
        query({
            route: 'video/index',
            params: params,
            success: function(videos) {
                videos.forEach(function(info) {
                    var video = view.widget('video', info);
                    var tag = video.querySelector('video');
                    if ('done' == info.status) {
                        tag.src = '/video/' + info._id + '.mp4';
                    }
                    else {
                        tag.remove();
                        video.appendChild(view.widget('video-in-processing'));
                    }
                    view.videos.appendChild(video);
                });
                view.visible = true;
            }
        })
    }
};
