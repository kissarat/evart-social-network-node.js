var google_map;

ui.on('after render', function (tag) {
    if (tag && tag.dataset.geo) {
        tag.appendChild($button('Maps', function () {
            var geo = tag.dataset.geo.split('x');
            var position = new google.maps.LatLng(geo[0], geo[1]);
            var fullscreen = $id('map');
            //if (!google_map) {
                google_map = new google.maps.Map(fullscreen.querySelector('div'), {
                    zoom: 17
                });
            //}
            google_map.setCenter(position);
            new google.maps.Marker({
                position: position,
                map: google_map
            });
            fullscreen.classList.add('active');
        }));
    }
});
