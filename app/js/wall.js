'use strict';

var wall = {
    add: function(comment) {
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

Notification.requestPermission(function(permission) {
    Notify.permission = permission;
    if ('granted' != permission) {
        console.warn('Notification: ' + permission);
    }
});

server.on('wall', wall.add);

ui.wall = function(params) {
    var view = this;

    hook.wall = function(comment) {
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
            if (!comment.likes) {
                comment.likes = [];
            }
            like.innerHTML = comment.likes.length || '';
            like.addEventListener('click', function() {
                var i = comment.likes.indexOf(localStorage.user_id);
                if (i < 0) {
                    query({
                        route: 'common/add_like',
                        params: {
                            entity: 'comment',
                            target_id: comment._id
                        },
                        success: function (data) {
                            if (data.nModified > 0) {
                                comment.likes.push(localStorage.user_id);
                                like.innerHTML = comment.likes.length;
                            }
                        }
                    });
                }
                else {
                    query({
                        route: 'common/remove_like',
                        params: {
                            entity: 'comment',
                            target_id: comment._id
                        },
                        success: function (data) {
                            if (data.nModified > 0) {
                                comment.likes.splice(comment.likes.indexOf(i), 1);
                                like.innerHTML = comment.likes.length || '';
                            }
                        }
                    });
                }
            });

            if (comment.medias) {
                var mediasDiv = post.querySelector('.medias');
                comment.medias.forEach(function(media) {
                    mediasDiv.appendChild($thumbnail(media.id));
                });
            }

            ui.fire('after render', post);
            view.comments.prependChild(post);
            return true;
        }
    };

    query({
        route: 'comment/history', params: params, success: function (comments) {
            if (comments.length > 0) {
                User.find(Message.getUserIds(comments), function (users) {
                    comments.forEach(function (comment) {
                        comment.user = users[comment.source_id];
                        hook.wall(comment);
                    });
                });
            }
        }
    });

    view.on('send', function () {
        var data = {
            source_id: localStorage.user_id,
            owner_id: params.owner_id,
            type: params.type,
            text: view.editor.value
        };

        var medias = [];
        var mediasDiv = view.querySelectorAll('[data-id="attachements"] > div');
        each(mediasDiv, function(attachement) {
            medias.push({
                type: 'photo',
                id: attachement.id
            })
        });
        if (medias.length > 0) {
            data.medias = medias;
        }

        if ('video' == params.type && params.video_id) {
            data.video_id = params.video_id;
        }

        query({
            method: 'POST',
            route: 'comment/post',
            body: data,
            success: function (result) {
                if (result.ok) {
                    view.frame.visible = false;
                    view.attachements.innerHTML = '';
                    view.editor.value = '';
                }
            }
        });
    });

    var iframe = view.frame.querySelector('iframe');

    view.on('close', function() {
        view.frame.visible = false;
    });

    iframe.addEventListener('load', function() {
        view.frame.querySelector('.loading').visible = false;
        iframe.contentWindow.hook.select = function(attachement) {
            view.attachements.appendChild($thumbnail(attachement.id));
        };
        iframe.visible = true;
    });

    function add_attachment_type(path) {
        view.on(path, function() {
            iframe.visible = false;
            view.frame.querySelector('.loading').visible = true;
            iframe.setAttribute('src', path);
            view.frame.visible = true;
        });
    }

    add_attachment_type('/video/index');
    add_attachment_type('/photo/index');

    this.visible = true;
};
