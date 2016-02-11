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

    this.on('send', function () {
        var data = {
            source_id: localStorage.user_id,
            owner_id: params.owner_id,
            type: 'wall',
            text: view.editor.value
        };
        query({
            method: 'POST',
            route: 'comment/post',
            body: data,
            success: function (result) {
                if (result.ok) {
                    view.editor.value = '';
                }
            }
        });
    });

    this.visible = true;
};
