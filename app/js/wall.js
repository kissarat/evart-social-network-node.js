'use strict';

var wall = {
    add: function (comment) {
        User.findOne(comment.source_id, function (user) {
            comment.user = user;
            var notify = true;
            if (hook.wall) {
                notify = true !== hook.wall(comment);
            }
            if (notify && 'granted' == Notify.permission) {
                new Notify(comment);
            }
        });
    }
};

if (window.Notification) {
    Notification.requestPermission(function (permission) {
        Notify.permission = permission;
        if ('granted' != permission) {
            console.warn('Notification: ' + permission);
        }
    });
}
else {
    console.warn('Notification not supported');
}

function attachment(media) {
    var thumbnail;
    switch (media.type) {
        case 'photo':
            thumbnail = $thumbnail;
            break;
        case 'video':
            thumbnail = $video_thumbnail;
            break;
        case 'file':
            thumbnail = $file_thumbnail;
            break;
        default:
            return;
    }
    return thumbnail(media);
}

server.on('wall', wall.add);
server.on('message', wall.add);

ui.wall = function (params) {
    var view = this;

    hook.wall = function (comment) {
        comment = Comment.resolve(comment);
        if (params.owner_id == comment.owner_id) {
            var user = comment.user;
            var post = view.widget('comment', {
                _id: comment._id,
                author: user.surname + ' ' + user.forename,
                text: comment.text
            });
            var avatar = post.querySelector('.avatar-xs');
            avatar.addEventListener('click', function () {
                go('user/view', {id: comment.source_id});
            });
            if (user.avatar) {
                avatar.background = user.avatar;
            }
            //if (comment.geo) {
            //    post.dataset.geo = comment.geo.p.join('x');
            //}

            var like = post.querySelector('[data-name="like"]');
            like.addEventListener('click', comment.handler('like'));
            like.innerHTML = comment.likes.length || '';
            comment.on('like', function () {
                like.innerHTML = comment.likes.length || '';
            });

            if (comment.medias) {
                var mediasDiv = post.querySelector('.medias');
                comment.medias.forEach(function (media) {
                    mediasDiv.appendChild(attachment(media));
                });
            }

            ui.fire('after render', post);
            view.comments.prependChild(post);
            return true;
        }
    };

    function history(comments) {
        if (comments.length > 0) {
            User.find(Message.getUserIds(comments), function (users) {
                comments.reverse();
                comments.forEach(function (comment) {
                    comment.user = users[comment.source_id];
                    hook.wall(comment);
                });
            });
        }
    }

    api('comment', 'GET', params, history);

    view.on('send', function () {
        var data = {
            source_id: localStorage.user_id,
            owner_id: params.owner_id,
            type: params.type,
            text: view.editor.value
        };

        if ('message' == params.type) {
            if (params.chat_id) {
                data.chat_id = params.chat_id;
            }
            else {
                data.target_id = params.target_id;
            }
        }

        var medias = [];
        var mediasDiv = view.querySelectorAll('[data-id="attachements"] > div');
        each(mediasDiv, function (attachement) {
            medias.push(JSON.parse(attachement.dataset.media))
        });
        if (medias.length > 0) {
            data.medias = medias;
        }

        if ('video' == params.type && params.video_id) {
            data.video_id = params.video_id;
        }

        api('comment', 'PUT', data, function (result) {
            if (result.ok) {
                frame.close();
                view.attachements.innerHTML = '';
                view.editor.value = '';
            }
        });
    });

    frame.single('select', function (event) {
        view.attachements.appendChild(attachment(event.media));
    });

    function add_emoji() {
        var t = view.editor;
        var string = t.value;
        t.value = string.slice(0, t.selectionStart) + this.innerHTML + string.slice(t.selectionEnd);
    }

    each(view.emoji.querySelectorAll('span'), function (span) {
        span.addEventListener('click', add_emoji);
    });

    view.emoji.appendChild($new('span', ' more', function () {
        view.emoji.innerHTML = '';
        view.emoji.classList.add('more');
        emoji_text.forEach(function (emo) {
            $add(view.emoji,
                $new('span', emo, add_emoji),
                document.createTextNode(' ')
            );
        });
    }));

    function add_attachment_type(path) {
        view.on(path, function () {
            view.querySelector('.frame').appendChild(frame.tag);
            frame.source = path;
        });
    }

    add_attachment_type('/video/index');
    add_attachment_type('/photo/index');
    add_attachment_type('/file/index');

    if ('message' == params.type) {
        if (view.video) {
            view.on('call', function () {
                if (camera) {
                    Peer.create(params);
                }
                else {
                    getUserMedia({audio: true, video: true}, function (stream) {
                        camera = stream;
                        view.local.muted = true;
                        view.local.srcObject = stream;
                        Peer.create(params);
                    }, _error);
                }
            });

            view.on('microphone', function () {
                if (camera) {
                    var audio = camera.getAudioTracks()[0];
                    audio.enabled = !audio.enabled;
                    if (audio.enabled) {
                        e.target.classList.remove('fa-microphone');
                        e.target.classList.add('fa-microphone-slash');
                    }
                    else {
                        e.target.classList.add('fa-microphone-slash');
                        e.target.classList.remove('fa-microphone');
                    }
                }
            });

            view.on('camera', function () {
                if (camera) {
                    var video = camera.getVideoTracks()[0];
                    video.enabled = !video.enabled;
                    e.target.style.color = video.enabled ? 'white' : 'green';
                }
            });

            view.on('fullscreen', function () {
                if (isFullscreen()) {
                    document.cancelFullScreen();
                }
                else {
                    view.video.requestFullscreen();
                }
            });

            view.volume.value = view.remote.volume * 10;
            view.volume.addEventListener('change', function (e) {
                view.remote.volume = e.target.value / 10;
            });

            view.on('mute', function (e) {
                view.remote.muted = !view.remote.muted;
                localStorage.muted = view.remote.muted ? 1 : 0;
                if (view.remote.muted) {
                    e.target.classList.remove('fa-volume-up');
                    e.target.classList.add('fa-volume-off');
                }
                else {
                    e.target.classList.add('fa-volume-up');
                    e.target.classList.remove('fa-volume-off');
                }
            });

            if ('1' == localStorage.muted) {
                view.mute.click();
            }

            view.video.visible = true;
        }

        if (params.chat_id) {
            document.title = params.chat_id;
        }
        else {
            var ids = [localStorage.user_id, params.target_id];
            User.find(ids, function (users) {
                var names = ids.map(function (id) {
                    return users[id].name;
                });
                view.title = names.join(' <span class="fa fa-circle-o-notch"></span> ');
            });
        }
    }

    this.visible = true;
};
