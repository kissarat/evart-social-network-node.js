//Notification.requestPermission(function(permission) {
//    if ('granted' == permission) {
//        var n = new Notification('Notification enabled');
//    }
//    else {
//
//    }
//});


ui.chat = function (params) {
    document.title = 'Chat';
    var view = this;

    function add(message) {
        User.findOne(message.source_id, function (user) {
            view.messages.appendChild(view.widget('message', {
                author: user.surname + ' ' + user.forename,
                text: message.text
            }));
            view.messages.scrollTop = view.messages.scrollHeight;
        });
    }

    query({
        route: 'message/history', params: params, success: function (data) {
            view.visible = true;
            peer.target_id = params.target_id;
            peer.init();
            peer.connection.addEventListener('addstream', function (e) {
                view.video.visible = true;
                view.video.srcObject = e.stream;
                view.video.srcObject.trace();
            });

            view.on('call', function () {
                peer.shareVideo();
                peer.offer();
            });

            view.on('bigger', function () {
                view.video.classList.add('bigger');
            });

            peer.capture(function (mediaStream) {
                view.localVideo.srcObject = mediaStream;
            });

            view.localVideo.onclick = function(e) {
                console.log(e);
              this.webkitRequestFullscreen();
            };

            if (data && data.messages) {
                User.find(Message.getUserIds(data.messages), function () {
                    data.messages.forEach(function (message) {
                        message.user = data.users[message.source_id];
                        add(message);
                    });
                });
            }
        }
    });

    server.on('message', add);

    this.on('send', function () {
        var data = {
            source_id: localStorage.user_id,
            target_id: params.target_id,
            text: view.editor.value
        };
        query({
            method: 'POST',
            route: 'message/post',
            body: data,
            success: function (result) {
                if (result.ok) {
                    add(data);
                }
            }
        });
    });
};
