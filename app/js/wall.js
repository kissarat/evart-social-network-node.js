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

Notification.requestPermission(function (permission) {
    Notify.permission = permission;
    if ('granted' != permission) {
        console.warn('Notification: ' + permission);
    }
});

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
                    var thumbnail = 'photo' == media.type ? $thumbnail : $video_thumbnail;
                    mediasDiv.appendChild(thumbnail(media));
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
        var thumbnail = 'photo' == event.media.type ? $thumbnail : $video_thumbnail;
        view.attachements.appendChild(thumbnail(event.media));
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
            view.emoji.appendChild($new('span', emo, add_emoji));
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

    this.visible = true;
};
