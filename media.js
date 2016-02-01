function Peer(source_id) {
    this.source_id = source_id || localStorage.user_id || Math.round(Math.random() * 100);
    this.connection = new RTCPeerConnection(null, {optional: []});
    this.connection.onicecandidate = this.onicecandidate.bind(this);
    this.connection.onaddstream = this.onaddstream.bind(this);
    this.connection.oniceconnectionstatechange = morozov;
    this.trace('constructed')
}

Peer.prototype = {
    onicecandidate: function (e) {
        console.log(this.source_id, e);
        if (e.candidate) {

        }
        else {
            this.trace('No candidate', 'error');
        }
    },

    trace: function (message, type) {
        if (!type) {
            type = 'log';
        }
        console[type](this.source_id + ': ' + message);
    },

    onaddstream: function (stream) {
        this.stream = stream;
    },

    offer: function (call) {
        this.connection.createOffer(call, morozov, {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        });
    }
};

var peer;
server.on('login', function () {
    peer = new Peer();
    server.getMedia(localStorage.user_id, 'offer', function (offer) {
        if (offer.error && !offer.error.media_found) {
            peer.offer(function (offer) {
                server.setMedia(localStorage.user_id, 'offer', {
                    type: 'offer',
                    sdp: offer.sdp
                });
                peer.connection.setLocalDescription(offer, morozov, morozov);
            })
        }
        else {
            peer.connection.setRemoteDescription(offer, morozov, morozov);
        }
    });
});
