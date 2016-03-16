"use strict";

var uploads = {};

function $file_icon(mime) {
    var fa = 'o';
    mime = mime.replace(/;.*$/, '');
    mime = mime.split('/');
    switch (mime[0]) {
        case 'text':
            fa = /ml/.test(mime[1]) ? 'code-o' : 'text-o';
            break;
        case 'image':
            fa = 'image-o';
            break;
        case 'video':
            fa = 'video-o';
            break;
        case 'audio':
            fa = 'audio-o';
            break;
        case 'application':
            fa = 'file';
            if (mime[1].indexOf('word') >= 0 || mime[1].indexOf('document.text') >= 0) {
                fa = 'word-o';
            }
            if (mime[1].indexOf('excel') >= 0 || mime[1].indexOf('document.spreadsheet') >= 0) {
                fa = 'excel-o';
            }
            if (mime[1].indexOf('powerpoint') >= 0 || mime[1].indexOf('document.presentation') >= 0) {
                fa = 'powerpoint-o';
            }
            if (mime[1].indexOf('zip') >= 0 || mime[1].indexOf('compressed') >= 0) {
                fa = 'archive-o';
            }
            if ('pdf' == mime[1]) {
                fa = 'pdf-o';
            }
            break;
    }
    return $new('div', {class: 'fa fa-file-' + fa});
}

function $file_thumbnail(file) {
    var thumbnail = $new('div', {
            class: 'file button',
            'data-media': JSON.stringify(file)
        },
        function () {
            download(file);
        });
    return $add(thumbnail,
        $file_icon(file.mime),
        $content(file.name)
    );
}

ui.file = {
    create: function () {
        var view = this;
        view.on('upload', function () {
            view.error.innerHTML = '';
            var file = view.file.files[0];
            if (!file) {
                view.error.innerHTML = 'Select a file';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                view.error.innerHTML = 'Max file size is 5MB';
                return;
            }
            var xhr = new XMLHttpRequest();
            xhr.open('PUT', '/api/file');
            xhr.setRequestHeader('Filename', file.name);
            var upload = {
                name: file.name,
                size: file.size,
                chunks: {}
            };
            console.log(file);
            view.progress.setAttribute('max', file.size);
            var last = 0;
            view.progress.visible = true;
            xhr.upload.addEventListener('progress', function (e) {
                upload.chunks[Date.now()] = e.loaded - last;
                last = e.loaded;
                view.progress.setAttribute('value', e.loaded);
            });
            xhr.upload.addEventListener('load', function () {
                uploads[Date.now()] = upload;
                go('file/index');
            });
            xhr.upload.addEventListener('error', function (error) {
                upload.error = error;
                uploads[Date.now()] = upload;
            });
            xhr.send(file);
        });
        view.visible = true;
    },

    index: function () {
        var view = this;
        api('file', 'GET', {}, function (data) {
            data.forEach(function (file) {
                var row = $row(
                    $file_icon(file.mime),
                    $new('div', file.name, function () {
                        var message = {
                            type: 'select',
                            media: {
                                type: 'file',
                                id: file._id,
                                md5: file.md5,
                                mime: file.mime,
                                name: file.name
                            }
                        };
                        if (!sendParentWindow(message)) {
                            download(file);
                        }
                    }),
                    measure(file.size),
                    new Date(file.time).toLocaleString(),
                    $new('div', {class: 'fa fa-close'}, function () {
                        api('file', 'DELETE', {id: file._id}, reload);
                    })
                );
                row.classList.add('button');
                view.rows.appendChild(row);
            })
        });
        view.visible = true;
    }
};
