'use strict';

ui.chat = {
    edit: function(params) {
        var view = this;
        var members = {};
        members[localStorage.user_id] = me;

        function add(user) {
            var member = $new('div');
            var close = $new('span', {class:'button fa fa-close'}, function() {
                delete members[user._id];
                member.remove();
            });
            view.members.appendChild($add(member,
                $new('span', user.surname),
                close
            ));
        }

        view.on('save', function() {
            query({
                method: params.id ? 'POST' : 'PUT',
                route: 'chat',
                params: params,
                body: {
                    title: view.title.value,
                    members: Object.keys(members)
                },
                success: function(result) {
                    if (result.ok) {
                        go('wall', {chat_id: result.id, type: 'message'});
                    }
                }
            });
        });
        this.frame.appendChild(frame.tag);
        frame.source = '/user/index';
        frame.single('select', function(data) {
            if (!(data.id in members)) {
                User.findOne(data.id, function(user) {
                    members[data.id] = user;
                    add(user);
                });
            }
        });
        each(members, add);
        this.visible = true;
    },

    index: function(params) {
        var view = this;
        api('chat', 'GET', params, function(data) {
            var ids = [];
            data.forEach(function(chat) {
                ids = ids.concat(chat.members);
            });
            User.find(ids, function(users) {
                data.forEach(function(chat) {
                    var members = [];
                    chat.members.forEach(function(id) {
                        members.push(users[id].surname);
                    });
                    var row = $row(chat.title, members.join(', '));
                    row.classList.add('button');
                    row.addEventListener('click', function() {
                        go('wall', {chat_id: chat._id, type: 'message'});
                    });
                    view.rows.appendChild(row);
                });
            });
            view.visible = true;
        });
    }
};
