//var iceServerConfig = {
//    iceServers: [
//        {
//            url: isChrome
//                ? 'stun:stun.l.google.com:19302'
//                : 'stun:23.21.150.121'
//        },
//        {
//            url: 'turn:homeo@turn.bistri.com:80',
//            credential: 'homeo'
//        }
//    ]
//};


var iceServerConfig = {
    'iceServers': [
        {
            'url': 'stun:stun.l.google.com:19302'
        },
        {
            'url': 'turn:192.158.29.39:3478?transport=udp',
            'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            'username': '28224511:1379330808'
        },
        {
            'url': 'turn:192.158.29.39:3478?transport=tcp',
            'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            'username': '28224511:1379330808'
        }
    ]
};


function Peer(source_id, servers) {
    this.source_id = source_id || localStorage.user_id || Math.round(Math.random() * 100);
    this.connection = new RTCPeerConnection(servers, {optional: []});
    this.connection.addEventListener('icecandidate', this.onicecandidate.bind(this));
    this.connection.addEventListener('addstream', this.onaddstream.bind(this));
    this.connection.addEventListener('iceconnectionstatechange', morozov);
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

    offer: function (target_id) {
        var self = this;
        this.connection.createOffer(function (offer) {
            self.connection.setLocalDescription(offer, function () {
                server.send(target_id, {
                    type: 'offer',
                    sdp: offer.sdp
                })
            }, morozov);
        }, morozov, {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        });

        this.connection.addEventListener('icecandidate', function (e) {
            server.send(target_id, e.candidate);
        });
    },

    answer: function (source_id) {
        var self = this;
        server.on('offer', function (offer) {
            offer = new RTCSessionDescription(offer);
            self.connection.setRemoteDescription(offer, morozov, morozov);
            self.connection.createAnswer(function (answer) {
                self.connection.setLocalDescription(answer, function () {
                        server.send(source_id, {
                            type: 'answer',
                            sdp: offer.sdp
                        })
                    },
                    morozov);
            });
        });
        this.connection.addEventListener('icecandidate', function (e) {
            server.send(source_id, e.candidate);
        });
    },

    addMediaStream: function () {
        var connection = this.connection;
        navigator.getUserMedia({audio: true, video: true}, function (mediaStream) {
            connection.addStream(mediaStream);
        }, morozov);
    }
};

var peer;

server.on('login', function () {
    peer = new Peer(null, iceServerConfig);
    server.on('candidate', function (data) {
        var candidate = new RTCIceCandidate(data);
        peer.connection.addIceCandidate(candidate);
    });
    //server.getMedia(localStorage.user_id, 'offer', function (offer) {
    //    if (offer.error && !offer.error.media_found) {
    //        peer.offer(function (offer) {
    //            server.setMedia(localStorage.user_id, 'offer', {
    //                type: 'offer',
    //                sdp: offer.sdp
    //            });
    //            peer.connection.setLocalDescription(offer, morozov, morozov);
    //        })
    //    }
    //    else {
    //        peer.connection.setRemoteDescription(offer, morozov, morozov);
    //    }
    //});
});
