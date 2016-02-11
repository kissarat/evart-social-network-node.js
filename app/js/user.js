'use strict';

ui.user = {
    login: function () {
        document.title = 'Login';
        this.on('submit', function () {
            query({
                method: 'POST',
                route: 'user/login',
                form: this,
                success: function (data) {
                    if (data.auth) {
                        document.cookie = 'auth=' + data.auth + '; path=/; expires='
                            + (new Date(Date.now() + 6 * 24 * 3600 * 1000).toUTCString());
                        localStorage.user_id = data._id;
                        server.fire('login');
                    }
                    go('user/index');
                }
            });
        });
        this.visible = true;
    },

    logout: function () {
        localStorage.removeItem('auth');
        localStorage.removeItem('user_id');
        location.href = '/user/login';
    },

    signup: function () {
        document.title = 'Singup';
        this.on('submit', function () {
            query({
                method: 'POST',
                route: 'user/signup',
                form: this,
                success: function () {
                    go('user/login')
                }
            });
        });
        this.on('fake', function () {
            fake();
        });
        this.visible = true;
    },

    index: function () {
        document.title = 'Users';
        var self = this;
        query({
            route: 'entity/user',
            success: function (users) {
                users.forEach(function (user) {
                    var w = self.widget('user', user);
                    w.appendChild($button('View', function () {
                        go('user/view', {id: this.parentNode.id});
                    }));
                    w.appendChild($button('Chat', function () {
                        go('chat', {target_id: this.parentNode.id});
                    }));
                    self.users.appendChild(w);
                });
                self.visible = true;
            }
        });
    },

    view: function (params) {
        var view = this;
        if (!params.id) {
            params.id = localStorage.user_id;
        }

        view.avatar.addEventListener('change', function() {
            view.thumbnail.background = view.avatar.value;
        });
        bind_form(view, {
            route: 'entity/user',
            params: params
        })
            .addEventListener('load', function() {
                view.thumbnail.onclick = function() {
                    view.avatarfile.click();
                };
                view.avatarfile.onchange = function() {
                    upload_photo(array(this.files), function() {
                        view.avatar.value = this.responseJSON.url;
                        view.avatar.change();
                    });
                };
                view.avatarfile.visible = false;
                append_content('wall', {type: 'wall', owner_id: params.id});
                view.visible = true;
            });
    }
};
