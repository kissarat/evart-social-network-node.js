ui.video = {
    create: function() {
        var form = this;
        this.on('submit', function() {
            query({
                route: 'video/create',
                form: form,
                success: function(data) {
                    var file = form.video.files[0];
                    var xhr = new XMLHttpRequest();
                    xhr.open('POST', 'upload/' + data.id);
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
                    xhr.send(file);
                    form.progress.visible = true;
                    form.fields.visible = false;
                }
            })
        });
    },


    index: function(params) {
    }
};
