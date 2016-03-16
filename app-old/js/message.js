"use strict";

ui.message = {
    index: function() {
        var view = this;
        api('comment', 'GET', {show: 'dialog', type: 'message'}, function(messages) {
            User.find(Message.getUserIds(messages), function(users) {
                messages.forEach(function (message) {
                    var source = users[message.source_id];
                    var target = users[message.target_id];
                    var target_id = localStorage.user_id == message.source_id ? message.target_id : message.source_id;
                    var row = $row(source.forename, target.forename, message.text);
                    row.classList.add('button');
                    row.addEventListener('click', function() {
                        go('wall', {type: 'message', target_id: target_id});
                    });
                    view.rows.appendChild(row);
                });
                view.visible = true;
            });
        });
    }
};
