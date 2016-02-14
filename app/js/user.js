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
                        login();
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
                    var buttons = w.querySelector('.buttons');
                    buttons.appendChild($button('View', function () {
                        go('user/view', {id: this.parentNode.id});
                    }));
                    buttons.appendChild($button('Chat', function () {
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

        query({
            route: 'user/view',
            params: params,
            success: function (data) {
                if (403 == this.status) {
                    view.innerHTML = $id('#user/blocked');
                }
                view.querySelector('.name').innerHTML = data.forename + ' ' + data.surname;
                if (403 == this.status) {
                    view.querySelector('.thumbnail').style.backgroundImage = data.avatar;
                    view.visible = true;
                    return;
                }

                /*
                var labels = {
                    //forename: 'Forename',
                    //surname: 'Surname',
                    country: 'Country',
                    city: 'City'
                };
                var fields = view.querySelector('.fields');
                for (var key in labels) {
                    if (data[key]) {
                        fields.appendChild(view.widget('field', {
                            label: labels[key],
                            value: data[key]
                        }));
                    }
                }

                if (params.id == localStorage.user_id) {
                    view.thumbnail.onclick = function () {
                        view.avatarfile.click();
                    };

                    view.avatarfile.onchange = function () {
                        upload_photo(array(this.files), function () {
                            view.avatar.value = this.responseJSON.url;
                            view.avatar.change();
                        });
                    };

                    view.avatar.addEventListener('change', function () {
                        view.thumbnail.background = view.avatar.value;
                    });
                }
                */

                view.avatarfile.visible = false;
                append_content('wall', {type: 'wall', owner_id: params.id});

                if (!user.friends) {
                    user.friends = [];
                }
                if (!user.blacks) {
                    user.blacks = [];
                }

                var buttons = view.querySelector('.buttons');
                view.friends_count.innerHTML = user.friends.length;
                if (params.id != localStorage.user_id) {
                    var is_friend = user.friends.indexOf(params.id) >= 0;
                    var is_black = user.blacks.indexOf(params.id) >= 0;
                    if (!is_black) {
                        buttons.appendChild($button(is_friend ? 'Remove Friend' : 'Add Friend', function () {
                            query({
                                route: 'user/list',
                                params: {
                                    l: 'friends',
                                    'do': is_friend ? 'remove' : 'add',
                                    target_id: params.id
                                },
                                success: function () {
                                    User.loadMe(reload);
                                }
                            })
                        }));
                    }
                    if (!is_friend) {
                        buttons.appendChild($button(is_black ? 'Unblock' : 'Block', function () {
                            query({
                                route: 'user/list',
                                params: {
                                    l: 'blacks',
                                    'do': is_black ? 'remove' : 'add',
                                    target_id: params.id
                                },
                                success: function () {
                                    User.loadMe(reload);
                                }
                            })
                        }));
                    }
                }

                view.visible = true;
            }
        });

    }
};
