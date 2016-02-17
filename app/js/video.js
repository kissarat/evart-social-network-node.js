ui.video = {
    create: function() {
        var view = this;

        this.url.addEventListener('change', function() {
            query({
                route: 'video/oembed',
                params: {url: view.url.value},
                success: function(data) {
                    view.paste.innerHTML = data.html;
                }
            });
        });

        view.on('save', function() {
            query({
                method: 'PUT',
                route: 'video/oembed',
                params: {url: view.url.value},
                success: function(data) {
                    if (data.n > 0) {
                        go('video/index');
                    }
                }
            });
        });

        view.visible = true;
    },

    index: function(params) {
        var view = this;

        query({
            route: 'video/index',
            params: params,
            success: function(videos) {
                videos.forEach(function(info) {
                    function open() {
                        go('video/view', {id: info._id, owner_id: params.owner_id || localStorage.user_id})
                    }

                    var video = view.widget('video', info);
                    var tag = video.querySelector('img');
                    if (info.thumbnail_url) {
                        tag.src = info.thumbnail_url;
                    }
                    else if ('done' == info.status) {
                        tag.src = '/video/thumbnail/' + info._id + '.jpg';
                    }
                    else {
                        tag.remove();
                        tag = view.widget('video-in-processing');
                        video.appendChild(tag);
                    }
                    tag.addEventListener('click', open);
                    view.videos.appendChild(video);
                });
                view.visible = true;
            }
        })
    },

    view: function(params) {
        var view = this;
        query({
            route: 'video/view',
            params: params,
            success: function(data) {
                var video = view.querySelector('video');
                if (data.html) {
                    view.innerHTML = data.html;
                }
                else {
                    video.setAttribute('src', '/video/' + params.id + '.mp4');
                }
                append_content('wall', {
                    type: 'video',
                    video_id: params.id,
                    owner_id: params.owner_id
                });
                view.visible = true;
            }
        });
    }
};
